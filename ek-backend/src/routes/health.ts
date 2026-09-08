import { check_health } from "@/controller/health.ctrl";
import e from "express";

const Health = e.Router();

Health.use("/", check_health);

export default Health;
