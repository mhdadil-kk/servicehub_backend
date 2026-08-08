import TransactionModel, { ITransactionDocument } from "../models/transaction.model";
import { ITransaction } from "../types/transaction.types";
import { BaseRepository } from "./base.repository";
import mongoose, { FilterQuery } from "mongoose";
import { ITransactionRepository } from "../interfaces/repositories/ITransactionRepository";

export class TransactionRepository
    extends BaseRepository<ITransactionDocument>
    implements ITransactionRepository {
    constructor() {
        super(TransactionModel);
    }

    async sumByUserId(
        userId: string,
        type: "credit" | "debit",
        status: "pending" | "success" | "failed" = "success"
    ): Promise<number> {
        const result = await this.model.aggregate<{ total: number }>([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    type,
                    status,
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                },
            },
        ]);

        return result[0]?.total ?? 0;
    }
    async createTransaction(data: {
        walletId: string;
        userId: string;
        type: "credit" | "debit";
        amount: number;
        description: string;
        referenceId?: string;
        status?: "pending" | "success" | "failed";
    }): Promise<ITransaction> {
        return this.create({
            walletId: data.walletId,
            userId: data.userId,
            type: data.type,
            amount: data.amount,
            description: data.description,
            referenceId: data.referenceId,
            status: data.status ?? "success",
        } as unknown as Partial<ITransactionDocument>) as unknown as ITransaction;
    }
    async findByWalletId(walletId: string): Promise<ITransaction[]> {
        return this.model
            .find({ walletId } as FilterQuery<ITransactionDocument>)
            .sort({ createdAt: -1 })
            .populate("referenceId")
            .exec() as unknown as ITransaction[];
    }

    async getTotalRevenue(dateFilter: FilterQuery<ITransactionDocument> = {}): Promise<number> {
    
        const result = await this.model.aggregate([
            { $match: { status: "success", type: "credit", ...dateFilter } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        return result.length > 0 ? result[0].total : 0;
    }

    async getRevenueByMonth(dateFilter: FilterQuery<ITransactionDocument> = {}): Promise<{ month: string; year: number; revenue: number }[]> {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const result = await this.model.aggregate([
            { $match: { status: "success", type: "credit", ...dateFilter } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    revenue: { $sum: "$amount" },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);
        return result.map((r) => ({
            month: monthNames[r._id.month - 1],
            year: r._id.year,
            revenue: r.revenue,
        }));
    }
}
