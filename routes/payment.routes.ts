import { Router } from "express";
import { paymentService } from "../di/container"; 
import { PaymentController } from "../controllers/payment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";


const router = Router();
const paymentController = new PaymentController(paymentService);

router.post("/webhook", paymentController.handleStripeWebhook);

router.use(authMiddleware);

router.post("/create-checkout-session", paymentController.createCheckoutSession);
router.post("/verify-payment", paymentController.verifyAndFinalizePayment);
router.post("/wallet-pay", paymentController.payWithWallet);

export default router;