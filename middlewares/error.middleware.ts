import { Request, Response, NextFunction } from "express";
import multer from "multer";
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
): void => {
  let statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
  let message = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message    = err.message;
    if (err.isOperational) {
      logger.warn(`[AppError] ${err.statusCode} — ${err.message}`);
    } else {
      logger.error("[ProgrammerError]", err);
    }
  } else if (err instanceof multer.MulterError) {
    statusCode = HttpStatusCode.BAD_REQUEST;
    message    = `File upload error: ${err.message}`;
    logger.warn(`[MulterError] ${err.message}`);
  } else if (err instanceof Error) {
    if (err.message.includes("allowed")) {
      statusCode = HttpStatusCode.BAD_REQUEST;
      message    = err.message;
    } else if (err.name === "ValidationError") {
      statusCode = HttpStatusCode.BAD_REQUEST;
      message    = ERROR_MESSAGES.VALIDATION_ERROR;
    } else if (err.name === "CastError") {
      statusCode = HttpStatusCode.BAD_REQUEST;
      message    = "Invalid ID format.";
    } else if (err.name === "JsonWebTokenError") {
      statusCode = HttpStatusCode.UNAUTHORIZED;
      message    = "Invalid token. Please log in again.";
    } else if (err.name === "TokenExpiredError") {
      statusCode = HttpStatusCode.UNAUTHORIZED;
      message    = "Your token has expired. Please log in again.";
    } else {
      logger.error("[UnexpectedError]", err);
    }
  } else {
    logger.error("[UnknownError]", err);
  }

  const response = createErrorResponse(message);
  if (process.env.NODE_ENV === "development") {
    response.errors = err instanceof Error ? err.stack : String(err);
  }

  res.status(statusCode).json(response);
};
