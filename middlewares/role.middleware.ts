import { Response, NextFunction } from "express";
import { ERROR_MESSAGES } from "../constants/messages";

export class ForbiddenError extends Error {
  constructor(message: string = "Forbidden") {
    super(message);
    (this as any).statusCode = 403;
  }
}

export const roleMiddleware = (allowedRoles: ("user" | "provider" | "admin")[]) => {
  return (
    req: any,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userRole = req.user?.role;
      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenError(ERROR_MESSAGES.FORBIDDEN);
      }
      next();
    } catch (error) { next(error); }
  };
};
