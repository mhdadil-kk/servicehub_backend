import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { UnauthorizedError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED);
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token); 
    req.user = { id: decoded.id, role: decoded.role as "user" | "provider" | "admin" };
    next();
  } catch (error) {
    next(error);
  }
};
