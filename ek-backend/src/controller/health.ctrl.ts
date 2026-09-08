import { RequestHandler } from "express";

export const check_health: RequestHandler = (req, res) => {
  return res.json({
    msg: "OK",
  });
};
