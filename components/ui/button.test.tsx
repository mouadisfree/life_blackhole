import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

// Smoke test: proves Vitest + jsdom + React Testing Library + path aliases work.
describe("Button", () => {
  it("renders an accessible button", () => {
    render(<Button>Enter the horizon</Button>);
    expect(
      screen.getByRole("button", { name: "Enter the horizon" }),
    ).toBeInTheDocument();
  });
});
