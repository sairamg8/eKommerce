import e from "express";
import "dotenv/config";
import Health from "./routes/health";

const port = process.env.app_port;

const server = e();
server.use("/health", Health);

server.listen(port, () => console.log(`Server started on ${port}`));
