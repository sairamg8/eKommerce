import { RequestHandler } from "express";
import { ParsedUrlQuery } from "querystring";
import { ZodObject, ZodType } from "zod";

type Req_Validate_T = ZodObject<{
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}>;

export const req_validate = (schema: Req_Validate_T): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    Object.defineProperty(req, "query", {
      writable: true,
      configurable: true,
      value: result.data?.query,
    });

    if (!result.success) {
      const details: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join(".") || "_root";
        if (!details[field]) details[field] = issue.message;
      }
      return res.status(400).json({
        msg: "Validation failed",
        errors: details,
      });
    }

    if (schema.shape.body) {
      req.body = result.data?.body;
    }
    if (schema.shape.params) {
      req.params = result.data?.params as Record<string, string>;
    }
    if (schema.shape.query) req.query = result.data?.query as ParsedUrlQuery;

    next();
  };
};
