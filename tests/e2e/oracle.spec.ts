import { expect, test } from "@playwright/test";

for (const route of ["/shop", "/"]) {
  test(`Oracle remembers the local choice and reports a simulated profile save truthfully at ${route}`, async ({ page }) => {
    await page.goto(route);
    if (route === "/") {
      await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
      await page.getByRole("button", { name: "Oracle", exact: true }).click();
    }
    await page.getByRole("button", { name: "calm", exact: true }).click();
    await expect(page.getByText("You chose a calm desk mood. Moss keeps things gentle.", { exact: false })).toBeVisible();
    await page.reload();
    if (route === "/") await page.getByRole("button", { name: "Oracle", exact: true }).click();
    await expect(page.getByRole("button", { name: "calm", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByLabel("Your email address", { exact: true }).fill("tester@example.com");
    await page.getByRole("button", { name: "Save my Oracle preferences" }).click();
    await expect(page.getByText("Demo request validated. Your preference was not sent to Klaviyo.")).toBeVisible();
    if (route === "/") {
      await page.getByRole("link", { name: "Shop view", exact: true }).click();
      await expect(page.getByRole("button", { name: "calm", exact: true })).toHaveAttribute("aria-pressed", "true");
    }
  });
}

test("Oracle retains the selected choice and email after a failed save", async ({ page }) => {
  await page.route("**/api/oracle/preferences", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Preference saving is unavailable." }) }));
  await page.goto("/shop");
  await page.getByRole("button", { name: "curious", exact: true }).click();
  await page.getByLabel("Your email address", { exact: true }).fill("tester@example.com");
  await page.getByRole("button", { name: "Save my Oracle preferences" }).click();
  await expect(page.getByText("Preference saving is unavailable.")).toBeVisible();
  await expect(page.getByLabel("Your email address", { exact: true })).toHaveValue("tester@example.com");
  await expect(page.getByRole("button", { name: "curious", exact: true })).toHaveAttribute("aria-pressed", "true");
});
