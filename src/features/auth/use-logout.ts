"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/lib/store/hooks";
import { clearSession as clearAuthSliceSession } from "./auth-slice";
import { clearSession as clearStorageSession } from "./session-storage";

export type LogoutAction = (redirectPath?: string) => void;

export interface UseLogoutResult extends LogoutAction {
  readonly logout: LogoutAction;
}

export function useLogout(): UseLogoutResult {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();

  const performLogout: LogoutAction = useCallback(
    (redirectPath = "/login") => {
      // 1. Clear persisted browser storage first
      clearStorageSession();

      // 2. Clear Redux authentication state
      dispatch(clearAuthSliceSession());

      // 3. Clear TanStack Query server cache to prevent data leakage
      queryClient.clear();

      // 4. Redirect user to destination route
      router.push(redirectPath);
    },
    [dispatch, queryClient, router],
  );

  return Object.assign(performLogout, { logout: performLogout });
}
