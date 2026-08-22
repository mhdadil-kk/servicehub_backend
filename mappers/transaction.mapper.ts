import { ITransaction } from "../types/transaction.types";
import { TransactionResponseDTO } from "../dtos/wallet.dto";

export class TransactionMapper {
  static toResponse(transaction: ITransaction & { toObject?: () => ITransaction }): TransactionResponseDTO | null {
    if (!transaction) return null;

    const t = typeof transaction.toObject === 'function' ? transaction.toObject() : transaction;

    return {
      _id: t._id?.toString() || t.id || "",
      walletId: t.walletId ? t.walletId.toString() : "",
      userId: t.userId ? t.userId.toString() : "",
      type: t.type,
      amount: t.amount,
      description: t.description,
      referenceId: t.referenceId?.toString(),
      status: t.status,
      createdAt: new Date(t.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(t.updatedAt || Date.now()).toISOString(),
    };
  }

  static toArrayResponse(transactions: (ITransaction & { toObject?: () => ITransaction })[]): TransactionResponseDTO[] {
    return transactions.map(tx => this.toResponse(tx)!);
  }
}
