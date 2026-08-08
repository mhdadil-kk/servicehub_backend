import { Router } from "express";
import { walletService } from "../di/container"; 
import { WalletController } from "../controllers/wallet.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { ROUTES } from "../constants/routes";

const router = Router();
const walletController = new WalletController(walletService);

router.get(ROUTES.WALLET.GET, authMiddleware, walletController.getWalletData);

export default router;