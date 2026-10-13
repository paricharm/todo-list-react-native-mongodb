
import api from "./api";
import { Task, TaskInput, TaskUpdateInput } from "../types/task";

const taskService = {
  async getTasks(): Promise<Task[]> {
    const response = await api.get<Task[]>("/tasks");
    return response.data;
  },

  async getTask(id: string): Promise<Task> {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  async createTask(data: TaskInput): Promise<Task> {
    const response = await api.post<Task>("/tasks", data);
    return response.data;
  },

  async updateTask(
    id: string,
    data: TaskUpdateInput
  ): Promise<Task> {
    const response = await api.patch<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};

export default taskService;