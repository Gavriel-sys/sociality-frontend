"use client";

import { useEffect, useState } from "react";
import {
  readSessionSnapshot,
  SESSION_CHANGE_EVENT,
  type SessionSnapshot,
} from "@/lib/session";

type ClientSessionSnapshot = SessionSnapshot & {
  mounted: boolean;
};

const INITIAL_SNAPSHOT: ClientSessionSnapshot = {
  mounted: false,
  token: null,
  isLoggedIn: false,
  displayName: "John Doe",
  avatarUrl: null,
  username: null,
};

export function useSessionSnapshot() {
  const [snapshot, setSnapshot] = useState<ClientSessionSnapshot>(INITIAL_SNAPSHOT);

  useEffect(() => {
    function syncSession() {
      setSnapshot({
        mounted: true,
        ...readSessionSnapshot(),
      });
    }

    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener(SESSION_CHANGE_EVENT, syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(SESSION_CHANGE_EVENT, syncSession);
    };
  }, []);

  return snapshot;
}
