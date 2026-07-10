import { IWallet } from "../models/wallet.model";

export interface WalletResponseDTO {
  _id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export class WalletMapper {
  static toResponse(wallet: IWallet | any): WalletResponseDTO | null {
    if (!wallet) return null;

    const w = typeof wallet.toObject === 'function' ? wallet.toObject() : wallet;

    return {
      _id: w._id.toString(),
      userId: w.userId.toString(),
      balance: w.balance,
      currency: w.currency || "INR",
      createdAt: new Date(w.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(w.updatedAt || Date.now()).toISOString(),
    };
  }
}
