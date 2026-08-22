import { IWallet } from "../types/wallet.types";
import { WalletResponseDTO } from "../dtos/wallet.dto";

export class WalletMapper {
  static toResponse(wallet: IWallet & { toObject?: () => IWallet }): WalletResponseDTO | null {
    if (!wallet) return null;

    const w = typeof wallet.toObject === 'function' ? wallet.toObject() : wallet;

    return {
      _id: w._id?.toString() || w.id || "",
      userId: w.userId ? w.userId.toString() : "",
      balance: w.balance,
      currency: w.currency || "INR",
      createdAt: new Date(w.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(w.updatedAt || Date.now()).toISOString(),
    };
  }
}
