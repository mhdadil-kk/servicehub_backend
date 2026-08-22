export interface WalletResponseDTO {
  _id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

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
