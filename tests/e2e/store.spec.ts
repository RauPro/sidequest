import { expect, test } from "@playwright/test";
import { locations } from "../../src/game/world/locations";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../../src/game/world/villageMap";

test("village and shop share a persisted bag and simulated checkout", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.getByRole("button", { name: "Add Ember", exact: true }).click();
  await expect(page.getByText("Bag · 1", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Shop view" }).click();
  await expect(page.getByText("Bag · 1", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Bag · 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Complete demo checkout" }).click();
  await expect(page.getByText("Demo order complete.")).toBeVisible();
  await expect(page.getByText("Bag · 0", { exact: true })).toBeVisible();
  await expect(page.getByText("1 × Ember · $24.00", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Village", exact: true }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("every village destination is signposted and opens from its canvas hotspot", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const map = page.getByTestId("village-map");
  await expect(map).toHaveAttribute("data-ready", "true");

  const frameBox = await map.boundingBox();
  if (!frameBox) throw new Error("Map frame bounds unavailable");
  const labelBoxes = new Map<string, { x: number; y: number; width: number; height: number }>();
  for (const location of locations) {
    const label = page.getByTestId(`map-label-${location.id}`);
    await expect(label).toBeVisible();
    await expect(label).toContainText(location.name);
    const box = await label.boundingBox();
    if (!box) throw new Error(`Label bounds unavailable for ${location.id}`);
    expect(box.x).toBeGreaterThanOrEqual(frameBox.x - 1);
    expect(box.y).toBeGreaterThanOrEqual(frameBox.y - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(frameBox.x + frameBox.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(frameBox.y + frameBox.height + 1);
    labelBoxes.set(location.id, box);
  }
  for (const [i, a] of locations.entries()) {
    for (const b of locations.slice(i + 1)) {
      const ab = labelBoxes.get(a.id)!;
      const bb = labelBoxes.get(b.id)!;
      expect(ab.x < bb.x + bb.width && bb.x < ab.x + ab.width && ab.y < bb.y + bb.height && bb.y < ab.y + ab.height, `${a.id}/${b.id} labels overlap`).toBe(false);
    }
  }
  await map.screenshot({ path: testInfo.outputPath("village-map.png") });

  const canvasBox = await map.locator("canvas").boundingBox();
  if (!canvasBox) throw new Error("Canvas bounds unavailable");
  const panels = {
    oracle: () => expect(page.getByRole("heading", { name: "The Oracle" })).toBeVisible(),
    camp: () => expect(page.getByRole("heading", { name: "Camp", exact: true })).toBeVisible(),
    post: () => expect(page.getByRole("heading", { name: "Post Office" })).toBeVisible(),
    market: () => expect(page.getByRole("button", { name: "Add Ember", exact: true })).toBeVisible(),
  };
  for (const id of ["oracle", "camp", "post", "market"] as const) {
    const location = locations.find((item) => item.id === id)!;
    const { x, y, width, height } = location.hitArea;
    await map.locator("canvas").click({ position: { x: canvasBox.width * (x + width / 2) / WORLD_WIDTH, y: canvasBox.height * (y + height / 2) / WORLD_HEIGHT } });
    await expect(page.getByRole("button", { name: location.name, exact: true })).toHaveAttribute("aria-pressed", "true");
    await panels[id]();
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  const animationName = await page.locator(".map-label-name").first().evaluate((el) => getComputedStyle(el, "::before").animationName);
  expect(animationName).toBe("none");
  expect(errors).toEqual([]);
});

test("the Post Office form stays explicitly simulated without horizontal overflow", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
  await page.screenshot({ path: testInfo.outputPath("village.png"), fullPage: true });
  await page.getByRole("button", { name: "Post Office", exact: true }).click();
  await page.getByLabel("Email address").fill("tester@example.com");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Try demo subscription" }).click();
  await expect(page.getByRole("status")).toContainText("No subscription was created");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
