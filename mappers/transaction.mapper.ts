import { ITransaction } from "../models/transaction.model";

export interface TransactionResponseDTO {
  _id: string;
  walletId: string;
  userId: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  referenceId?: string;
  status: "pending" | "success" | "failed";
  createdAt: string;
  updatedAt: string;
}

export class TransactionMapper {
  static toResponse(transaction: ITransaction | any): TransactionResponseDTO | null {
    if (!transaction) return null;

    const t = typeof transaction.toObject === 'function' ? transaction.toObject() : transaction;

    return {
      _id: t._id.toString(),
      walletId: t.walletId.toString(),
      userId: t.userId.toString(),
      type: t.type,
      amount: t.amount,
      description: t.description,
      referenceId: t.referenceId?.toString(),
      status: t.status,
      createdAt: new Date(t.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(t.updatedAt || Date.now()).toISOString(),
    };
  }

  static toArrayResponse(transactions: any[]): TransactionResponseDTO[] {
    return transactions.map(tx => this.toResponse(tx)!);
  }
}
