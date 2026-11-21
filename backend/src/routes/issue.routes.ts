import { Router } from "express";
import { issueListController } from "../controllers/issueList.controller";
import { issueDetailController } from "../controllers/issueDetail.controller";
import { updateIssueStatusController } from "../controllers/issueStatus.controller";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authenticate, issueListController);

router.get("/:id", authenticate, issueDetailController);
router.patch("/:id", authenticate, requireAdmin, updateIssueStatusController);

export default router;
