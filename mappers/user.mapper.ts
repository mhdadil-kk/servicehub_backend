import { IUser, UserResponseDTO } from "../types/user.types";

export class UserMapper {
  static toResponse(data: unknown): UserResponseDTO | UserResponseDTO[] | null {
    if (Array.isArray(data)) {
      return data.map(user => UserMapper.toResponse(user) as UserResponseDTO);
    }

    if (!data) return null;

    const userObj = (typeof (data as any).toObject === 'function') 
      ? (data as any).toObject() 
      : data;

   
    const { password: _p, __v: _v, isDeleted: _d, ...safeUser } = userObj as any; 
    
    return safeUser as UserResponseDTO;
  }
}
