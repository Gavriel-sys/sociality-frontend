import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthGuard } from "@/components/auth/auth-guard";
import { clearSession, setSession } from "@/features/auth/auth-slice";
import { loadSession } from "@/features/auth/session-storage";
import { makeStore } from "@/lib/store/store";
import LoginPage from "./page";

const mockPush = vi.fn();
const mockRouter = { push: mockPush };
const mockSearchParams = new URLSearchParams();
const fetchLogin = vi.fn<typeof fetch>();
const loginResponse = {
  success: true, message: "Login success",
  data: { token: "login-token", user: { id: 42, name: "Alice", email: "alice@example.com" } },
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/feed",
}));

function renderLoginPage() {
  const store = makeStore();
  store.dispatch(clearSession());
  const view = render(<Provider store={store}><LoginPage /></Provider>);
  return { store, ...view };
}

function submitLogin(): void {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: " alice@example.com " } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: " Password123! " } });
  fireEvent.submit(screen.getByRole("form", { name: "Log in" }));
}

describe("LoginPage API integration", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockSearchParams.delete("returnTo");
    fetchLogin.mockReset();
    window.localStorage.clear();
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://be-social-media-api-production.up.railway.app");
    vi.stubGlobal("fetch", fetchLogin);
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it("saves the API session before navigation and passes AuthGuard", async () => {
    fetchLogin.mockResolvedValue(Response.json(loginResponse));
    const { store, rerender } = renderLoginPage();
    mockPush.mockImplementation(() => {
      expect(loadSession()?.token).toBe(loginResponse.data.token);
      expect(store.getState().auth.status).toBe("authenticated");
    });
    submitLogin();
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/feed"));
    expect(fetchLogin).toHaveBeenCalledTimes(1);
    const [url, request] = fetchLogin.mock.calls[0];
    expect(url).toBe("https://be-social-media-api-production.up.railway.app/api/auth/login");
    expect(request?.method).toBe("POST");
    expect(new Headers(request?.headers).get("Content-Type")).toBe("application/json");
    expect(JSON.parse(String(request?.body))).toEqual({ email: "alice@example.com", password: " Password123! " });
    expect(loadSession()).toEqual({ ...loginResponse.data, sessionId: expect.any(String) });
    expect(loadSession()?.sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27}$/i);
    expect(store.getState().auth).toMatchObject(loadSession() ?? {});
    expect(mockPush.mock.calls.every(([target]) => target === "/feed")).toBe(true);
    rerender(<Provider store={store}><AuthGuard><p>Private feed</p></AuthGuard></Provider>);
    expect(screen.getByText("Private feed")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalledWith(expect.stringContaining("/login"));
  });

  it.each([
    ["/me?tab=saved#posts", "/me?tab=saved#posts"], ["https://evil.example", "/feed"],
    ["//evil.example", "/feed"], ["javascript:alert(1)", "/feed"], ["/%2f%2fevil.example", "/feed"],
  ])("safely redirects returnTo=%s to %s", async (returnTo, expected) => {
    mockSearchParams.set("returnTo", returnTo);
    fetchLogin.mockResolvedValue(Response.json(loginResponse));
    renderLoginPage();
    submitLogin();
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(expected));
    expect(mockPush.mock.calls.every(([target]) => target === expected)).toBe(true);
  });

  it.each([401, 200])("displays backend failure with HTTP %s without saving or redirecting", async (status) => {
    fetchLogin.mockResolvedValue(Response.json({ success: false, message: "Invalid credentials" }, { status }));
    const { store } = renderLoginPage();
    submitLogin();
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
    expect(loadSession()).toBeNull();
    expect(store.getState().auth.status).toBe("unauthenticated");
    expect(mockPush).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByLabelText("Email")).toBeEnabled());
  });

  it("displays a network error without saving or navigating", async () => {
    fetchLogin.mockRejectedValue(new TypeError("Failed to fetch"));
    renderLoginPage();
    submitLogin();
    expect(await screen.findByRole("alert")).toHaveTextContent("network error");
    expect(loadSession()).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("clears the previous error on retry and prevents duplicate in-flight requests", async () => {
    let finishLogin: ((response: Response) => void) | undefined;
    fetchLogin.mockResolvedValueOnce(Response.json({ message: "Try again" }, { status: 503 }))
      .mockReturnValueOnce(new Promise<Response>((resolve) => { finishLogin = resolve; }));
    renderLoginPage();
    submitLogin();
    expect(await screen.findByRole("alert")).toHaveTextContent("Try again");
    submitLogin();
    await waitFor(() => expect(fetchLogin).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Log in/ })).toBeDisabled();
    fireEvent.submit(screen.getByRole("form", { name: "Log in" }));
    await act(async () => { finishLogin?.(Response.json(loginResponse)); });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/feed"));
    expect(fetchLogin).toHaveBeenCalledTimes(2);
  });

  it("uses the same safe destination for an existing authenticated session", () => {
    mockSearchParams.set("returnTo", "/me?tab=saved");
    const store = makeStore();
    store.dispatch(setSession({ ...loginResponse.data, sessionId: "existing-session" }));
    render(<Provider store={store}><LoginPage /></Provider>);
    expect(mockPush).toHaveBeenCalledWith("/me?tab=saved");
    expect(fetchLogin).not.toHaveBeenCalled();
  });
});
