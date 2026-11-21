import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getIssues } from "../services/issueList.service";

const issueQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),

  environment: z.enum(["production", "staging", "development", "all"]).default("all"),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  sortBy: z.enum(["count", "lastSeen", "firstSeen"]).default("count"),

  order: z.enum(["asc", "desc"]).default("desc"),

  search: z.string().optional(),

  status: z.enum(["open", "resolved", "ignored"]).optional(),
});

export const issueListController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = issueQuerySchema.safeParse(req.query);

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

    const result = await getIssues(filters);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
