import type {
  NormalizedPaginationParams,
  NormalizedSearchParams,
} from "./query-params";

function assertValidSessionIdentity(identity: string): void {
  if (typeof identity !== "string" || identity.trim().length === 0) {
    throw new Error("Private query keys require a valid non-empty session identity.");
  }
  if (identity.toLowerCase().startsWith("bearer ") || identity.includes("token")) {
    throw new Error("Tokens must not be used as session identity in query keys.");
  }
}

export const queryKeys = {
  public: {
    all: ["public"] as const,
    search: (params?: NormalizedSearchParams) =>
      ["public", "search", params !== undefined ? params : {}] as const,
    userProfile: (username: string) =>
      ["public", "user", username] as const,
  },
  private: (sessionIdentity: string) => {
    assertValidSessionIdentity(sessionIdentity);
    return {
      all: ["private", sessionIdentity] as const,
      me: () => ["private", sessionIdentity, "me"] as const,
      feed: (params?: NormalizedPaginationParams) =>
        ["private", sessionIdentity, "feed", params !== undefined ? params : {}] as const,
    };
  },
} as const;
