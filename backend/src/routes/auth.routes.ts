import { Router } from "express";
import { login, register, getProfile } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/register
router.post("/register", register);

// GET /api/auth/profile (protected route)
router.get("/profile", authenticate, getProfile);

export default router;
