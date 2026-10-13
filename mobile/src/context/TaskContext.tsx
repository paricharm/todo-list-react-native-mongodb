
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import axios from "axios";

import taskService from "../services/taskService";
import { Task, TaskInput, TaskUpdateInput } from "../types/task";

interface TaskContextValue {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  refreshTasks: () => Promise<void>;
  addTask: (data: TaskInput) => Promise<Task>;
  updateTask: (id: string, data: TaskUpdateInput) => Promise<Task>;
  removeTask: (id: string) => Promise<void>;
}

export const TaskContext = createContext<TaskContextValue | undefined>(
  undefined
);

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }

  return "Something went wrong. Please try again.";
}

export function TaskProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTasks = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await taskService.getTasks();
      setTasks(data);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshTasks();
  }, [refreshTasks]);

  async function addTask(data: TaskInput): Promise<Task> {
    const created = await taskService.createTask(data);
    setTasks((current) => [created, ...current]);
    setError(null);
    return created;
  }

  async function updateTask(
    id: string,
    data: TaskUpdateInput
  ): Promise<Task> {
    const updated = await taskService.updateTask(id, data);

    setTasks((current) =>
      current.map((task) => (task._id === id ? updated : task))
    );

    setError(null);
    return updated;
  }

  async function removeTask(id: string): Promise<void> {
    await taskService.deleteTask(id);
    setTasks((current) => current.filter((task) => task._id !== id));
    setError(null);
  }

  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoading,
        error,
        refreshTasks,
        addTask,
        updateTask,
        removeTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext(): TaskContextValue {
  const context = useContext(TaskContext);

  if (!context) {
    throw new Error("useTaskContext must be used within TaskProvider");
  }

  return context;
}