import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import tables from "@/data/life-tables.json";
import messages from "@/messages/en.json";
import { BirthForm } from "./birth-form";

// The app fetches the tables from /public; tests use the source JSON directly.
vi.mock("@/hooks/use-life-tables", () => ({
  useLifeTables: (enabled = true) => (enabled ? tables : null),
}));

function setup(onSubmit = vi.fn()) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <BirthForm
        initial={null}
        submitLabel="Enter the horizon"
        onSubmit={onSubmit}
      />
    </NextIntlClientProvider>,
  );
  return { onSubmit, input: screen.getByLabelText("Birth date") };
}

const submit = () =>
  fireEvent.click(screen.getByRole("button", { name: "Enter the horizon" }));

describe("BirthForm", () => {
  it("asks for a date when submitted empty", () => {
    const { onSubmit, input } = setup();
    submit();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter your birth date.",
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a future date", () => {
    const { onSubmit, input } = setup();
    fireEvent.change(input, { target: { value: "2999-01-01" } });
    submit();
    expect(screen.getByRole("alert")).toHaveTextContent("in the future");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a valid date with the device time zone and defaults", () => {
    const { onSubmit, input } = setup();
    fireEvent.change(input, { target: { value: "1996-03-14" } });
    submit();
    expect(onSubmit).toHaveBeenCalledWith({
      birth: {
        date: "1996-03-14",
        time: undefined,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      country: undefined,
      sex: "unspecified",
    });
  });

  it("keeps the optional fields behind an expander", () => {
    setup();
    const toggle = screen.getByRole("button", { name: "Improve accuracy" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("Country")).toBeNull();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Country")).toBeInTheDocument();
    expect(screen.getByLabelText("Birth time")).toBeInTheDocument();
  });
});

describe("BirthForm country list", () => {
  it("lists localised countries once the expander opens", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Improve accuracy" }));
    const select = screen.getByLabelText("Country");
    expect(select).toBeEnabled();
    expect(screen.getByRole("option", { name: "Morocco" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "World average" }),
    ).toBeInTheDocument();
  });
});
