import { expect, test } from "@playwright/test";

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

test("a real canvas hotspot opens Camp and the form stays explicitly simulated", async ({ page }, testInfo) => {
  await page.goto("/");
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas bounds unavailable");
  await page.screenshot({ path: testInfo.outputPath("village.png"), fullPage: true });
  await canvas.click({ position: { x: box.width * 590 / 800, y: box.height * 355 / 500 } });
  await expect(page.getByRole("heading", { name: "Camp", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Post Office", exact: true }).click();
  await page.getByLabel("Email address").fill("tester@example.com");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Try demo subscription" }).click();
  await expect(page.getByRole("status")).toContainText("No subscription was created");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
