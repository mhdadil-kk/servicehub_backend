import { Request, Response, NextFunction } from "express";
import { IWalletService } from "../interfaces/services/IWalletService";
import { HttpStatusCode } from "../types/http";
import { createSuccessResponse } from "../types/response";
import { SUCCESS_MESSAGES } from "../constants/messages";

export class WalletController {
  private readonly _walletService: IWalletService;
  constructor(walletService: IWalletService) {
    this._walletService = walletService;
  }

  getWalletData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const wallet = await this._walletService.getWallet(userId);
      const transactions = await this._walletService.getHistory(userId);

      res.status(HttpStatusCode.OK).json(
        createSuccessResponse({ wallet, transactions }, SUCCESS_MESSAGES.WALLET_FETCHED)
      );
    } catch (error) {
      next(error);
    }
  };
}