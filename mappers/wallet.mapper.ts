import { IWallet } from "../types/wallet.types";

export interface WalletResponseDTO {
  _id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export class WalletMapper {
  static toResponse(wallet: IWallet & { toObject?: () => IWallet }): WalletResponseDTO | null {
    if (!wallet) return null;

    const w = typeof wallet.toObject === 'function' ? wallet.toObject() : wallet;

    return {
      _id: (w as IWallet & { _id?: { toString: () => string }; id?: string })._id?.toString() || (w as IWallet & { id?: string }).id || "",
      userId: w.userId.toString(),
      balance: w.balance,
      currency: w.currency || "INR",
      createdAt: new Date(w.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(w.updatedAt || Date.now()).toISOString(),
    };
  }
}
