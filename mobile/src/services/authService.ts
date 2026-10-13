
import api from "./api";
import {
  AuthResponse,
  LoginData,
  RegisterData,
} from "../types/auth";

const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      "/auth/login",
      data
    );

    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      "/auth/register",
      data
    );

    return response.data;
  },
};

export default authService;