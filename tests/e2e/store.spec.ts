import { expect, test } from "@playwright/test";
import { locations } from "../../src/game/world/locations";
import { isWalkableKind, tileAt, visitorSpawn } from "../../src/game/world/villageMap";
import { cameraCenter, cameraZoom, worldToScreen } from "../../src/game/systems/camera";

const worldPoint = (page: import("@playwright/test").Page, wx: number, wy: number) => {
  const view = page.viewportSize()!;
  const zoom = cameraZoom(view.width, view.height);
  const center = cameraCenter(view.width, view.height, zoom, { x: visitorSpawn.x, y: visitorSpawn.y - 12 });
  return worldToScreen({ x: wx, y: wy }, view.width, view.height, zoom, center);
};

test("village and shop share a persisted bag and simulated checkout", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Market", exact: true }).click();
  await page.getByRole("button", { name: "Add Ember", exact: true }).click();
  await expect(page.getByText("Bag · 1", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Shop view" }).click();
  await expect(page.getByText("Bag · 1", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Bag · 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Complete demo checkout" }).click();
  await expect(page.getByText("Demo order complete.")).toBeVisible();
  await expect(page.getByText("Bag · 0", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Village" }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
});

test("every on-screen village destination opens from its canvas hotspot", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
  const view = page.viewportSize()!;
  const panels = {
    oracle: () => expect(page.getByRole("heading", { name: "The Oracle" })).toBeVisible(),
    camp: () => expect(page.getByRole("heading", { name: "Camp", exact: true })).toBeVisible(),
    post: () => expect(page.getByRole("heading", { name: "Post Office" })).toBeVisible(),
    market: () => expect(page.getByRole("button", { name: "Add Ember", exact: true })).toBeVisible(),
  };
  let clicked = 0;
  for (const id of ["oracle", "camp", "post", "market"] as const) {
    const location = locations.find((item) => item.id === id)!;
    const { x, y, width, height } = location.hitArea;
    const pt = worldPoint(page, x + width / 2, y + height / 2);
    if (pt.x < 0 || pt.y < 0 || pt.x > view.width || pt.y > view.height) continue;
    clicked++;
    await page.mouse.click(pt.x, pt.y);
    await expect(page.getByRole("button", { name: location.name, exact: true })).toHaveAttribute("aria-expanded", "true");
    await panels[id]();
    await page.getByRole("button", { name: "Keep exploring" }).click();
  }
  expect(clicked).toBeGreaterThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath("village-map.png") });
  expect(errors).toEqual([]);
});

test("the Post Office form stays explicitly simulated without horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Post Office", exact: true }).click();
  const input = page.getByRole("textbox", { name: /email/i });
  await input.click();
  const tile = await page.getByTestId("village-map").getAttribute("data-player-tile");
  for (const key of ["ArrowLeft", "ArrowRight", "w", "a", "s", "d", "e"]) await page.keyboard.press(key);
  await expect(input).toHaveValue(/wasde/);
  expect(await page.getByTestId("village-map").getAttribute("data-player-tile")).toBe(tile);
  await input.fill("player@example.com");
  await page.getByRole("checkbox", { name: /agree/i }).check();
  await page.getByRole("button", { name: "Try demo subscription" }).click();
  await expect(page.getByText("No subscription was created")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Post Office", exact: true })).toBeFocused();
  await page.screenshot({ path: "post-office.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("the visitor walks with keys, enters places with E and tap-moves", async ({ page }) => {
  await page.goto("/");
  const map = page.getByTestId("village-map");
  await expect(map).toHaveAttribute("data-ready", "true");
  await expect(map).toHaveAttribute("data-player-tile", "18,11");

  await page.keyboard.down("ArrowLeft");
  await expect(page.locator(".hint-bar")).toContainText("enter the Market", { timeout: 5000 });
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.press("e");
  await expect(page.getByRole("button", { name: "Add Ember", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(3000);
  await page.keyboard.up("ArrowRight");
  const tileAttr = await map.getAttribute("data-player-tile");
  const [col, row] = tileAttr!.split(",").map(Number);
  expect(isWalkableKind(tileAt(col, row))).toBe(true);
  expect(col).toBeLessThanOrEqual(20);

  const view = page.viewportSize()!;
  const zoom = cameraZoom(view.width, view.height);
  const [pc, pr] = tileAttr!.split(",").map(Number);
  const center = cameraCenter(view.width, view.height, zoom, { x: pc * 16 + 8, y: pr * 16 + 16 - 12 });
  // (12,15) is off-screen on narrow views; tap the nearest on-screen plaza tile.
  const candidates = [[12, 15], [14, 14], [15, 12], [16, 12], [17, 13], [19, 11]];
  let target: number[] | undefined;
  let pt = { x: 0, y: 0 };
  for (const [c, r] of candidates) {
    pt = worldToScreen({ x: c * 16 + 8, y: r * 16 + 8 }, view.width, view.height, zoom, center);
    if (pt.x > 20 && pt.x < view.width - 20 && pt.y > 80 && pt.y < view.height - 90) { target = [c, r]; break; }
  }
  if (!target) throw new Error("No on-screen plaza tile for tap-to-move");
  await page.mouse.click(pt.x, pt.y);
  await expect(map).toHaveAttribute("data-player-tile", `${target[0]},${target[1]}`, { timeout: 8000 });
});
