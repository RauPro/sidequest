const identityKey = "sidequest:identity:v1";
export const anonymousIdKey = "sidequest:anon:v1";
export const klaviyoKeyKey = "sidequest:kx:v1";

export type KlaviyoIdentifiers = {
  email?: string;
  _kx?: string;
  anonymous_id: string;
};

let memoryAnonymousId: string | null = null;

function createUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function captureKlaviyoIdentity() {
  if (typeof window === "undefined") return;
  let url: URL;
  try {
    url = new URL(window.location.href);
  } catch {
    return;
  }
  if (!url.searchParams.has("_kx")) return;
  const kx = url.searchParams.get("_kx");
  if (kx) {
    try {
      window.localStorage.setItem(klaviyoKeyKey, kx);
    } catch {
      // Identity storage is optional.
    }
  }
  url.searchParams.delete("_kx");
  try {
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    return;
  }
}

function getAnonymousId(): string {
  if (memoryAnonymousId) return memoryAnonymousId;
  const id = (() => {
    try {
      return window.localStorage.getItem(anonymousIdKey);
    } catch {
      return null;
    }
  })();
  if (id) {
    memoryAnonymousId = id;
    return id;
  }
  memoryAnonymousId = createUuid();
  try {
    window.localStorage.setItem(anonymousIdKey, memoryAnonymousId);
  } catch {
    // Keep the identifier for this page when storage is unavailable.
  }
  return memoryAnonymousId;
}

export function getKlaviyoIdentifiers(): KlaviyoIdentifiers {
  captureKlaviyoIdentity();
  const identifiers: KlaviyoIdentifiers = { anonymous_id: getAnonymousId() };
  const email = getRememberedEmail();
  if (email) identifiers.email = email;
  try {
    const kx = window.localStorage.getItem(klaviyoKeyKey)?.trim();
    if (kx) identifiers._kx = kx;
  } catch {
    // Identity storage is optional.
  }
  return identifiers;
}

export function getRememberedEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const email = window.localStorage.getItem(identityKey)?.trim();
    return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
  } catch {
    return null;
  }
}

export function rememberEmail(email: string): string | null {
  const value = email.trim();
  if (typeof window === "undefined" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  try {
    window.localStorage.setItem(identityKey, value);
    window.dispatchEvent(new Event("sidequest:identity"));
    return value;
  } catch {
    return null;
  }
}

export function forgetEmail() {
  if (typeof window === "undefined") return;
  memoryAnonymousId = null;
  try {
    window.localStorage.removeItem(identityKey);
    window.localStorage.removeItem(klaviyoKeyKey);
    window.localStorage.removeItem(anonymousIdKey);
  } catch {
    // Identity storage is optional.
  }
  window.dispatchEvent(new Event("sidequest:identity"));
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  return `${name?.slice(0, 1) ?? ""}•••@${domain ?? ""}`;
}
