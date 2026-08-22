import { Router } from "express";
import { paymentService } from "../di/container";
import { PaymentController } from "../controllers/payment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { ROUTES } from "../constants/routes";

const router = Router();
const paymentController = new PaymentController(paymentService);

router.post(ROUTES.PAYMENTS.WEBHOOK, paymentController.handleWebhook);

router.use(authMiddleware);

router.post(ROUTES.PAYMENTS.CREATE_CHECKOUT, paymentController.createCheckoutSession);
router.post(ROUTES.PAYMENTS.VERIFY, paymentController.verifyPayment);
router.post(ROUTES.PAYMENTS.WALLET_PAY, paymentController.payWithWallet);

export default router;