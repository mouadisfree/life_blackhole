import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

function profileFor(date: string, seenAge: number | null = null) {
  return {
    state: {
      profile: {
        birth: { date, timeZone: "UTC" },
        country: "MAR",
        sex: "female",
      },
      settings: {
        unit: "calendar",
        hideCountdown: false,
        sound: false,
        motion: "reduce",
      },
      birthdayBonusSeenAge: seenAge,
    },
    version: 1,
  };
}

/** Seeds localStorage once (an init script would re-seed on every reload). */
async function seed(page: Page, data: unknown) {
  await page.goto("/about");
  await page.evaluate((d) => {
    localStorage.setItem("life-blackhole", d);
  }, JSON.stringify(data));
}

/** Birth date whose birthday was `daysAgo` days ago, 30 years back. */
function birthdayDaysAgo(daysAgo: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCFullYear(d.getUTCFullYear() - 30);
  return d.toISOString().slice(0, 10);
}

test("life in weeks shows the grid and a readable summary", async ({
  page,
}) => {
  await seed(page, profileFor("1996-03-14"));
  await page.goto("/weeks");
  await expect(
    page.getByRole("heading", { level: 1, name: "Your life in weeks" }),
  ).toBeVisible();
  await expect(
    page.getByText(/^You've lived [\d,]+ weeks\. About [\d,]+ remain\.$/),
  ).toBeVisible();
  await expect(page.locator("figcaption")).toHaveText(/A grid of [\d,]+ weeks/);
  const noOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(noOverflow).toBe(true);
});

test("birthday bonus appears after a birthday and stays dismissed", async ({
  page,
}) => {
  await seed(page, profileFor(birthdayDaysAgo(2)));
  await page.goto("/horizon");
  const card = page.getByRole("complementary", { name: "Happy birthday." });
  await expect(card).toBeVisible();
  await expect(card).toContainText(
    /moved your horizon back by about \d+ (days?|weeks?)/,
  );
  await card.getByRole("button", { name: "Thanks" }).click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("timer").first()).toBeVisible();
  await expect(card).toHaveCount(0);
});

test("no birthday bonus outside the week after a birthday", async ({
  page,
}) => {
  await seed(page, profileFor(birthdayDaysAgo(30)));
  await page.goto("/horizon");
  await expect(page.getByRole("timer").first()).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Happy birthday." }),
  ).toHaveCount(0);
});

test("about page cites the data source", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "About Life Blackhole",
  );
  await expect(
    page.getByText(/World Population Prospects 2024/).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "population.un.org/wpp" }),
  ).toHaveAttribute("href", "https://population.un.org/wpp/");
  await expect(page.getByText(/talk to someone you trust/)).toBeVisible();
});

for (const [name, path, seeded] of [
  ["landing", "/", false],
  ["horizon", "/horizon", true],
  ["weeks", "/weeks", true],
  ["settings", "/settings", true],
  ["about", "/about", false],
] as const) {
  test(`no detectable accessibility violations: ${name}`, async ({ page }) => {
    if (seeded) await seed(page, profileFor("1996-03-14", 30));
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    // Let the page-enter animation finish so contrast is measured at full opacity.
    await page.waitForTimeout(1200);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const summary = results.violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
    );
    expect(summary).toEqual([]);
  });
}

test("the landing form works with the keyboard alone", async ({
  page,
  browserName,
}) => {
  // Safari only tabs to links with Option+Tab (unless the user changes a setting).
  const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
  await page.goto("/");
  // Skip link is the first stop.
  await page.keyboard.press(tab);
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press(tab);
  await expect(page.getByLabel("Birth date")).toBeFocused();
  // Mobile date inputs open a native picker; set the value, keep focus.
  await page.getByLabel("Birth date").fill("1996-03-14");
  // WebKit tabs through the date's month/day/year segments first.
  const tabTo = async (name: string) => {
    const target = page.getByRole("button", { name });
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press(tab);
      if (await target.evaluate((el) => el === document.activeElement)) break;
    }
    await expect(target).toBeFocused();
  };
  await tabTo("Improve accuracy");
  await tabTo("Enter the horizon");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/horizon$/);
});
