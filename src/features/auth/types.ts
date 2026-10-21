export interface AuthUser {
  readonly id?: string | number;
  readonly name?: string;
  readonly username?: string;
  readonly email?: string;
}

export interface SessionData {
  readonly token: string;
  readonly sessionId: string;
  readonly user?: AuthUser;
}

export type AuthStatus = "idle" | "authenticated" | "unauthenticated";

export interface AuthState {
  readonly token: string | null;
  readonly sessionId: string | null;
  readonly user: AuthUser | null;
  readonly status: AuthStatus;
}
