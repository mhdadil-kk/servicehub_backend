import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { BadRequestError } from "../utils/error";


export const validate = (schema: AnyZodObject) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        
        const message = error.issues?.map(e => {
          const path = e.path.filter(p => p !== "body").join(".");
          return `${path}: ${e.message}`;
        }).join(", ") || "Validation failed";
        return next(new BadRequestError(message));
      }
      return next(error);
    }
  };
