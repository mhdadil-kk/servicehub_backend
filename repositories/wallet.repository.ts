import WalletModel, { IWallet } from "../models/wallet.model";
import { BaseRepository } from "./base.repository";
import { FilterQuery } from "mongoose"
import { IWalletRepository } from "../interfaces/repositories/IWalletRepository";

export class WalletRepository
    extends BaseRepository<IWallet>
    implements IWalletRepository {
    constructor() {
        super(WalletModel);
    }
    async findByUserId(userId: string): Promise<IWallet | null> {
        return this.findOne({ userId } as FilterQuery<IWallet>);
    }
    async findOrCreateByUserId(userId: string): Promise<IWallet> {
        let wallet = await this.findByUserId(userId);
        if (!wallet) {
            wallet = await this.create({ userId, balance: 0, currency: "INR" } as Partial<IWallet>);
        }
        return wallet;
    }
    async updateBalance(walletId: string, balance: number): Promise<IWallet | null> {
        return this.update(walletId, { balance });
    }
}