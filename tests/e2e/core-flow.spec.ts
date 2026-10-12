import { expect, test } from "@playwright/test";

test.describe("core flow", () => {
  test("landing → horizon → settings → delete", async ({ page }) => {
    await page.goto("/");

    // Validation
    await page.getByRole("button", { name: "Enter the horizon" }).click();
    // Next.js adds its own empty role="alert" route announcer, so match by text.
    await expect(
      page.getByRole("alert").filter({ hasText: "Enter your birth date." }),
    ).toBeVisible();

    // Enter details
    await page.getByLabel("Birth date").fill("1996-03-14");
    await page.getByRole("button", { name: "Improve accuracy" }).click();
    const country = page.getByLabel("Country");
    await expect(country).toBeEnabled();
    await country.selectOption("MAR");
    await page.getByText("Female", { exact: true }).click();
    await page.getByRole("button", { name: "Enter the horizon" }).click();

    // Horizon
    await expect(page).toHaveURL(/\/horizon$/);
    const remaining = page.getByRole("timer", {
      name: "Estimated time remaining",
    });
    await expect(remaining).toBeVisible();
    const before = await remaining.textContent();
    await expect
      .poll(() => remaining.textContent(), { timeout: 3000 })
      .not.toBe(before);
    await expect(
      page.getByText("of an average life lived", { exact: true }),
    ).toBeVisible();
    // Screen-reader summary instead of a live-updating counter.
    await expect(page.getByText(/^About \d+ years remaining\./)).toBeAttached();
    await expect(
      page.getByRole("heading", { name: "In perspective" }),
    ).toBeVisible();
    await expect(
      page.getByText(/for Morocco, women of your age/),
    ).toBeVisible();

    // Nothing personal in the URL
    expect(page.url()).not.toContain("1996");

    // Header navigation (the footer repeats some links).
    const nav = page.getByRole("navigation", { name: "Main" });

    // Persists across reloads
    await page.reload();
    await expect(remaining).toBeVisible();

    // Settings: hide the countdown
    await nav.getByRole("link", { name: "Settings" }).click();
    await page.getByRole("switch", { name: "Hide the countdown" }).click();
    await nav.getByRole("link", { name: "Horizon" }).click();
    await expect(page.getByText(/Countdown hidden/)).toBeVisible();
    await expect(remaining).toHaveCount(0);

    // Delete everything
    await nav.getByRole("link", { name: "Settings" }).click();
    await page.getByRole("button", { name: "Delete all my data" }).click();
    await page.getByRole("button", { name: "Delete everything" }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
    await expect(page.getByLabel("Birth date")).toHaveValue("");
  });

  test("horizon without data sends you to the landing page", async ({
    page,
  }) => {
    await page.goto("/horizon");
    await expect(page).toHaveURL(/\/$/);
  });
});
