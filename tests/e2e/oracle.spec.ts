import { expect, test } from "@playwright/test";

test("letter deep link opens a personalized Post Office letter and visits its companion", async ({ page }) => {
  await page.goto("/?letter=ember");
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
  const dialog = page.getByRole("dialog", { name: "Milo · Merchant" });
  await expect(dialog).toContainText("Ember");
  await expect(page).not.toHaveURL(/letter=/);
  await dialog.getByRole("button", { name: "Visit Ember at the Market", exact: true }).click();
  await expect(page.getByRole("complementary", { name: "Ember details" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Add to bag/ })).toBeVisible();
});

test("Oracle reveals Ember for bold/fantasy and adds the recommendation to the shared bag", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
    await page.getByRole("button", { name: "Oracle", exact: true }).click();
    await page.getByRole("button", { name: /Bold/ }).click();
    await page.getByRole("button", { name: /Fantasy/ }).click();
    await expect(page.getByText("Ember", { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: /Add Ember to bag/ }).click();
    await expect(page.getByRole("button", { name: "Bag, 1 item" })).toBeVisible();
});

test("Oracle retains the selected choice and email after a failed save", async ({ page }) => {
  await page.route("**/api/oracle/preferences", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Preference saving is unavailable." }) }));
  await page.goto("/");
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Oracle", exact: true }).click();
  await page.getByRole("button", { name: /Curious/ }).click();
  await page.getByRole("button", { name: /Technology/ }).click();
  await page.getByRole("button", { name: "Remember this reading", exact: true }).click();
  await page.getByLabel("Your email address", { exact: true }).fill("tester@example.com");
  await page.getByRole("button", { name: "Save reading", exact: true }).click();
  await expect(page.getByText("Preference saving is unavailable.")).toBeVisible();
  await expect(page.getByLabel("Your email address", { exact: true })).toHaveValue("tester@example.com");
});

test("Oracle and bag actions appear in the Raven Ledger on village and store views", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sidequest:identity:v1", "tester@example.com"));
  await page.goto("/");
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Oracle", exact: true }).click();
  await page.getByRole("button", { name: /Bold/ }).click();
  await page.getByRole("button", { name: /Fantasy/ }).click();
  await page.getByRole("button", { name: /Add Ember to bag/ }).click();
  await page.getByRole("button", { name: /Ravens/ }).click();

  const dialog = page.getByRole("dialog", { name: "Raven Ledger — messages sent to Klaviyo" });
  await expect(dialog).toBeVisible();
  const entries = dialog.getByTestId("ledger-entry");
  await expect(entries.filter({ hasText: "Viewed Product" })).toContainText("simulated");
  await expect(entries.filter({ hasText: "Added to Cart" })).toContainText("simulated");
  await expect(dialog).toContainText("t•••@example.com");

  await page.keyboard.press("Escape");
  const ravensButton = page.getByRole("button", { name: /Ravens/ });
  await expect(ravensButton).toBeFocused();
  await page.keyboard.press("l");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("/shop");
  await page.getByRole("button", { name: /Ravens/ }).click();
  await expect(page.getByRole("dialog", { name: "Raven Ledger — messages sent to Klaviyo" })).toBeVisible();
});
