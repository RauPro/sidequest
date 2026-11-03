import { expect, test } from "@playwright/test";

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
