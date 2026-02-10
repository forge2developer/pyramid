import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import inventoryRoutes from "./inventory.routes";
import Companies from "./companies.routes";
import pdfRoutes from "./pdf.routes";
import userRoutes from "./user.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/Companies", Companies);
router.use("/pdf", pdfRoutes);
router.use("/users", userRoutes);
export default router;
