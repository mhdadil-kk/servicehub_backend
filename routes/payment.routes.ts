import express from "express";
import { PaymentController } from "../controllers/payment.controller";
import { PaymentService } from "../services/payment.service";
import { BookingRepository } from "../repositories/booking.repository";
import { WalletRepository } from "../repositories/wallet.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { NotificationRepository } from "../repositories/notification.repository";
import { WalletService } from "../services/wallet.service";
import { NotificationService } from "../services/notification.service";
import { StripePaymentGateway } from "../gateways/stripe.gateway";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CreateCheckoutSchema, VerifyPaymentSchema } from "../dtos/payment.dto";
import { ROUTES } from "../constants/routes";

const router = express.Router();

const bookingRepository = new BookingRepository();
const walletRepository = new WalletRepository();
const transactionRepository = new TransactionRepository();
const notificationRepository = new NotificationRepository();

const walletService = new WalletService(walletRepository, transactionRepository);
const notificationService = new NotificationService(notificationRepository);
const paymentGateway = new StripePaymentGateway(process.env.STRIPE_SECRET_KEY ?? "");

const paymentService = new PaymentService(
  bookingRepository,
  walletService,
  notificationService,
  paymentGateway
);
const paymentController = new PaymentController(paymentService);

router.post(ROUTES.PAYMENTS.WEBHOOK, paymentController.handleStripeWebhook);

router.post(
  ROUTES.PAYMENTS.CREATE_CHECKOUT,
  authMiddleware,
  validate(CreateCheckoutSchema),
  paymentController.createCheckoutSession
);

router.post(
  ROUTES.PAYMENTS.VERIFY,
  authMiddleware,
  validate(VerifyPaymentSchema),
  paymentController.verifyAndFinalizePayment
);

router.post(
  ROUTES.PAYMENTS.WALLET_PAY,
  authMiddleware,
  paymentController.payWithWallet
);

export default router;