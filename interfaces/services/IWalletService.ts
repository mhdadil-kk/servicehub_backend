import { WalletResponseDTO, TransactionResponseDTO } from "../../dtos/wallet.dto";

export interface IWalletService {
  getWallet(userId: string): Promise<WalletResponseDTO>;
  getHistory(userId: string): Promise<TransactionResponseDTO[]>;
  credit(userId: string, amount: number, description: string, referenceId?: string): Promise<TransactionResponseDTO>;
  debit(userId: string, amount: number, description: string, referenceId?: string): Promise<TransactionResponseDTO>;
  logExpense(userId: string, amount: number, description: string, referenceId?: string): Promise<TransactionResponseDTO>;
}
