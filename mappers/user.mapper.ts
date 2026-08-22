import { IUser } from "../types/user.types";
import { UserResponseDTO } from "../dtos/auth.dto";

export class UserMapper {
  static toResponse(data: unknown): UserResponseDTO | UserResponseDTO[] | null {
    if (Array.isArray(data)) {
      return data.map(user => UserMapper.toSingleResponse(user)!).filter(Boolean);
    }
    return UserMapper.toSingleResponse(data);
  }

  private static toSingleResponse(data: unknown): UserResponseDTO | null {
    if (!data) return null;

    const userObj = (typeof (data as { toObject?: () => IUser }).toObject === 'function') 
      ? (data as { toObject: () => IUser }).toObject() 
      : (data as IUser);

    return {
      id: userObj._id?.toString() || userObj.id || "",
      name: userObj.name || "",
      email: userObj.email || "",
      phone: userObj.phone,
      role: userObj.role,
      profilePhoto: userObj.profilePhoto,
      is_verified: Boolean(userObj.is_verified),
      status: userObj.status || "pending",
      createdAt: userObj.createdAt || new Date(),
      updatedAt: userObj.updatedAt || new Date(),
    };
  }
}
