import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getTimeseries } from "../services/timeseries.service";

const timeseriesQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  environment: z.enum(["production", "staging", "development", "all"]).default("all"),
  metric: z.enum(["errors", "requests"]),
  interval: z.enum(["5m", "1h", "1d"]),
});

export const timeseriesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = timeseriesQuerySchema.safeParse(req.query);

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

    const data = await getTimeseries(filters);

    res.status(200).json({
      metric: filters.metric,
      interval: filters.interval,
      data,
    });
  } catch (error) {
    next(error);
  }
};
