import { useQueryClient } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { useAppDispatch, useAppSelector, useAppStore } from "@/lib/store/hooks";
import { toggleNavigation } from "@/lib/store/ui-slice";
import { AppProviders } from "./app-providers";

function TestConsumer({ onStore, onQueryClient }: {
  onStore?: (store: unknown) => void;
  onQueryClient?: (client: unknown) => void;
}) {
  const store = useAppStore();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const isNavOpen = useAppSelector((state) => state.ui.isNavigationOpen);

  if (onStore !== undefined) {
    onStore(store);
  }
  if (onQueryClient !== undefined) {
    onQueryClient(queryClient);
  }

  return (
    <div>
      <span data-testid="nav-status">{isNavOpen ? "open" : "closed"}</span>
      <button type="button" onClick={() => dispatch(toggleNavigation())}>
        Toggle
      </button>
    </div>
  );
}

function WrapperWithRerender({
  onStore,
  onQueryClient,
}: {
  onStore: (store: unknown) => void;
  onQueryClient: (client: unknown) => void;
}) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        Rerender Parent ({count})
      </button>
      <AppProviders>
        <TestConsumer onStore={onStore} onQueryClient={onQueryClient} />
      </AppProviders>
    </div>
  );
}

describe("AppProviders", () => {
  it("renders children and provides Redux and Query contexts", () => {
    // Arrange & Act
    render(
      <AppProviders>
        <TestConsumer />
      </AppProviders>,
    );

    // Assert
    expect(screen.getByTestId("nav-status")).toHaveTextContent("closed");
  });

  it("preserves store and queryClient instances across parent component rerenders", () => {
    // Arrange
    const storesSeen: unknown[] = [];
    const clientsSeen: unknown[] = [];

    render(
      <WrapperWithRerender
        onStore={(s) => storesSeen.push(s)}
        onQueryClient={(c) => clientsSeen.push(c)}
      />,
    );

    // Act - trigger rerender of parent
    fireEvent.click(screen.getByRole("button", { name: /Rerender Parent/i }));

    // Assert
    expect(storesSeen.length).toBeGreaterThan(1);
    expect(storesSeen[0]).toBe(storesSeen[1]);

    expect(clientsSeen.length).toBeGreaterThan(1);
    expect(clientsSeen[0]).toBe(clientsSeen[1]);
  });
});
