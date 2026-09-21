"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  ApiError,
  CLIENT_ERROR,
  clearAuthTokens,
  getAuthToken,
  getRefreshToken,
  request,
  setAuthTokens,
  type AuthTokens,
} from "@/lib/api";

export type { AuthTokens };

/** Shape of `data` from `GET /auth/me` and `data.user` from `POST /auth/login`. */
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
  phone?: string | null;
  birthDate?: string | null;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  fullName: string;
  phone?: string;
  birthDate?: string;
}

export interface LoginResult extends AuthTokens {
  user: AuthUser;
  isNew: boolean;
}

export interface RegisterResult {
  isNew: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<LoginResult>;
  register: (payload: RegisterPayload) => Promise<RegisterResult>;
  logout: () => void;
  refresh: () => Promise<AuthTokens>;
  getMe: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function storageError(): ApiError {
  return new ApiError(
    CLIENT_ERROR.STORAGE_UNAVAILABLE,
    "Your browser is blocking local storage, so the session cannot be saved.",
    0,
  );
}

/** Persists the pair, or fails loudly — a token that cannot be stored is useless. */
function persistTokens(tokens: AuthTokens): void {
  if (!setAuthTokens(tokens)) {
    throw storageError();
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback((): void => {
    clearAuthTokens();
    setUser(null);
  }, []);

  const getMe = useCallback(async (): Promise<AuthUser | null> => {
    const profile = await request<AuthUser>("/auth/me");
    setUser(profile);

    return profile;
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<LoginResult> => {
    const result = await request<LoginResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    persistTokens({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    setUser(result.user);

    return result;
  }, []);

  const register = useCallback(
    async (payload: RegisterPayload): Promise<RegisterResult> => {
      const result = await request<AuthTokens>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      persistTokens(result);

      // Registration signs the account in, so the profile is loaded straight away:
      // without it the first client-side navigation to the dashboard would still
      // see a signed-out context and bounce back to the login page.
      try {
        setUser(await request<AuthUser>("/auth/me"));
      } catch {
        // The account and its tokens are valid — only the cached profile is
        // missing, and `getMe()` lets a consumer fetch it on demand.
        setUser(null);
      }

      // A freshly registered account is always unverified: the backend writes
      // emailVerifiedAt = null, and only the emailed code can change that.
      return { isNew: true };
    },
    [],
  );

  const refresh = useCallback(async (): Promise<AuthTokens> => {
    const storedRefreshToken = getRefreshToken();

    if (storedRefreshToken === null || storedRefreshToken.length === 0) {
      throw new ApiError(
        CLIENT_ERROR.AUTHENTICATION_EXPIRED,
        "There is no stored session to refresh. Please sign in again.",
        401,
      );
    }

    const tokens = await request<AuthTokens>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
    });

    persistTokens(tokens);

    return tokens;
  }, []);

  // Verify the stored session once on mount: the token may have expired, or the
  // account may have been removed since the last visit.
  useEffect((): (() => void) => {
    let cancelled = false;

    const restoreSession = async (): Promise<void> => {
      const token = getAuthToken();

      if (token === null || token.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await request<AuthUser>("/auth/me");

        if (!cancelled) {
          setUser(profile);
        }
      } catch {
        // Expired or revoked: `request` has already cleared the stored tokens.
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void restoreSession();

    return (): void => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        register,
        logout,
        refresh,
        getMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Consumer hook. Throws when used outside the provider rather than returning undefined. */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }

  return context;
}
