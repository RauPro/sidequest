import { expect, test } from "@playwright/test";

test("Camp answers its checkout quick reply in demo without showing a handoff", async ({ page }) => {
  await page.goto("/?visit=camp");
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("heading", { name: "Finn · Camp guide" })).toBeVisible();
  await page.getByRole("button", { name: "How does checkout work?", exact: true }).click();
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await expect(page.getByText("Checkout is a demo: no payment is taken and nothing is delivered.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start a new chat" })).toHaveCount(0);
  await expect(page.getByText("This chat is closed", { exact: false })).toHaveCount(0);
});

test("Camp reuses remembered email without prompting before the first chat turn", async ({ page }) => {
  let submitted: Record<string, unknown> | undefined;
  await page.route("**/api/camp/chat", async (route) => {
    submitted = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "simulated",
        open: true,
        replies: [{ kind: "message", text: "Checkout is a demo: no payment is taken and nothing is delivered." }],
      }),
    });
  });
  await page.goto("/");
  await expect(page.getByTestId("village-map")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Post Office", exact: true }).click();
  await page.getByLabel("Email address", { exact: true }).fill("traveler@example.com");
  await page.getByRole("checkbox", { name: /I agree to receive companion news/ }).check();
  await page.getByRole("button", { name: "Send letter request" }).click();
  await expect(page.getByText("Demo request validated. No subscription was created and no email was sent.")).toBeVisible();
  await page.getByRole("button", { name: "Not now", exact: true }).click();
  await page.getByRole("button", { name: "Camp", exact: true }).click();
  await expect(page.getByText("Remembered as t•••@example.com")).toBeVisible();
  await page.getByRole("button", { name: "How does checkout work?", exact: true }).click();
  await expect(page.getByText("Checkout is a demo: no payment is taken and nothing is delivered.")).toBeVisible();
  expect(submitted?.email).toBe("traveler@example.com");
  expect(submitted?.messages).toEqual([{ role: "user", content: "How does checkout work?" }]);
});
