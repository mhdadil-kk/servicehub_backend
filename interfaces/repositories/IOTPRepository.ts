import { IOTP } from "../../types/auth.types";
import { IRepository } from "./IRepository";

export interface IOTPRepository extends IRepository<IOTP> {
  findLatest(userId: string, type: string): Promise<IOTP | null>;
  deleteByUserId(userId: string): Promise<void>;
}

