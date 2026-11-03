import type { ProductId } from "@/domain/catalog";
import { catalogFeedItemId } from "@/domain/catalog-feed";
import { getProduct } from "@/domain/catalog";
import { recordLedger, updateLedger } from "./ledger";
import { maskEmail, rememberEmail } from "./identity";

type BackInStockPayload = {
  data: {
    type: "back-in-stock-subscription";
    attributes: {
      channels: ["EMAIL"];
      profile: { data: { type: "profile"; attributes: { email: string } } };
    };
    relationships: {
      variant: { data: { type: "catalog-variant"; id: string } };
    };
  };
};

export type BackInStockResult = {
  status: "simulated" | "accepted" | "failed";
  message: string;
};

export function catalogVariantId(productId: ProductId): string {
  return `$custom:::$default:::${catalogFeedItemId(productId)}`;
}

export function buildBackInStockPayload(email: string, productId: ProductId): BackInStockPayload {
  return {
    data: {
      type: "back-in-stock-subscription",
      attributes: {
        channels: ["EMAIL"],
        profile: { data: { type: "profile", attributes: { email } } },
      },
      relationships: {
        variant: {
          data: { type: "catalog-variant", id: catalogVariantId(productId) },
        },
      },
    },
  };
}

function getSiteId(): string | null {
  const siteId = process.env.NEXT_PUBLIC_KLAVIYO_SITE_ID?.trim();
  return siteId && /^[A-Za-z0-9_-]{6,64}$/.test(siteId) ? siteId : null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendBackInStockRequest(rawEmail: string, productId: ProductId): Promise<BackInStockResult> {
  const email = rawEmail.trim();
  if (!isValidEmail(email)) return { status: "failed", message: "Enter a valid email address." };

  let ledgerId: string;
  try {
    ledgerId = recordLedger({
      channel: "client",
      operation: "back-in-stock",
      label: `Back in Stock · ${getProduct(productId).name}`,
      status: "sent",
      detail: `Recipient ${maskEmail(email)}`,
    });
  } catch {
    return { status: "failed", message: "The raven request could not be recorded." };
  }

  const finish = (status: BackInStockResult["status"], detail: string, message: string): BackInStockResult => {
    updateLedger(ledgerId, { status, detail });
    if (status === "simulated" || status === "accepted") rememberEmail(email);
    return { status, message };
  };

  if (process.env.NEXT_PUBLIC_SIDEQUEST_CLIENT_TRACKING !== "live") {
    return finish("simulated", "Demo mode; the request was simulated and no email was sent.", "Demo mode: the raven request was simulated. No Klaviyo request was made.");
  }
  const siteId = getSiteId();
  if (!siteId) {
    return finish("simulated", "A valid Klaviyo site ID is not configured; the request was simulated.", "Demo mode: the raven request was simulated. No Klaviyo request was made.");
  }

  try {
    const response = await fetch(`https://a.klaviyo.com/client/back-in-stock-subscriptions?company_id=${encodeURIComponent(siteId)}`, {
      method: "POST",
      headers: {
        revision: "2026-10-15",
        "content-type": "application/vnd.api+json",
        accept: "application/vnd.api+json",
      },
      body: JSON.stringify(buildBackInStockPayload(email, productId)),
      keepalive: true,
    });
    if (response.status === 202) {
      return finish("accepted", "Klaviyo accepted the Back in Stock request; this does not confirm email delivery.", "Raven sent — Klaviyo accepted your request");
    }
    return finish("failed", `Klaviyo returned HTTP ${response.status}.`, "The raven request could not be confirmed. Please try again.");
  } catch {
    return finish("failed", "The Back in Stock request could not be confirmed.", "The raven request could not be confirmed. Please try again.");
  }
}
