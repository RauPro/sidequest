import { expect, test } from "@playwright/test";

for (const outcome of ["accepted", "unknown"] as const) {
  test(`village Post Office reports ${outcome} subscription without repeat submission`, async ({ page }) => {
    let submissions = 0;
    await page.route("**/api/subscribe", async route => {
      if (route.request().method() === "GET") {
        await route.fulfill({ json: { mode: "live" } });
        return;
      }
      submissions++;
      expect(route.request().postDataJSON()).toEqual({ email: "tester@example.com", consent: true });
      await route.fulfill(outcome === "accepted"
        ? { status: 202, json: { status: "accepted", operation: "subscribe", subscription: "pending" } }
        : { status: 503, json: { error: "provider_outcome_unknown", message: "The subscription result is unknown. Check its status before trying again." } });
    });
    await page.goto("/");
    await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
    await page.getByRole("button", { name: "Post Office", exact: true }).click();
    await page.getByLabel("Email address", { exact: true }).fill("tester@example.com");
    const consent = page.getByRole("checkbox", { name: /agree/i });
    await expect(consent).not.toBeChecked();
    await consent.check();
    await page.getByRole("button", { name: "Subscribe to village letters" }).click();
    await expect(page.getByRole("status")).toContainText(outcome === "accepted"
      ? "Subscription is not yet verified here."
      : "The subscription result is unknown.");
    await expect(page.getByRole("button", { name: "Request submitted" })).toBeDisabled();
    await expect(page.getByLabel("Email address", { exact: true })).toHaveValue("tester@example.com");
    expect(submissions).toBe(1);
  });
}
