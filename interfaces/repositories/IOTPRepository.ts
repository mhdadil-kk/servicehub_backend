import { IOTP } from "../../models/otp.model";
import { IRepository } from "./IRepository";

export interface IOTPRepository extends IRepository<IOTP> {
  findLatest(userId: string, type: string): Promise<IOTP | null>;
  deleteByUserId(userId: string): Promise<void>;
}
