import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { updateIssueStatus } from "../services/issueStatus.service";

const statusSchema = z.object({
  status: z.enum(["open", "resolved", "ignored"]),
});

export const updateIssueStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idValidation = z.coerce.number().int().positive().safeParse(req.params.id);

    if (!idValidation.success) {
      res.status(400).json({ message: "Invalid issue ID" });
      return;
    }

    const validation = statusSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        message: "Invalid issue status",
        errors: validation.error.issues,
      });
      return;
    }

    const issue = await updateIssueStatus(idValidation.data, validation.data.status);

    if (!issue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }

    res.status(200).json({
      message: "Issue status updated successfully",
      issue,
    });
  } catch (error) {
    next(error);
  }
};
