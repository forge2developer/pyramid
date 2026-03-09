import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface JwtPayload {
  id: number;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const error: AppError = new Error("No token provided");
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.split(" ")[1];

    // Ensure JWT_SECRET is loaded
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Attach user info to request
    (req as any).userId = decoded.id;
    (req as any).userName = decoded.name;
    (req as any).userRole = decoded.role;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      const authError: AppError = new Error("Invalid token");
      authError.statusCode = 401;
      return next(authError);
    }
    if (error instanceof jwt.TokenExpiredError) {
      const authError: AppError = new Error("Token expired");
      authError.statusCode = 401;
      return next(authError);
    }
    next(error);
  }
};
