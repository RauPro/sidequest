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

test("every village destination opens from its canvas hotspot", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const map = page.getByTestId("village-map");
  await expect(map).toHaveAttribute("data-ready", "true");
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
