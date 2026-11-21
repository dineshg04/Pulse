
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { loginUser } from "../services/auth.service";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        message: "Invalid email or password format",
      });
      return;
    }

    const result = await loginUser(validation.data);

    if (!result) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
