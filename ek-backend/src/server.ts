import e from "express";
import Health from "./routes/health";
import "./config";
import { env } from "./config/env";

const server = e();
server.use("/health", Health);

server.listen(env.app_port, () =>
  console.log(`Server started on ${env.app_port}`),
);
