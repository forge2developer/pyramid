import { Router, Request, Response } from "express";
import pool from "../config/database";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({
      status: "ok",
      message: "Server is running",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server is running",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
