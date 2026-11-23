import "dotenv/config";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import pool from "../config/db";

const seed = async () => {
  const adminEmail = process.env.SEED_ADMIN_EMAIL!;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD!;
  const viewerEmail = process.env.SEED_VIEWER_EMAIL!;
  const viewerPassword = process.env.SEED_VIEWER_PASSWORD!;
  const apiKey = process.env.PULSE_API_KEY!;

  if (!adminEmail || !adminPassword || !viewerEmail || !viewerPassword || !apiKey) {
    throw new Error("Missing seed environment variables");
  }

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const viewerHash = await bcrypt.hash(viewerPassword, 10);
  const apiKeyHash = createHash("sha256").update(apiKey).digest("hex");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create or update admin account
    await client.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, 'admin')
       ON CONFLICT (email)
       DO UPDATE SET password_hash = EXCLUDED.password_hash,
                     role = EXCLUDED.role`,
      [adminEmail, adminHash]
    );

    // Create or update viewer account
    await client.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, 'viewer')
       ON CONFLICT (email)
       DO UPDATE SET password_hash = EXCLUDED.password_hash,
                     role = EXCLUDED.role`,
      [viewerEmail, viewerHash]
    );

    // Create project if it doesn't exist
    const existingProject = await client.query("SELECT id FROM projects WHERE name = $1 LIMIT 1", [
      "Pulse Demo",
    ]);

    if (existingProject.rowCount) {
      await client.query("UPDATE projects SET api_key_hash = $1 WHERE id = $2", [
        apiKeyHash,
        existingProject.rows[0].id,
      ]);
    } else {
      await client.query("INSERT INTO projects (name, api_key_hash) VALUES ($1, $2)", [
        "Pulse Test Project",
        apiKeyHash,
      ]);
    }

    await client.query("COMMIT");
    console.log("Pulse seed data created successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
