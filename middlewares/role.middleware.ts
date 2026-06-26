import { Request, Response, NextFunction } from "express";
import { ERROR_MESSAGES } from "../constants/messages";
import { ForbiddenError } from "../utils/error";

export const roleMiddleware = (allowedRoles: ("user" | "provider" | "admin")[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;
      if (!userRole || !allowedRoles.includes(userRole)) {
        throw new ForbiddenError(ERROR_MESSAGES.FORBIDDEN);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};