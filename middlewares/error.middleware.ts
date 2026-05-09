import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/error";
import { logger } from "../utils/logger";
import { ERROR_MESSAGES } from "../constants/messages";
import { HttpStatusCode } from "../types/http";
import { createErrorResponse } from "../types/response";

export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
  let message: string;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else {
    logger.error(`Unexpected application error: ${err.message}`, err);
    message = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
  }

  if (err.name === "ValidationError") {
    statusCode = HttpStatusCode.BAD_REQUEST;
    message = ERROR_MESSAGES.VALIDATION_ERROR;
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = HttpStatusCode.UNAUTHORIZED;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = HttpStatusCode.UNAUTHORIZED;
    message = "Your token has expired. Please log in again.";
  }

  const response = createErrorResponse(message);
  
  if (process.env.NODE_ENV === "development") {
    response.errors = err.stack;
  }

  res.status(statusCode).json(response);
};
