import { expect, type Page, test } from "@playwright/test";

const profile = {
  state: {
    profile: {
      birth: { date: "1996-03-14", timeZone: "Africa/Casablanca" },
      country: "MAR",
      sex: "female",
    },
    settings: {
      unit: "calendar",
      hideCountdown: false,
      sound: false,
      motion: "system",
    },
  },
  version: 1,
};

async function seed(page: Page, motion = "system") {
  await page.addInitScript(
    ([data, m]) => {
      const p = JSON.parse(data as string);
      p.state.settings.motion = m;
      localStorage.setItem("life-blackhole", JSON.stringify(p));
    },
    [JSON.stringify(profile), motion],
  );
}

/** True once the canvas has non-transparent pixels near its centre. */
async function painted(page: Page) {
  return page.evaluate(() => {
    const canvases = [
      ...document.querySelectorAll<HTMLCanvasElement>(
        "[data-render-mode] canvas",
      ),
    ];
    return canvases.some((c) => {
      const ctx = c.getContext("2d");
      if (!ctx) return true; // a WebGL canvas: trust it rendered
      const d = ctx.getImageData(
        c.width / 2 - 40,
        c.height / 2 - 40,
        80,
        80,
      ).data;
      for (let i = 3; i < d.length; i += 4) if ((d[i] ?? 0) > 0) return true;
      return false;
    });
  });
}

test("landing shows the lightweight 2D black hole", async ({ page }) => {
  await page.goto("/");
  const hole = page.locator("[data-render-mode]");
  await expect(hole).toHaveAttribute("data-render-mode", "canvas");
  await expect(hole).toHaveAttribute("aria-hidden", "true");
  await expect.poll(() => painted(page)).toBe(true);
});

test("horizon renders a black hole on a phone", async ({ page }) => {
  await seed(page);
  await page.goto("/horizon");
  const hole = page.locator("[data-render-mode]");
  await expect(hole).toBeVisible();
  await expect.poll(() => painted(page)).toBe(true);
});

test("falls back to 2D when WebGL is unavailable", async ({ page }) => {
  await seed(page);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error — narrowing the overloads isn't useful in a stub
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest) {
      if (type.startsWith("webgl")) return null;
      return original.call(this, type as "2d", ...rest);
    };
  });
  await page.goto("/horizon");
  const hole = page.locator("[data-render-mode]");
  await expect(hole).toHaveAttribute("data-render-mode", "canvas");
  await expect.poll(() => painted(page)).toBe(true);
});

test("respects the OS reduced-motion preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seed(page);
  await page.goto("/horizon");
  await expect(page.locator("[data-render-mode]")).toHaveAttribute(
    "data-animate",
    "false",
  );
});

test("the in-app motion setting overrides the OS", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await seed(page, "reduce");
  await page.goto("/horizon");
  await expect(page.locator("[data-render-mode]")).toHaveAttribute(
    "data-animate",
    "false",
  );
});
