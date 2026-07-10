import { IReport } from "../../models/report.model";

export interface IReportRepository {
  create(data: Partial<IReport>): Promise<IReport>;
  findById(id: string): Promise<IReport | null>;
  findByReporterId(reporterId: string): Promise<IReport[]>;
  findReports(filter?: any, page?: number, limit?: number): Promise<{ reports: IReport[]; total: number }>;
  update(id: string, data: Partial<IReport>): Promise<IReport | null>;
  count(filter?: any): Promise<number>;
}
