import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { AppError } from "../middleware/errorHandler";

export const getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const [rows] = await pool.execute<any[]>(
            "SELECT id, name, role, status FROM users"
        );

        res.json({
            success: true,
            data: {
                users: rows,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const createUser = async (
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

        // Insert new user
        // Note: Storing password in plain text as per existing auth implementation.
        // TODO: Implement password hashing.
        const [result] = await pool.execute<any>(
            "INSERT INTO users (name, password, role, status) VALUES (?, ?, ?, ?)",
            [name, password, role || 'user', 1]
        );

        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: {
                user: {
                    id: result.insertId,
                    name,
                    role: role || 'user',
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute<any>(
            "DELETE FROM users WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            const error: AppError = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }

        res.json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};
