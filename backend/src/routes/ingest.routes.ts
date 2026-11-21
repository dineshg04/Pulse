import { Router } from "express";
import { ingestEvents } from "../controllers/ingest.controller";
import { validateApiKey } from "../middlewares/apiKey.middleware";

const router = Router();

router.post("/", validateApiKey, ingestEvents);

export default router;
