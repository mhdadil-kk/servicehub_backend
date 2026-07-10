import { HttpStatusCode } from "../types/http";

export class AppError extends Error {
  public  statusCode: HttpStatusCode;
  public  isOperational: boolean;

  constructor(message: string, statusCode: HttpStatusCode, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}


export class NotFoundError extends AppError {
  constructor(message: string = "Resource NOT found") {
    super(message, HttpStatusCode.NOT_FOUND);
  }
}


export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized access") {
    super(message, HttpStatusCode.UNAUTHORIZED);
  }
}


export class BadRequestError extends AppError {
  constructor(message: string = "Bad request") {
    super(message, HttpStatusCode.BAD_REQUEST);
  }
}


export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super(message, HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
}


export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden access") {
    super(message, HttpStatusCode.FORBIDDEN);
  }
}
