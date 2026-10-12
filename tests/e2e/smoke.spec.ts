import { expect, test } from "@playwright/test";

test("landing renders on a phone without horizontal scroll", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Life Blackhole/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
