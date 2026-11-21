
import { Request, Response, NextFunction } from "express";
import { eventSchema } from "../schemas/event.schema";
import { storeEvent } from "../services/event.service";

export const ingestEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!Array.isArray(req.body)) {
      res.status(400).json({
        message: "Request body must be an array",
      });
      return;
    }

    if (req.body.length > 500) {
      res.status(400).json({
        message: "Maximum 500 events allowed per batch",
      });
      return;
    }

    const projectId = res.locals.projectId as number;

    const errors: {
      index: number;
      field: string;
      message: string;
    }[] = [];

    let accepted = 0;

    for (const [index, rawEvent] of req.body.entries()) {
      const validation = eventSchema.safeParse(rawEvent);

      if (!validation.success) {
        for (const issue of validation.error.issues) {
          errors.push({
            index,
            field: issue.path.join(".") || "event",
            message: issue.message,
          });
        }

        continue;
      }

      await storeEvent(projectId, validation.data);
      accepted++;
    }

    res.status(202).json({
      accepted,
      rejected: req.body.length - accepted,
      errors,
    });
  } catch (error) {
    next(error);
  }
};
