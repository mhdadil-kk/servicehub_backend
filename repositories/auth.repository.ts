import { UserModel, IUser } from "../models/user.model";
import { BaseRepository } from "../repositories/base.repository";
import { IUserRepository } from "../interfaces/repositories/IUserRepository";

export class AuthRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await this.model.findOne({ email }).exec();
  }

  async updateById(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return this.update(id, data);
  }

  async findIdsByRoleAndName(role: string, name: string): Promise<string[]> {
    const users = await this.model.find({
      role,
      name: { $regex: name, $options: "i" }
    }).select("_id").exec();
    
    return users.map((u: any) => u._id.toString());
  }

  async countByRole(role: string, dateFilter: any = {}): Promise<number> {
    return this.model.countDocuments({ role, isDeleted: { $ne: true }, ...dateFilter }).exec();
  }

  async getUserGrowth(dateFilter: any = {}, timeRange?: string): Promise<any[]> {
    const groupId: any = { year: { $year: "$created_at" }, role: "$role" };
    let sortObj: any = { "_id.year": 1 };

    if (timeRange === "year") {
      groupId.month = { $month: "$created_at" };
      sortObj = { "_id.year": 1, "_id.month": 1 };
    } else if (timeRange === "month") {
      groupId.month = { $month: "$created_at" };
      groupId.day = { $dayOfMonth: "$created_at" };
      sortObj = { "_id.year": 1, "_id.month": 1, "_id.day": 1 };
    }

    return this.model.aggregate([
      { $match: { role: { $in: ["user", "provider"] }, isDeleted: { $ne: true }, ...dateFilter } },
      {
        $group: {
          _id: groupId,
          count: { $sum: 1 }
        }
      },
      { $sort: sortObj }
    ]);
  }
}
