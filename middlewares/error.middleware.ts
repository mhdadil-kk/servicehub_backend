import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/error";
import { logger } from "../utils/logger";
import { ERROR_MESSAGES } from "../constants/messages";
import { HttpStatusCode } from "../types/http";
import { createErrorResponse } from "../types/response";

export const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = (err instanceof AppError ? err.statusCode : undefined) || HttpStatusCode.INTERNAL_SERVER_ERROR;
  let message: string;

  if (err instanceof AppError) {
    statusCode = err.statusCode || statusCode;
    message = err.message;
  } else if (err instanceof Error && err.message.includes("allowed for profile photos")) {
    statusCode = HttpStatusCode.BAD_REQUEST;
    message = err.message;
  } else {
    logger.error(`Unexpected application error: ${(err as Error).message}`, err);
    message = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
  }

  if (err instanceof Error && err.name === "ValidationError") {
    logger.error("ValidationError caught:", err);
    statusCode = HttpStatusCode.BAD_REQUEST;
    message = ERROR_MESSAGES.VALIDATION_ERROR;
  }

  if (err instanceof Error && err.name === "JsonWebTokenError") {
    statusCode = HttpStatusCode.UNAUTHORIZED;
    message = "Invalid token. Please log in again.";
  }

  if (err instanceof Error && err.name === "TokenExpiredError") {
    statusCode = HttpStatusCode.UNAUTHORIZED;
    message = "Your token has expired. Please log in again.";
  }

  const response = createErrorResponse(message);
  
  if (process.env.NODE_ENV === "development") {
    response.errors = err instanceof Error ? err.stack : String(err);
  }

  res.status(statusCode).json(response);
};
