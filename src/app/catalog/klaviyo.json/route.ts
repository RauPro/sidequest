import { createCatalogFeed } from "@/domain/catalog-feed";

export function GET() {
  return Response.json(createCatalogFeed(), {
    headers: { "Cache-Control": "no-store" },
  });
}
