import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import * as apiFetchModule from "@/lib/api/api-fetch";
import { Header } from "./header";
import type { HeaderProps } from "./header";

export const matchedUser = {
  id: "john", name: "John Doe", username: "johndoe", avatarUrl: "/john.jpg",
};

export function renderSearchHeader(props: HeaderProps = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={queryClient}><Header {...props} /></QueryClientProvider>);
}

export function mockSearchResponse(users = [matchedUser]) {
  return vi.spyOn(apiFetchModule, "apiFetch").mockResolvedValue({ users, total: users.length });
}

export function typeSearch(query = "john") {
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: query } });
}

export async function finishSearchDebounce() {
  await act(async () => { await vi.advanceTimersByTimeAsync(300); });
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
}
