import { expect, test } from "@playwright/test";

const products = [
  { id: "ember", name: "Ember", price: "$24.00", subtitle: "The brave little dragon" },
  { id: "moss", name: "Moss", price: "$18.00", subtitle: "The gentle green slime" },
  { id: "bolt", name: "Bolt", price: "$28.00", subtitle: "The curious blue robot" },
] as const;

for (const product of products) {
  test(`${product.name} has a local product page with its own metadata`, async ({ page }, testInfo) => {
    const response = await page.goto(`/products/${product.id}`);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(`${product.name} — Desk companion · SIDEQUEST`);
    await expect(page.getByRole("heading", { level: 1, name: product.name, exact: true })).toBeVisible();
    await expect(page.getByText(product.subtitle, { exact: true })).toBeVisible();
    await expect(page.getByText(`${product.price}USD · demo price`)).toBeVisible();
    await expect(page.getByRole("img", { name: new RegExp(product.name) })).toBeVisible();
    await expect(page.getByRole("region", { name: "Demo purchase information" })).toContainText("no payment is collected");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`${product.id}.png`), fullPage: true });
  });
}

test("product pages and the shop share a persisted cart", async ({ page }) => {
  await page.goto("/shop");
  await page.getByRole("link", { name: "Ember", exact: true }).click();
  await expect(page).toHaveURL(/\/products\/ember$/);
  await page.getByRole("button", { name: "Add Ember to bag", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Ember added" })).toHaveText("Ember added to your bag.");
  await expect(page.getByText("Bag · 1", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Meet Moss →", exact: true }).click();
  await expect(page.getByText("Bag · 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add Moss to bag", exact: true }).click();
  await page.reload();
  await expect(page.getByText("Bag · 2", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "View bag in Shop view →", exact: true }).click();
  await expect(page.getByText("Total: $42.00", { exact: true })).toBeVisible();
});

test("unknown companions return 404", async ({ page }) => {
  const response = await page.goto("/products/not-a-companion");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("button", { name: /Add .* to bag/ })).toHaveCount(0);
});
