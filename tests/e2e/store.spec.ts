import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { isWalkableKind, TILE_SIZE, tileAt } from "../../src/game/world/villageMap";
import { cameraCenter, cameraZoom, worldToScreen } from "../../src/game/systems/camera";

test("village and shop share a persisted bag and simulated checkout", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
  const canvasHeight = await page.locator(".game-stage canvas").evaluate((canvas) => canvas.getBoundingClientRect().height);
  expect(canvasHeight).toBeGreaterThanOrEqual((await page.evaluate(() => window.innerHeight)) - 1);
  await page.getByRole("button", { name: "Market", exact: true }).click();
  await page.getByRole("button", { name: "Show me the companions", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).last().click();
  await expect(page.getByRole("button", { name: "Bag, 1 item" })).toBeVisible();
  await page.getByRole("link", { name: "Shop view" }).click();
  await expect(page.getByRole("button", { name: "Bag, 1 item" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Bag, 1 item" })).toBeVisible();
  await page.getByRole("button", { name: /Bag, 1 item/ }).click();
  await page.getByRole("button", { name: "Check out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Order snapshot" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Bag, 0 items" })).toBeVisible();
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
});

test("desktop screenshots keep pixels opaque beneath the HUD and Camp dialogue", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Screenshot compositing regression is desktop-only");
  await page.setViewportSize({ width: 1586, height: 992 });
  const sampleAlpha = async (url: string, point: { x: number; y: number }) => {
    await page.goto(url);
    await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
    const image = await page.screenshot();
    const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    return data[(point.y * info.width + point.x) * 4 + 3];
  };

  expect(await sampleAlpha("/", { x: 800, y: 982 })).toBe(255);

  await page.goto("/?visit=camp");
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "How does checkout work?", exact: true }).click();
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await page.getByRole("button", { name: "Is shipping real?", exact: true }).click();
  await expect(page.locator(".camp-transcript")).toContainText("Is shipping real?");
  await expect(page.locator(".camp-transcript")).toContainText("fictional demo village");
  const campImage = await page.screenshot();
  const { data, info } = await sharp(campImage).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  expect(data[(327 * info.width + 747) * 4 + 3]).toBe(255);
});

test("visit links open every village encounter", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const panels = {
    oracle: () => expect(page.getByRole("heading", { name: "The Oracle · Seer" })).toBeVisible(),
    camp: () => expect(page.getByRole("heading", { name: "Finn · Camp guide" })).toBeVisible(),
    post: () => expect(page.getByRole("heading", { name: "Pip · Postmaster" })).toBeVisible(),
    market: () => expect(page.getByRole("button", { name: "Show me the companions", exact: true })).toBeVisible(),
  };
  for (const id of ["oracle", "camp", "post", "market"] as const) {
    await page.goto(`/?visit=${id}`);
    await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
    await panels[id]();
    await expect(page.getByRole("navigation", { name: "Village places" })).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test("bag portrait reflects whether it was opened from Market or the HUD", async ({ page }) => {
  await page.goto("/?visit=market");
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Open my bag", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Milo · Merchant" })).toBeVisible();
  await expect(page.locator(".places-menu")).toHaveCount(0);
  await page.getByRole("button", { name: "Keep exploring", exact: true }).first().click();
  await page.getByRole("button", { name: "Bag, 0 items" }).click();
  await expect(page.locator(".backpack-portrait svg")).toBeVisible();
});

test("Market side-panel actions fit within the mobile encounter area", async ({ page }) => {
  await page.goto("/?visit=market");
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Show me the companions", exact: true }).click();
  const sidePanel = page.locator(".product-side-panel");
  await expect(sidePanel).toContainText("The brave little dragon");
  await expect(sidePanel).toContainText("Brave");
  await expect(sidePanel).toContainText("Adventurous");
  await expect(sidePanel).toContainText("A fiery orange companion who brings warmth, courage, and a little adventure to your desk.");
  await expect(sidePanel.getByRole("button", { name: "Add to bag", exact: true })).toBeVisible();
  await expect(sidePanel.getByRole("button", { name: "Keep exploring", exact: true })).toBeVisible();
  const actionsFit = await sidePanel.evaluate((element) => {
    const panel = element.getBoundingClientRect();
    const buttons = [...element.querySelectorAll(".rpg-btn")];
    return buttons.every((button) => {
      const rect = button.getBoundingClientRect();
      return rect.top >= panel.top && rect.bottom <= panel.bottom && rect.top >= 0 && rect.bottom <= window.innerHeight;
    });
  });
  expect(actionsFit).toBe(true);
});

test("the Post Office form stays explicitly simulated without horizontal overflow", async ({ page }, testInfo) => {
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
  await page.getByRole("button", { name: "Send letter request" }).click();
  await expect(page.getByText("Demo request validated. No subscription was created and no email was sent.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Post Office", exact: true })).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath("post-office.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("the visitor walks with keys, enters places with E and tap-moves", async ({ page }) => {
  await page.goto("/");
  const map = page.getByTestId("village-map");
  await expect(map).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".hint-bar")).toBeHidden();
  await expect(map).toHaveAttribute("data-player-tile", "18,14");

  await page.keyboard.down("ArrowRight");
  await expect(page.locator(".hint-bar")).toContainText(/Press E to visit the Market|Tap Market again to enter/, { timeout: 5000 });
  await page.keyboard.up("ArrowRight");
  await page.keyboard.press("e");
  await page.getByRole("button", { name: "Show me the companions", exact: true }).click();
  await expect(page.getByRole("button", { name: "Add to bag", exact: true }).last()).toBeVisible();
  await page.keyboard.press("Escape");

  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(3000);
  await page.keyboard.up("ArrowRight");
  const tileAttr = await map.getAttribute("data-player-tile");
  const [col, row] = tileAttr!.split(",").map(Number);
  expect(isWalkableKind(tileAt(col, row))).toBe(true);
  expect(col).toBeLessThanOrEqual(25);

  const view = page.viewportSize()!;
  const zoom = cameraZoom(view.width, view.height);
  const [pc, pr] = tileAttr!.split(",").map(Number);
  const center = cameraCenter(view.width, view.height, zoom, {
    x: pc * TILE_SIZE + TILE_SIZE / 2,
    y: (pr + 1) * TILE_SIZE - 12,
  });
  // The northern edge of the plaza is visible on both desktop and mobile.
  const candidates = [[24, 14]];
  let target: number[] | undefined;
  let pt = { x: 0, y: 0 };
  for (const [c, r] of candidates) {
    pt = worldToScreen({ x: c * TILE_SIZE + TILE_SIZE / 2, y: r * TILE_SIZE + TILE_SIZE / 2 }, view.width, view.height, zoom, center);
    if (pt.x > 20 && pt.x < view.width - 20 && pt.y > 80 && pt.y < view.height - 90) { target = [c, r]; break; }
  }
  if (!target) throw new Error("No on-screen plaza tile for tap-to-move");
  await page.mouse.click(pt.x, pt.y);
  await expect(map).toHaveAttribute("data-player-tile", `${target[0]},${target[1]}`, { timeout: 8000 });
});
