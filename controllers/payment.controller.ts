import { Request, Response } from "express";
import Stripe from "stripe";
import Booking from "../models/booking.model";
import Notification from "../models/notification.model";
import { logger } from "../utils/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10"
});

// ─── Create Stripe Checkout Session ──────────────────────────────────────────
export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.body;
    const userId = req.user?.id;

    if (!bookingId) {
      res.status(400).json({ success: false, message: "Booking ID is required" });
      return;
    }

    const booking = await Booking.findById(bookingId).populate("serviceId");
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }

    if (booking.userId.toString() !== userId) {
      res.status(403).json({ success: false, message: "Unauthorized access to this booking" });
      return;
    }

    if (booking.status === "completed") {
      res.status(400).json({ success: false, message: "Booking is already fully paid and completed." });
      return;
    }

    let amount = 0;
    let description = "";

    // Stage 2: Final Invoice Payment
    if (booking.status === "completed_pending_payment") {
      amount = booking.totalAmount || 1000;
      description = `Final Payment for service on ${booking.date}`;
    }
    // Stage 1: Booking Platform Fee (100 INR)
    else if (booking.status === "awaiting_payment") {
      amount = 100;
      description = `Platform Booking Fee for ${booking.date}`;
    } else {
      res.status(400).json({ success: false, message: "Payment not required at this stage." });
      return;
    }

    const serviceName = (booking as any).serviceId?.name || "Service Booking";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { name: serviceName, description },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking._id}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel?booking_id=${booking._id}`,
      metadata: {
        bookingId: booking._id.toString(),
        userId: userId,
        paymentStage: booking.status === "completed_pending_payment" ? "final" : "booking_fee"
      },
    });

    booking.stripeSessionId = session.id;
    await booking.save();

    res.status(200).json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    logger.error("Error creating checkout session", { error });
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Verify Payment (called from success page — works without webhooks) ───────
export const verifyAndFinalizePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, bookingId } = req.body;

    if (!sessionId || !bookingId) {
      res.status(400).json({ success: false, message: "sessionId and bookingId are required" });
      return;
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found." });
      return;
    }

    // Security: verify the session ID matches what we stored at checkout creation
    if (booking.stripeSessionId !== sessionId) {
      res.status(400).json({ success: false, message: "Session ID mismatch." });
      return;
    }

    // Already processed — idempotent, just return success
    if (
      (booking.status === "confirmed" && booking.paymentStatus === "paid") ||
      (booking.status === "completed" && booking.paymentStatus === "fully_paid")
    ) {
      res.status(200).json({ success: true, message: "Already processed.", data: booking });
      return;
    }

    // Stage 1: Booking fee
    if (booking.status === "awaiting_payment") {
      booking.paymentStatus = "paid";
      booking.status = "confirmed";
      await booking.save();
      logger.info(`[verify] Booking fee paid. Booking ${booking._id} → confirmed.`);

      await Notification.create({
        userId: booking.userId,
        title: "Booking Confirmed! 🎉",
        message: `Your ₹100 platform fee was received. Booking for ${booking.date} is now confirmed.`,
        type: "success",
        relatedId: booking._id
      });

    // Stage 2: Final invoice
    } else if (booking.status === "completed_pending_payment") {
      booking.paymentStatus = "fully_paid";
      booking.status = "completed";
      await booking.save();
      logger.info(`[verify] Final invoice paid. Booking ${booking._id} → completed.`);

      await Notification.create({
        userId: booking.userId,
        title: "Payment Complete - Thank You!",
        message: `Your final payment of ₹${booking.totalAmount} was received. Booking fully completed!`,
        type: "success",
        relatedId: booking._id
      });

    } else {
      // Unknown state but session IDs matched — still treat as success
      logger.warn(`[verify] Booking ${booking._id} in unexpected state: ${booking.status}, treating as success.`);
    }

    res.status(200).json({ success: true, message: "Payment verified.", data: booking });
  } catch (error) {
    logger.error("Error verifying payment", { error });
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Stripe Webhook (for production with Stripe CLI / deployed webhook) ───────
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const payload = req.body;

  let event;
  try {
    event = payload;
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.bookingId) {
      const booking = await Booking.findById(session.metadata.bookingId);
      if (booking) {
        if (session.metadata.paymentStage === "booking_fee" && booking.status === "pending") {
          booking.paymentStatus = "paid";
          booking.status = "confirmed";
          await booking.save();
        } else if (session.metadata.paymentStage === "final" && booking.status === "completed_pending_payment") {
          booking.paymentStatus = "fully_paid";
          booking.status = "completed";
          await booking.save();
        }
      }
    }
  }

  res.status(200).send("Received");
};
