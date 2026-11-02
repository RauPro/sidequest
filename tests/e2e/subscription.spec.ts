import { expect, test } from "@playwright/test";

for (const outcome of ["accepted", "confirmation", "unknown"] as const) {
  test(`village Post Office reports ${outcome} subscription without repeat submission`, async ({ page }) => {
    let submissions = 0;
    await page.route("**/api/subscribe", async route => {
      if (route.request().method() === "GET") {
        await route.fulfill({ json: { mode: "live", confirmationRequired: outcome === "confirmation" } });
        return;
      }
      submissions++;
      expect(route.request().postDataJSON()).toEqual({ email: "tester@example.com", consent: true });
      await route.fulfill(outcome !== "unknown"
        ? { status: 202, json: { status: "accepted", operation: "subscribe", subscription: "pending", confirmationRequired: outcome === "confirmation" } }
        : { status: 503, json: { error: "provider_outcome_unknown", message: "The subscription result is unknown. Check its status before trying again." } });
    });
    await page.goto("/");
    await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
    await page.getByRole("button", { name: "Post Office", exact: true }).click();
    if (outcome === "confirmation") await expect(page.getByText("Confirm your email to join. You can unsubscribe at any time.")).toBeVisible();
    await page.getByLabel("Email address", { exact: true }).fill("tester@example.com");
    const consent = page.getByRole("checkbox", { name: /agree/i });
    await expect(consent).not.toBeChecked();
    await consent.check();
    await page.getByRole("button", { name: "Subscribe to village letters" }).click();
    await expect(page.getByRole("status")).toContainText(outcome === "accepted"
      ? "Subscription is not yet verified here."
      : outcome === "confirmation" ? "Check your inbox to confirm your subscription"
      : "The subscription result is unknown.");
    await expect(page.getByRole("button", { name: "Request submitted" })).toBeDisabled();
    await expect(page.getByLabel("Email address", { exact: true })).toHaveValue("tester@example.com");
    expect(submissions).toBe(1);
  });
}
