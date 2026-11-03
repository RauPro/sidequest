export const letterIds = ["ember", "moss", "bolt", "welcome"] as const;
export type LetterId = (typeof letterIds)[number];

export function parseLetterId(value: string | null): LetterId | null {
  return letterIds.find((letter) => letter === value) ?? null;
}
