import { ITransaction } from "../../models/transaction.model";

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
}
