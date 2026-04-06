import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { UserRole } from "../backend";
import { backendAPI as backend } from "../backendAPI";

export interface AuthUser {
  token: string;
  userId: string;
  role: UserRole;
  collegeId: string;
  name: string;
  photoUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "erp_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, verify stored session
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    let parsed: AuthUser;
    try {
      parsed = JSON.parse(stored);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setIsLoading(false);
      return;
    }
    backend
      .getSession(parsed.token)
      .then((session) => {
        if (session) {
          setUser({
            token: session.token,
            userId: session.userId,
            role: session.role,
            collegeId: session.collegeId,
            name: parsed.name,
            photoUrl: parsed.photoUrl,
          });
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (
    username: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: backend type may lag behind actual response shape
      const result = (await backend.login(username, password)) as any;
      const authUser: AuthUser = {
        token: result.token,
        userId: result.userId,
        role: result.role,
        collegeId: result.collegeId,
        name: result.name,
        photoUrl: result.photoUrl as string | undefined,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
      return { success: true };
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      if (raw.includes("already_logged_in")) {
        return {
          success: false,
          error:
            "You are already logged in on another device. Please log out from that device first before logging in here.",
        };
      }
      const msg = raw.includes("Invalid credentials")
        ? "Invalid credentials. Please check your username and password."
        : raw;
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    if (user?.token) {
      try {
        await backend.logout(user.token);
      } catch {
        // ignore
      }
    }
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
