"use client";

import { useSyncExternalStore } from "react";

function subscribeToHydration(): () => void {
  return () => {};
}

function getClientSnapshot(): boolean {
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribeToHydration, getClientSnapshot, getServerSnapshot);
}
