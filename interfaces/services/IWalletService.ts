import { IWallet } from "../../models/wallet.model";
import { ITransaction } from "../../models/transaction.model";

export interface IWalletService {
  getWallet(userId: string): Promise<IWallet>;
  getHistory(userId: string): Promise<ITransaction[]>;
  credit(userId: string, amount: number, description: string, referenceId?: string): Promise<ITransaction>;
  debit(userId: string, amount: number, description: string, referenceId?: string): Promise<ITransaction>;
  logExpense(userId: string, amount: number, description: string, referenceId?: string): Promise<ITransaction>;
}
