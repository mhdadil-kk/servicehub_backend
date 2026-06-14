import express from "express";
import { createCheckoutSession, handleStripeWebhook, verifyAndFinalizePayment } from "../controllers/payment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

// Webhook endpoint (doesn't need auth, Stripe calls this directly)
router.post("/webhook", handleStripeWebhook);

// Protected endpoints
router.post("/create-checkout-session", authMiddleware, createCheckoutSession);
router.post("/verify-payment", authMiddleware, verifyAndFinalizePayment);

export default router;
