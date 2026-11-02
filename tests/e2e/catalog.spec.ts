import { expect, test } from "@playwright/test";

test("catalog consumers can fetch every product and PNG without authentication", async ({ request }) => {
  const response = await request.get("/catalog/klaviyo.json");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  const items = await response.json();
  expect(items).toHaveLength(3);
  for (const item of items) {
    const page = await request.get(new URL(item.link).pathname);
    expect(page.status()).toBe(200);
    const image = await request.get(new URL(item.image_link).pathname);
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toContain("image/png");
  }
});
