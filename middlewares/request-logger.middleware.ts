import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";


export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  next();
}
