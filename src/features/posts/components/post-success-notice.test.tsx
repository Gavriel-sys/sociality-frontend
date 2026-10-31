import { act, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeStore } from "@/lib/store/store";
import { showPostSuccess } from "@/lib/store/ui-slice";
import { PostSuccessNotice } from "./post-success-notice";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function renderNotice() {
  const store = makeStore();
  const view = render(<Provider store={store}><PostSuccessNotice /></Provider>);
  const showNotice = () => act(() => { store.dispatch(showPostSuccess()); });
  return { ...view, showNotice };
}

describe("PostSuccessNotice", () => {
  it("stays hidden until a post succeeds and announces the success message", () => {
    const { showNotice } = renderNotice();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    showNotice();

    expect(screen.getByRole("status")).toHaveTextContent("Success Post");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("can be dismissed with the close button", () => {
    const { showNotice } = renderNotice();
    showNotice();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss post success notification" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("automatically disappears after five seconds", () => {
    const { showNotice } = renderNotice();
    showNotice();

    act(() => vi.advanceTimersByTime(5000));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("restarts its timeout for a subsequent successful post", () => {
    const { showNotice } = renderNotice();
    showNotice();
    act(() => vi.advanceTimersByTime(4000));

    showNotice();
    act(() => vi.advanceTimersByTime(1000));

    expect(screen.getAllByRole("status")).toHaveLength(1);
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("cleans up its timer when the notification host unmounts", () => {
    const { showNotice, unmount } = renderNotice();
    showNotice();

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
