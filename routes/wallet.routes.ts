import { Router } from "express";
import { WalletController } from "../controllers/wallet.controller";
import { WalletService } from "../services/wallet.service";
import { WalletRepository } from "../repositories/wallet.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { ROUTES } from "../constants/routes";

const router = Router();

const walletRepository = new WalletRepository();
const transactionRepository = new TransactionRepository();
const walletService = new WalletService(walletRepository, transactionRepository);
const walletController = new WalletController(walletService);

router.get(ROUTES.WALLET.GET, authMiddleware, walletController.getWalletData);

export default router;