import { FilterQuery } from "mongoose";
import WalletModel, { IWalletDocument } from "../models/wallet.model";
import { IWallet } from "../types/wallet.types";
import { BaseRepository } from "./base.repository";

import { IWalletRepository } from "../interfaces/repositories/IWalletRepository";

export class WalletRepository
    extends BaseRepository<IWalletDocument>
    implements IWalletRepository {
    constructor() {
        super(WalletModel);
    }
    async findByUserId(userId: string): Promise<IWallet | null> {
        return this.findOne({ userId } as FilterQuery<IWalletDocument>) as unknown as IWallet | null;
    }
    async findOrCreateByUserId(userId: string): Promise<IWallet> {
        let wallet = await this.findByUserId(userId);
        if (!wallet) {
            wallet = await super.create({ userId, balance: 0, currency: "INR" } as unknown as Partial<IWalletDocument>) as unknown as IWallet;
        }
        return wallet;
    }
    async updateBalance(walletId: string, balance: number): Promise<IWallet | null> {
        return this.update(walletId, { balance } as unknown as Partial<IWalletDocument>) as unknown as IWallet | null;
    }
}
