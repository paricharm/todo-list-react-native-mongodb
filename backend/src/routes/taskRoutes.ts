
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController";

const router = Router();

// All task endpoints require a valid JWT.
router.use(authMiddleware);

router.get("/", getTasks);
router.post("/", createTask);
router.get("/:id", getTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;