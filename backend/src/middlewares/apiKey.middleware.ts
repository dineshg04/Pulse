
import { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import  pool  from "../config/db";

export const validateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.header("X-API-Key");

    if (!apiKey) {
      res.status(401).json({ message: "API key is required" });
      return;
    }

    const apiKeyHash = createHash("sha256")
      .update(apiKey)
      .digest("hex");

    const result = await pool.query(
      "SELECT id FROM projects WHERE api_key_hash = $1",
      [apiKeyHash]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ message: "Invalid API key" });
      return;
    }

    res.locals.projectId = Number(result.rows[0].id);

    next();
  } catch (error) {
    next(error);
  }
};
