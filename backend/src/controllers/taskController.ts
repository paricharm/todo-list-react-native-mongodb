
import { Request, Response } from "express";
import mongoose from "mongoose";
import Task from "../models/Task";

// Get the authenticated user's ID from the request.
function getAuthenticatedUserId(
  req: Request,
  res: Response
): string | undefined {
  if (!req.userId) {
    res.status(401).json({
      message: "Authentication required",
    });
    return undefined;
  }

  return req.userId;
}

// GET /api/tasks
// Get all tasks belonging to the logged-in user.
export async function getTasks(
  req: Request,
  res: Response
): Promise<void> {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  const tasks = await Task.find({ userId }).sort({
    deadline: 1,
    createdAt: 1,
  });

  res.status(200).json(tasks);
}

// GET /api/tasks/:id
// Get one task belonging to the logged-in user.
export async function getTask(
  req: Request,
  res: Response
): Promise<void> {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  const id = String(req.params.id);

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({
      message: "Invalid task ID",
    });
    return;
  }

  const task = await Task.findOne({
    _id: id,
    userId,
  });

  if (!task) {
    res.status(404).json({
      message: "Task not found",
    });
    return;
  }

  res.status(200).json(task);
}

// POST /api/tasks
// Create a task for the logged-in user.
export async function createTask(
  req: Request,
  res: Response
): Promise<void> {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  const {
    title,
    description = "",
    scheduledAt,
    deadline,
    priority = "medium",
  } = req.body;

  if (
    typeof title !== "string" ||
    !title.trim() ||
    !scheduledAt ||
    !deadline
  ) {
    res.status(400).json({
      message:
        "Title, scheduled date-time and deadline are required",
    });
    return;
  }

  const scheduledDate = new Date(scheduledAt);
  const deadlineDate = new Date(deadline);

  if (
    Number.isNaN(scheduledDate.getTime()) ||
    Number.isNaN(deadlineDate.getTime())
  ) {
    res.status(400).json({
      message: "Invalid date-time",
    });
    return;
  }

  if (deadlineDate < scheduledDate) {
    res.status(400).json({
      message:
        "Deadline cannot be earlier than the scheduled date-time",
    });
    return;
  }

  if (!["low", "medium", "high"].includes(priority)) {
    res.status(400).json({
      message: "Invalid priority",
    });
    return;
  }

  const task = await Task.create({
    userId,
    title: title.trim(),
    description:
      typeof description === "string"
        ? description.trim()
        : "",
    scheduledAt: scheduledDate,
    deadline: deadlineDate,
    priority,
  });

  res.status(201).json(task);
}

// PATCH /api/tasks/:id
// Update a task belonging to the logged-in user.
export async function updateTask(
  req: Request,
  res: Response
): Promise<void> {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  const id = String(req.params.id);

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({
      message: "Invalid task ID",
    });
    return;
  }

  const allowedFields = [
    "title",
    "description",
    "scheduledAt",
    "deadline",
    "priority",
    "status",
  ];

  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  // Validate the title.
  if (
    updates.title !== undefined &&
    (typeof updates.title !== "string" ||
      !updates.title.trim())
  ) {
    res.status(400).json({
      message: "Title cannot be empty",
    });
    return;
  }

  // Validate the description.
  if (
    updates.description !== undefined &&
    typeof updates.description !== "string"
  ) {
    res.status(400).json({
      message: "Invalid description",
    });
    return;
  }

  // Validate the priority.
  if (
    updates.priority !== undefined &&
    !["low", "medium", "high"].includes(
      String(updates.priority)
    )
  ) {
    res.status(400).json({
      message: "Invalid priority",
    });
    return;
  }

  // Validate the task status.
  if (
    updates.status !== undefined &&
    !["pending", "completed"].includes(
      String(updates.status)
    )
  ) {
    res.status(400).json({
      message: "Invalid status",
    });
    return;
  }

  // Validate and convert date fields.
  for (const field of ["scheduledAt", "deadline"]) {
    if (updates[field] !== undefined) {
      const date = new Date(String(updates[field]));

      if (Number.isNaN(date.getTime())) {
        res.status(400).json({
          message: `Invalid ${field} date`,
        });
        return;
      }

      updates[field] = date;
    }
  }

  // Clean up text fields.
  if (typeof updates.title === "string") {
    updates.title = updates.title.trim();
  }

  if (typeof updates.description === "string") {
    updates.description = updates.description.trim();
  }

  // Find only a task owned by the logged-in user.
  const task = await Task.findOne({
    _id: id,
    userId,
  });

  if (!task) {
    res.status(404).json({
      message: "Task not found",
    });
    return;
  }

  // Ensure the deadline is not before the scheduled time.
  const nextScheduledAt =
    updates.scheduledAt ?? task.scheduledAt;

  const nextDeadline =
    updates.deadline ?? task.deadline;

  if (
    new Date(String(nextDeadline)).getTime() <
    new Date(String(nextScheduledAt)).getTime()
  ) {
    res.status(400).json({
      message:
        "Deadline cannot be earlier than scheduled date-time",
    });
    return;
  }

  Object.assign(task, updates);
  await task.save();

  res.status(200).json(task);
}

// DELETE /api/tasks/:id
// Delete a task belonging to the logged-in user.
export async function deleteTask(
  req: Request,
  res: Response
): Promise<void> {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  const id = String(req.params.id);

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({
      message: "Invalid task ID",
    });
    return;
  }

  const task = await Task.findOneAndDelete({
    _id: id,
    userId,
  });

  if (!task) {
    res.status(404).json({
      message: "Task not found",
    });
    return;
  }

  res.status(200).json({
    message: "Task deleted successfully",
  });
}