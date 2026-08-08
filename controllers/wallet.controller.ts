import { Request, Response } from "express";
import { IWalletService } from "../interfaces/services/IWalletService";
import { HttpStatusCode } from "../types/http";
import { createSuccessResponse } from "../types/response";
import { SUCCESS_MESSAGES } from "../constants/messages";
import { WalletMapper } from "../mappers/wallet.mapper";
import { TransactionMapper } from "../mappers/transaction.mapper";
import { asyncHandler } from "../utils/async-handler";

export class WalletController {
  constructor(private _walletService: IWalletService) {}

  getWalletData = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const wallet = await this._walletService.getWallet(userId);
    const transactions = await this._walletService.getHistory(userId);

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse({ 
        wallet: WalletMapper.toResponse(wallet), 
        transactions: TransactionMapper.toArrayResponse(transactions) 
      }, SUCCESS_MESSAGES.WALLET_FETCHED)
    );
  });
}