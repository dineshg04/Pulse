import { Router } from "express";
import { overviewController } from "../controllers/overview.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authenticate, overviewController);

export default router;
