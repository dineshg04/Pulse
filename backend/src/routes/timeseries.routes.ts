import { Router } from "express";
import { timeseriesController } from "../controllers/timeseries.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authenticate, timeseriesController);

export default router;
