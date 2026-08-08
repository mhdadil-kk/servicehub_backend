import { ITransaction } from "../../types/transaction.types";
import mongoose from "mongoose";

export interface ITransactionRepository {
    sumByUserId(userId: string, type: "credit" | "debit", status?: "pending" | "success" | "failed"): Promise<number>;
    createTransaction(data: {
        walletId: string;
        userId: string;
        type: "credit" | "debit";
        amount: number;
        description: string;
        referenceId?: string;
        status?: "pending" | "success" | "failed";
    }): Promise<ITransaction>;
    findByWalletId(walletId: string): Promise<ITransaction[]>;
    getTotalRevenue(dateFilter?: mongoose.FilterQuery<ITransaction>): Promise<number>;
    getRevenueByMonth(dateFilter?: mongoose.FilterQuery<ITransaction>): Promise<{ month: string; year: number; revenue: number }[]>;
}

