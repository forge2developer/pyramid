import { Router } from "express";
import { getAllUsers, createUser, deleteUser } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All routes are protected
router.use(authenticate);

router.get("/", getAllUsers);
router.post("/add", createUser);
router.delete("/:id", deleteUser);

export default router;
