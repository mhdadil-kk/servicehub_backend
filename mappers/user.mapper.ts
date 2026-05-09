import { IUser } from "../types/user.types";

export class UserMapper {
  static toResponse(data: any): any {
    if (Array.isArray(data)) {
      return data.map(user => UserMapper.toResponse(user));
    }

    if (!data) return null;

    const userObj = (data.toObject && typeof data.toObject === 'function') 
      ? data.toObject() 
      : data;

   
    const { password: _p, __v: _v, isDeleted: _d, ...safeUser } = userObj; 
    
    return safeUser;
  }
}
