import { IReport } from "../../types/report.types";
import mongoose from "mongoose";

export interface IReportRepository {
  create(data: Partial<IReport>): Promise<IReport>;
  findById(id: string): Promise<IReport | null>;
  findByIdPopulated(id: string): Promise<IReport | null>;
  findByReporterId(reporterId: string): Promise<IReport[]>;
  findAllPopulated(filter?: mongoose.FilterQuery<IReport>, sort?: Record<string, mongoose.SortOrder>, limit?: number, skip?: number): Promise<IReport[]>;
  findReports(filter?: mongoose.FilterQuery<IReport>, page?: number, limit?: number): Promise<{ reports: IReport[]; total: number }>;
  update(id: string, data: Partial<IReport>): Promise<IReport | null>;
  count(filter?: mongoose.FilterQuery<IReport>): Promise<number>;
}