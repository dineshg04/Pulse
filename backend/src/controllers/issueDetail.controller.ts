import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getIssueDetail } from "../services/issueDetail.service";

const issueDetailQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  environment: z.enum(["production", "staging", "development", "all"]).default("all"),
});

export const issueDetailController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = z.coerce.number().int().positive().safeParse(req.params.id);

    if (!id.success) {
      res.status(400).json({ message: "Invalid issue ID" });
      return;
    }

    const validation = issueDetailQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        message: "Invalid query parameters",
        errors: validation.error.issues,
      });
      return;
    }

    const filters = validation.data;

    if (new Date(filters.from) > new Date(filters.to)) {
      res.status(400).json({
        message: "'from' must be earlier than 'to'",
      });
      return;
    }

    const result = await getIssueDetail({
      id: id.data,
      ...filters,
    });

    if (!result) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
