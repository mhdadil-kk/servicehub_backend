import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError, ZodIssue } from "zod";
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
        const issues: ZodIssue[] = (error.issues as ZodIssue[] | undefined) ?? (error.errors as ZodIssue[] | undefined) ?? [];
        return res.status(HttpStatusCode.BAD_REQUEST).json(
          createErrorResponse(
            issues.map((e: ZodIssue) => e.message).join(", "),
            HttpStatusCode.BAD_REQUEST
          )
        );
      }
      next(error);
    }
  };
