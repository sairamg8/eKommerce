import e from "express";
import Health from "./routes/health";
import "./config";
import { env } from "./config/env";
import user_router from "./routes/user.router";

const server = e();
server.use(e.json({}));
server.use(e.urlencoded({ extended: false }));

server.use((req, res, next) => {
  res.set("access-control-allow-origin", "http://localhost:5173");
  res.set("access-control-allow-methods", "get, post, put, delete, options");
  res.set("access-control-allow-headers", "Content-Type, Authorization");

  if (req.method === "options") {
    res.sendStatus(204);
    return;
  }

  next();
});

server.use("/health", Health);
server.use("/user", user_router);

server.use((req, res) => {
  res.status(404).json({
    message: "The route your looking for doesn't exist",
  });
});

server.listen(env.app_port, () =>
  console.log(`Server started on ${env.app_port}`),
);
