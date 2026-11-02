# Product pages and Klaviyo catalog

Production origin: <https://sidequest.raul.engineer>.

| Companion | Product page | PNG image |
| --- | --- | --- |
| Ember | `/products/ember` | `/images/products/ember.png` |
| Moss | `/products/moss` | `/images/products/moss.png` |
| Bolt | `/products/bolt` | `/images/products/bolt.png` |

Pages use `src/domain/catalog.ts` for stable IDs, names, demo prices and availability. Copy is in `src/features/products/product-copy.ts`. Each page uses the existing shared cart and states that purchases are simulated. The store layout supplies the header and main landmark; product pages must not add a second copy.

The inline SVG and 512×512 PNG exports share `src/features/products/illustrations.ts`. Run `npm run images:export` after artwork changes; `npm run build` also regenerates the PNGs. They are original pixel-art concepts on an opaque cream background, suitable for email image links.

## Custom catalog source

Feed: <https://sidequest.raul.engineer/catalog/klaviyo.json>.

The Route Handler reads the same catalog and returns a public JSON array with `Cache-Control: no-store`. URLs use the production origin explicitly, even during preview builds. The feed contains only public product data, requires no API key, and does not send events or emails.

In Klaviyo **Content → Products → Manage Custom Catalog Sources**, define the source **SIDEQUEST companions** using that URL. Map:

| Feed field | Klaviyo field | Type |
| --- | --- | --- |
| `id` | `$id` | Text |
| `title` | `$title` | Text |
| `link` | `$link` | Text |
| `image_link` | `$image_link` | Text |
| `description` | `$description` | Text |
| `price` | `$price` | Number |
| `categories` | `categories` | List |
| `currency` | `currency` | Text |
| `availability` | `availability` | Text |

Prices are dollar amounts (24, 18, 28), not minor units. Availability describes demo browsing, not physical stock. No inventory count is invented. Use the `Available` category to filter recommendations if configured; the custom availability field alone does not enforce Klaviyo inventory rules.

## Updating products

1. Edit the catalog and any associated copy/artwork. Keep IDs stable.
2. Regenerate images, run the required checks, commit the related files, and deploy the release to the existing Vercel `sidequest` project.
3. Check the public page, PNG and feed. Klaviyo polls the feed every six hours; use its source sync action when an immediate refresh is available.
4. Verify the imported product values in Klaviyo. Do not also mutate this feed-managed catalog through the Catalogs API.

Personalized recommendations and product blocks may require Klaviyo Support to configure the catalog's event metric and ProductID mapping. Catalog synchronization alone does not install tracking, enable subscription delivery, or activate the welcome flow.

Reference checked November 2, 2026: [Klaviyo custom catalog guide](https://developers.klaviyo.com/en/docs/guide_to_syncing_a_custom_catalog_feed_to_klaviyo).
