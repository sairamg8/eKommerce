import { ErrorRequestHandler } from "express";

const pg_sql: Record<string, string> = {
  idx_category_name: "Duplicate category name",
  idx_category_slug: "Duplicate slug/url name",
  "42601": "Malformed PG Sql syntax",
};

export const global_error_handler: ErrorRequestHandler = (
  err,
  req,
  res,
  next,
) => {
  console.log({ err });
  switch (err.code) {
    case "23505":
      return res.status(409).json({
        message: pg_sql[err?.constraint] || "Record already existed",
      });

    case "42601":
      return res.status(500).json({
        message: pg_sql[err?.code],
      });

    default:
      return res.status(500).json({
        message: "Something went wrong",
      });
  }
};
