import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorBoundary from "./error";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Error boundary", () => {
  it("shows a generic message and never leaks the raw error to the user (#31)", () => {
    const err = new Error("Postgres 57014: too many connections from 10.0.0.5");
    const reset = vi.fn();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { container } = render(<ErrorBoundary error={err} reset={reset} />);

    // The sensitive internal detail must not reach the screen.
    expect(container.textContent).not.toContain("Postgres 57014");
    expect(container.textContent).not.toContain("10.0.0.5");
    // A safe, generic message is shown instead.
    expect(container.textContent).toContain("An unexpected error occurred.");

    // Internal logging is preserved for debugging.
    expect(errorSpy).toHaveBeenCalledWith(err);
  });
});
