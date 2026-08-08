import { HttpStatusCode } from "../types/http";


export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: HttpStatusCode, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, HttpStatusCode.NOT_FOUND);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access") {
    super(message, HttpStatusCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden access") {
    super(message, HttpStatusCode.FORBIDDEN);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(message, HttpStatusCode.BAD_REQUEST);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, HttpStatusCode.CONFLICT);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal server error") {
    super(message, HttpStatusCode.INTERNAL_SERVER_ERROR, false);
  }
}
