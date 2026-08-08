export interface ITransaction {
  id: string;
  walletId: string;
  userId: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  referenceId?: string;
  status: "pending" | "success" | "failed";
  createdAt?: Date;
  updatedAt?: Date;
}
