import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadSession } from "@/features/auth/session-storage";
import { makeStore } from "@/lib/store/store";
import { fillRegistrationForm, registrationResponse } from "../../../../tests/auth/registration-fixture";
import RegisterPage from "./page";

const mockPush = vi.fn();
const mockRouter = { push: mockPush };
const mockSearchParams = new URLSearchParams("returnTo=%2Fme");
const fetchRegistration = vi.fn<typeof fetch>();

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

function renderRegistrationPage() {
  const store = makeStore();
  render(<Provider store={store}><RegisterPage /></Provider>);
  return store;
}

function submitRegistration(): void {
  fireEvent.submit(screen.getByRole("form", { name: "Register" }));
}

describe("RegisterPage API integration", () => {
  beforeEach(() => {
    mockPush.mockReset();
    fetchRegistration.mockReset();
    window.localStorage.clear();
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://be-social-media-api-production.up.railway.app");
    vi.stubGlobal("fetch", fetchRegistration);
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it.each([" 08123456789 ", ""])("registers with phone '%s', persists session, and redirects to /feed", async (phone) => {
    fetchRegistration.mockResolvedValue(Response.json(registrationResponse));
    const store = renderRegistrationPage();
    mockPush.mockImplementation(() => {
      expect(loadSession()?.token).toBe(registrationResponse.data.token);
      expect(store.getState().auth.status).toBe("authenticated");
    });
    fillRegistrationForm({ name: " Taylor Mason ", username: " tmason ", email: " taylor@example.com ", phone,
      password: " Password123! ", confirmPassword: " Password123! " });
    submitRegistration();
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/feed"));
    expect(fetchRegistration).toHaveBeenCalledTimes(1);
    const [url, request] = fetchRegistration.mock.calls[0];
    expect(url).toBe("https://be-social-media-api-production.up.railway.app/api/auth/register");
    expect(request?.method).toBe("POST");
    expect(JSON.parse(String(request?.body))).toEqual({
      name: "Taylor Mason", username: "tmason", email: "taylor@example.com", password: " Password123! ",
      ...(phone.trim() ? { phone: phone.trim() } : {}),
    });
    expect(loadSession()).toEqual({ ...registrationResponse.data, sessionId: expect.any(String) });
    expect(store.getState().auth).toMatchObject(loadSession() ?? {});
    expect(mockPush.mock.calls.every(([target]) => target === "/feed")).toBe(true);
  });

  it.each(["Phone already in use", "Username already in use", "Email already in use"])("displays backend error: %s", async (message) => {
    fetchRegistration.mockResolvedValue(Response.json({ success: false, message }, { status: 409 }));
    const store = renderRegistrationPage();
    fillRegistrationForm();
    submitRegistration();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(message);
    expect(screen.getByRole("form", { name: "Register" }).firstElementChild).toBe(alert);
    expect(loadSession()).toBeNull();
    expect(store.getState().auth.status).not.toBe("authenticated");
    expect(mockPush).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled());
  });

  it("displays a network error without saving a session or navigating", async () => {
    fetchRegistration.mockRejectedValue(new TypeError("Failed to fetch"));
    renderRegistrationPage();
    fillRegistrationForm();
    submitRegistration();
    expect(await screen.findByRole("alert")).toHaveTextContent("network error");
    expect(loadSession()).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("rejects an unsuccessful response even with HTTP 200", async () => {
    fetchRegistration.mockResolvedValue(Response.json({ success: false, message: "Registration unavailable" }));
    renderRegistrationPage();
    fillRegistrationForm();
    submitRegistration();
    expect(await screen.findByRole("alert")).toHaveTextContent("Registration unavailable");
    expect(loadSession()).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("clears an old error on retry and prevents duplicate requests while pending", async () => {
    let finishRegistration: ((response: Response) => void) | undefined;
    fetchRegistration.mockResolvedValueOnce(Response.json({ message: "Try again" }, { status: 503 }))
      .mockReturnValueOnce(new Promise<Response>((resolve) => { finishRegistration = resolve; }));
    renderRegistrationPage();
    fillRegistrationForm();
    submitRegistration();
    expect(await screen.findByRole("alert")).toHaveTextContent("Try again");
    submitRegistration();
    await waitFor(() => expect(fetchRegistration).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Submit/ })).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();
    submitRegistration();
    await act(async () => { finishRegistration?.(Response.json(registrationResponse)); });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/feed"));
    expect(fetchRegistration).toHaveBeenCalledTimes(2);
  });
});
