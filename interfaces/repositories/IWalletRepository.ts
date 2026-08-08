import { IWallet } from "../../types/wallet.types";

export interface IWalletRepository {
    findByUserId(userId: string): Promise<IWallet | null>
    findOrCreateByUserId(userId: string): Promise<IWallet>;
    updateBalance(walletId: string, balance: number): Promise<IWallet | null>
}
