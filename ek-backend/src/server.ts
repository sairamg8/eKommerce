import e from "express";
import Health from "./routes/health";
import "./config";
import { env } from "./config/env";
import user_router from "./routes/user.router";

const server = e();
server.use(e.json({}));
server.use(e.urlencoded({ extended: false }));
server.use("/health", Health);
server.use("/user", user_router);

server.listen(env.app_port, () =>
  console.log(`Server started on ${env.app_port}`),
);
