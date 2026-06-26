import { IWalletRepository } from "../interfaces/repositories/IWalletRepository";
import { ITransactionRepository } from "../interfaces/repositories/ITransactionRepository";
import { IWallet } from "../models/wallet.model";
import { ITransaction } from "../models/transaction.model";
import { IWalletService } from "../interfaces/services/IWalletService";

export class WalletService implements IWalletService {
    private _walletRepository: IWalletRepository;
  private _transactionRepository: ITransactionRepository;
  constructor(
    walletRepository: IWalletRepository,
    transactionRepository: ITransactionRepository
  ) {
    this._walletRepository = walletRepository;
    this._transactionRepository = transactionRepository;
}

  async getWallet(userId: string): Promise<IWallet> {
    return this._walletRepository.findOrCreateByUserId(userId);
  }

  async getHistory(userId: string): Promise<ITransaction[]> {
    const wallet = await this.getWallet(userId);
    return this._transactionRepository.findByWalletId(wallet._id.toString());
  }

  async credit(userId: string, amount: number, description: string, referenceId?: string): Promise<ITransaction> {
    const wallet = await this.getWallet(userId);

    const transaction = await this._transactionRepository.createTransaction({
      walletId: wallet._id.toString(),
      userId,
      type: "credit",
      amount,
      description,
      referenceId,
    });

    await this._walletRepository.updateBalance(wallet._id.toString(), wallet.balance + amount);
    return transaction;
  }

  async debit(userId: string, amount: number, description: string, referenceId?: string): Promise<ITransaction> {
    const wallet = await this.getWallet(userId);

    const transaction = await this._transactionRepository.createTransaction({
      walletId: wallet._id.toString(),
      userId,
      type: "debit",
      amount,
      description,
      referenceId,
    });

    await this._walletRepository.updateBalance(wallet._id.toString(), wallet.balance - amount);
    return transaction;
  }

  async logExpense(userId: string, amount: number, description: string, referenceId?: string): Promise<ITransaction> {
    const wallet = await this.getWallet(userId);
    return this._transactionRepository.createTransaction({
      walletId: wallet._id.toString(),
      userId,
      type: "debit",
      amount,
      description,
      referenceId,
    });
  }
}