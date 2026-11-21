import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getOverview } from "../services/overview.service";

const overviewQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  environment: z.enum(["production", "staging", "development", "all"]).default("all"),
});

export const overviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = overviewQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        message: "Invalid query parameters",
        errors: validation.error.issues,
      });
      return;
    }

    const { from, to, environment } = validation.data;

    if (new Date(from) > new Date(to)) {
      res.status(400).json({
        message: "'from' must be earlier than 'to'",
      });
      return;
    }

    const overview = await getOverview({
      from,
      to,
      environment,
    });

    res.status(200).json(overview);
  } catch (error) {
    next(error);
  }
};
