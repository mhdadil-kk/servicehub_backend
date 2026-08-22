import { IWalletRepository } from "../interfaces/repositories/IWalletRepository";
import { ITransactionRepository } from "../interfaces/repositories/ITransactionRepository";
import { IWalletService } from "../interfaces/services/IWalletService";
import { WalletResponseDTO, TransactionResponseDTO } from "../dtos/wallet.dto";
import { WalletMapper } from "../mappers/wallet.mapper";
import { TransactionMapper } from "../mappers/transaction.mapper";

export class WalletService implements IWalletService {
  constructor(
    private _walletRepository: IWalletRepository,
    private _transactionRepository: ITransactionRepository
  ) {}

  async getWallet(userId: string): Promise<WalletResponseDTO> {
    const wallet = await this._walletRepository.findOrCreateByUserId(userId);
    return WalletMapper.toResponse(wallet)!;
  }

  async getHistory(userId: string): Promise<TransactionResponseDTO[]> {
    const wallet = await this._walletRepository.findOrCreateByUserId(userId);
    const transactions = await this._transactionRepository.findByWalletId(wallet.id);
    return TransactionMapper.toArrayResponse(transactions);
  }

  async credit(userId: string, amount: number, description: string, referenceId?: string): Promise<TransactionResponseDTO> {
    const wallet = await this._walletRepository.findOrCreateByUserId(userId);

    const transaction = await this._transactionRepository.createTransaction({
      walletId: wallet.id,
      userId,
      type: "credit",
      amount,
      description,
      referenceId,
    });

    await this._walletRepository.updateBalance(wallet.id, wallet.balance + amount);
    return TransactionMapper.toResponse(transaction)!;
  }

  async debit(userId: string, amount: number, description: string, referenceId?: string): Promise<TransactionResponseDTO> {
    const wallet = await this._walletRepository.findOrCreateByUserId(userId);

    const transaction = await this._transactionRepository.createTransaction({
      walletId: wallet.id,
      userId,
      type: "debit",
      amount,
      description,
      referenceId,
    });

    await this._walletRepository.updateBalance(wallet.id, wallet.balance - amount);
    return TransactionMapper.toResponse(transaction)!;
  }

  async logExpense(userId: string, amount: number, description: string, referenceId?: string): Promise<TransactionResponseDTO> {
    const wallet = await this._walletRepository.findOrCreateByUserId(userId);
    const transaction = await this._transactionRepository.createTransaction({
      walletId: wallet.id,
      userId,
      type: "debit",
      amount,
      description,
      referenceId,
    });
    return TransactionMapper.toResponse(transaction)!;
  }
}
