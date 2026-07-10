import { Request, Response, NextFunction } from "express";
import { IWalletService } from "../interfaces/services/IWalletService";
import { HttpStatusCode } from "../types/http";
import { createSuccessResponse } from "../types/response";
import { SUCCESS_MESSAGES } from "../constants/messages";
import { WalletMapper } from "../mappers/wallet.mapper";
import { TransactionMapper } from "../mappers/transaction.mapper";

export class WalletController {
  private  _walletService: IWalletService;
  constructor(walletService: IWalletService) {
    this._walletService = walletService;
  }

  getWalletData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const wallet = await this._walletService.getWallet(userId);
      const transactions = await this._walletService.getHistory(userId);

      res.status(HttpStatusCode.OK).json(
        createSuccessResponse({ 
          wallet: WalletMapper.toResponse(wallet), 
          transactions: TransactionMapper.toArrayResponse(transactions) 
        }, SUCCESS_MESSAGES.WALLET_FETCHED)
      );
    } catch (error) {
      next(error);
    }
  };
}