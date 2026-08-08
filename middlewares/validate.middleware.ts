import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { HttpStatusCode } from "../types/http";
import { createErrorResponse } from "../types/response";

export const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(HttpStatusCode.BAD_REQUEST).json(
          createErrorResponse(
            error.errors.map((e) => e.message).join(", "),
            HttpStatusCode.BAD_REQUEST
          )
        );
      }
      next(error);
    }
  };
