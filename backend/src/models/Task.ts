
import mongoose, { Schema, Document } from "mongoose";

export type Priority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "completed";

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  scheduledAt: Date;
  deadline: Date;
  priority: Priority;
  status: TaskStatus;
  createdAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    scheduledAt: { type: Date, required: true },
    deadline: { type: Date, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITask>("Task", taskSchema);