import { expect, type Page, test } from "@playwright/test";

const BIRTH = "1996-03-14";
const profile = {
  state: {
    profile: {
      birth: { date: BIRTH, timeZone: "UTC" },
      country: "MAR",
      sex: "female",
    },
    settings: {
      unit: "calendar",
      hideCountdown: false,
      sound: false,
      motion: "reduce",
    },
    birthdayBonusSeenAge: 30,
  },
  version: 1,
};

async function seed(page: Page) {
  await page.goto("/about");
  await page.evaluate(
    (d) => localStorage.setItem("life-blackhole", d),
    JSON.stringify(profile),
  );
}

async function openSheet(page: Page) {
  await page.goto("/horizon");
  await page.getByRole("button", { name: "Share my horizon" }).click();
  const dialog = page.getByRole("dialog", { name: "Share your horizon" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("img", { name: "Preview of your share card" }),
  ).toBeVisible();
  return dialog;
}

test("shares a PNG through the Web Share API on phones", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __shared: unknown[] };
    w.__shared = [];
    Object.defineProperty(navigator, "canShare", {
      value: () => true,
      configurable: true,
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: { files: File[]; text: string }) => {
        const f = data.files[0];
        w.__shared.push({
          name: f?.name,
          type: f?.type,
          size: f?.size,
          text: data.text,
        });
      },
    });
  });
  await seed(page);
  const dialog = await openSheet(page);
  await dialog.getByRole("button", { name: "Share", exact: true }).click();
  const shared = await page.evaluate(
    () =>
      (
        window as unknown as {
          __shared: {
            name: string;
            type: string;
            size: number;
            text: string;
          }[];
        }
      ).__shared,
  );
  expect(shared).toHaveLength(1);
  expect(shared[0]).toMatchObject({
    name: "life-blackhole-story.png",
    type: "image/png",
  });
  expect(shared[0]?.size).toBeGreaterThan(50_000);
  expect(shared[0]?.text).not.toContain(BIRTH);
});

test("falls back to a download when files can't be shared", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
  });
  await seed(page);
  const dialog = await openSheet(page);
  await expect(
    dialog.getByRole("button", { name: "Share", exact: true }),
  ).toHaveCount(0);
  await dialog.getByText("Post · 1:1").click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    dialog.getByRole("button", { name: "Download image" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("life-blackhole-post.png");
});

test("birth date is off by default and nothing is uploaded", async ({
  page,
}) => {
  await seed(page);
  const requests: string[] = [];
  const dialogPromise = openSheet(page);
  page.on("request", (r) => {
    requests.push(`${r.method()} ${r.url()} ${r.postData() ?? ""}`);
  });
  const dialog = await dialogPromise;
  await expect(
    dialog.getByRole("switch", { name: "My birth date" }),
  ).not.toBeChecked();
  // Toggle options so the card re-renders a few times.
  await dialog.getByRole("switch", { name: "My birth date" }).click();
  await dialog.getByRole("switch", { name: "Weekends left" }).click();
  await dialog.getByText("Post · 1:1").click();
  await page.waitForTimeout(500);

  const leaks = requests.filter(
    (r) =>
      r.includes(BIRTH) ||
      r.includes("1996") ||
      r.startsWith("POST") ||
      r.includes("/api/og"),
  );
  expect(leaks).toEqual([]);
});
