
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import taskRoutes from "./routes/taskRoutes";
import { errorMiddleware } from "./middleware/errorMiddleware";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({ message: "To-Do API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Register the error handler after the routes.
app.use(errorMiddleware);

export default app;