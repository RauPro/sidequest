const identityKey = "sidequest:identity:v1";

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
  try {
    window.localStorage.removeItem(identityKey);
    window.dispatchEvent(new Event("sidequest:identity"));
  } catch {
    return;
  }
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  return `${name?.slice(0, 1) ?? ""}•••@${domain ?? ""}`;
}
