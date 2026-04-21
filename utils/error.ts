import { HttpStatusCode } from "../types/http";

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: HttpStatusCode, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Specifically for Resource Not Found (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Resource NOT found") {
    super(message, HttpStatusCode.NOT_FOUND);
  }
}

/**
 * For Unauthorized Access (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized access") {
    super(message, HttpStatusCode.UNAUTHORIZED);
  }
}

/**
 * For Bad Requests (400)
 */
export class BadRequestError extends AppError {
  constructor(message: string = "Bad request") {
    super(message, HttpStatusCode.BAD_REQUEST);
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super(message, HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Forbidden Access (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden access") {
    super(message, HttpStatusCode.FORBIDDEN);
  }
}
