"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { request, type AccessTokenResponse } from "@/lib/api";

export type { AccessTokenResponse };

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

/**
 * What `POST /auth/login` hands back. The tokens themselves are not part of the
 * contract any more: they arrive as httpOnly cookies the browser stores and the
 * server reads, so the context never holds a credential.
 */
export interface LoginResult {
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
  refresh: () => Promise<AccessTokenResponse>;
  getMe: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** No body is required, but the JSON parser expects a parseable payload. */
const EMPTY_JSON_BODY = JSON.stringify({});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback((): void => {
    // Local state clears first: the user is signed out of this screen whether or
    // not the server call lands, and the cookies are dropped by its response.
    setUser(null);

    void request<{ message: string }>("/auth/logout", {
      method: "POST",
      body: EMPTY_JSON_BODY,
    }).catch((error: unknown): void => {
      // Best effort by design — the refresh row expires on its own, so a failed
      // revocation leaves nothing but a stale database record.
      console.warn("[AUTH_LOGOUT] The server could not revoke the session.", error);
    });
  }, []);

  const getMe = useCallback(async (): Promise<AuthUser | null> => {
    const profile = await request<AuthUser>("/auth/me");
    setUser(profile);

    return profile;
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<LoginResult> => {
    const result = await request<LoginResult & AccessTokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // The session cookies are already set by the response; only the profile has
    // to be lifted into React state.
    setUser(result.user);

    return { user: result.user, isNew: result.isNew };
  }, []);

  const register = useCallback(
    async (payload: RegisterPayload): Promise<RegisterResult> => {
      await request<AccessTokenResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Registration signs the account in, so the profile is loaded straight away:
      // without it the first client-side navigation to the dashboard would still
      // see a signed-out context and bounce back to the login page.
      try {
        setUser(await request<AuthUser>("/auth/me"));
      } catch {
        // The account and its session cookie are valid — only the cached profile
        // is missing, and `getMe()` lets a consumer fetch it on demand.
        setUser(null);
      }

      // A freshly registered account is always unverified: the backend writes
      // emailVerifiedAt = null, and only the emailed code can change that.
      return { isNew: true };
    },
    [],
  );

  const refresh = useCallback(async (): Promise<AccessTokenResponse> => {
    // Nothing to read and nothing to send: the refresh token is an httpOnly
    // cookie, so the browser attaches it on its own and the server answers with a
    // rotated pair of cookies.
    return request<AccessTokenResponse>("/auth/refresh", {
      method: "POST",
      body: EMPTY_JSON_BODY,
    });
  }, []);

  // Verify the session once on mount: the cookies may be absent, expired, or
  // belong to an account that has since been removed.
  //
  // There is no local hint to check first — the cookies are httpOnly, so the only
  // way to know whether a session exists is to ask. An anonymous visitor simply
  // resolves to a 401.
  useEffect((): (() => void) => {
    let cancelled = false;

    const restoreSession = async (): Promise<void> => {
      try {
        const profile = await request<AuthUser>("/auth/me");

        if (!cancelled) {
          setUser(profile);
        }
      } catch {
        // Signed out, or the session ended: the shell treats a null user as
        // "visitor", so there is nothing to repair here.
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
