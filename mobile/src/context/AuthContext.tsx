
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import authService from "../services/authService";
import { setAuthToken } from "../services/api";
import {
  AuthUser,
  LoginData,
  RegisterData,
} from "../types/auth";

const STORAGE_KEY = "todo_auth";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (data: LoginData) => Promise<void>;
  signUp: (data: RegisterData) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (saved) {
          const auth = JSON.parse(saved) as {
            token: string;
            user: AuthUser;
          };

          if (auth.token && auth.user) {
            setAuthToken(auth.token);
            setUser(auth.user);
          } else {
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    void restoreSession();
  }, []);

  async function saveSession(
    token: string,
    loggedInUser: AuthUser
  ): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token,
        user: loggedInUser,
      })
    );

    setAuthToken(token);
    setUser(loggedInUser);
  }

  async function signIn(data: LoginData): Promise<void> {
    const response = await authService.login(data);
    await saveSession(response.token, response.user);
  }

  async function signUp(data: RegisterData): Promise<void> {
    const response = await authService.register(data);
    await saveSession(response.token, response.user);
  }

  async function signOut(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}