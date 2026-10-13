
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "completed";

export interface Task {
  _id: string;
  userId: string;
  title: string;
  description: string;
  scheduledAt: string;
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskInput {
  title: string;
  description: string;
  scheduledAt: string;
  deadline: string;
  priority: TaskPriority;
}

export type TaskUpdateInput = Partial<TaskInput> & {
  status?: TaskStatus;
};