import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import jwt from "jsonwebtoken";
import { AppError } from "../middleware/errorHandler";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

export interface LoginRequest {
  name: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  password: string;
  role: string;
  status: number;
}

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, password }: LoginRequest = req.body;
    console.log(name, password);

    // Validate input
    if (!name || !password) {
      const error: AppError = new Error("Name and password are required");
      error.statusCode = 400;
      throw error;
    }

    // Find user by name
    const [rows] = await pool.execute<any[]>(
      "SELECT id, name, password, role, status FROM users WHERE name = ?",
      [name]
    );

    const users = rows as User[];

    if (users.length === 0) {
      const error: AppError = new Error("Invalid name or password");
      error.statusCode = 401;
      throw error;
    }

    const user = users[0];

    // Check if user is active
    if (user.status !== 1) {
      const error: AppError = new Error("Account is inactive");
      error.statusCode = 401;
      throw error;
    }

    // Compare passwords (plain text)
    if (password !== user.password) {
      const error: AppError = new Error("Invalid name or password");
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, password, role } = req.body;

    // Validate input
    if (!name || !password) {
      const error: AppError = new Error("Name and password are required");
      error.statusCode = 400;
      throw error;
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute<any[]>(
      "SELECT id FROM users WHERE name = ?",
      [name]
    );

    if ((existingUsers as any[]).length > 0) {
      const error: AppError = new Error("User with this name already exists");
      error.statusCode = 409;
      throw error;
    }

    // Insert new user (plain text password)
    const [result] = await pool.execute<any>(
      "INSERT INTO users (name, password, role, status) VALUES (?, ?, ?, ?)",
      [name, password, role || 'user', 1]
    );

    const insertId = result.insertId;

    // Generate JWT token
    const token = jwt.sign(
      {
        id: insertId,
        name: name,
        role: role || 'user',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: insertId,
          name,
          role: role || 'user',
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // User ID should be set by auth middleware
    const userId = (req as any).userId;

    if (!userId) {
      const error: AppError = new Error("Unauthorized");
      error.statusCode = 401;
      throw error;
    }

    const [rows] = await pool.execute<any[]>(
      "SELECT id, name, role, status FROM users WHERE id = ?",
      [userId]
    );

    const users = rows as User[];

    if (users.length === 0) {
      const error: AppError = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      data: {
        user: users[0],
      },
    });
  } catch (error) {
    next(error);
  }
};
