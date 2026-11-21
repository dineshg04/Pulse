import pool from "../config/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

interface LoginInput {
  email: string;
  password: string;
}

export const loginUser = async ({ email, password }: LoginInput) => {
  const result = await pool.query(
    `SELECT id, email, password_hash, role
     FROM users
     WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    return null;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: "1d" }
  );

  return {
    token,
    user: {
      id: Number(user.id),
      email: user.email,
      role: user.role,
    },
  };
};
