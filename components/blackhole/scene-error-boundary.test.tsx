import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SceneErrorBoundary } from "./scene-error-boundary";

function Boom(): never {
  throw new Error("WebGL context creation failed");
}

describe("SceneErrorBoundary", () => {
  it("renders the 2D fallback and reports when the scene throws", () => {
    const onError = vi.fn();
    // React logs caught errors; keep test output clean.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <SceneErrorBoundary fallback={<p>2D fallback</p>} onError={onError}>
        <Boom />
      </SceneErrorBoundary>,
    );
    spy.mockRestore();
    expect(screen.getByText("2D fallback")).toBeInTheDocument();
    expect(onError).toHaveBeenCalledOnce();
  });

  it("renders children when nothing fails", () => {
    render(
      <SceneErrorBoundary fallback={<p>2D fallback</p>}>
        <p>scene</p>
      </SceneErrorBoundary>,
    );
    expect(screen.getByText("scene")).toBeInTheDocument();
  });
});
