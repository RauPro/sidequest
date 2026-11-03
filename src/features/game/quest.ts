import { useSyncExternalStore } from "react";

export type QuestProgress = Readonly<{
  market: boolean;
  oracle: boolean;
  bag: boolean;
}>;

export const questStorageKey = "sidequest:quest:v1";
export const emptyQuestProgress: QuestProgress = Object.freeze({
  market: false,
  oracle: false,
  bag: false,
});

let clientProgress = emptyQuestProgress;
let storageRead = false;
const listeners = new Set<() => void>();

function getClientProgress(): QuestProgress {
  if (!storageRead && typeof window !== "undefined") {
    storageRead = true;
    try {
      clientProgress = restoreQuestProgress(window.localStorage.getItem(questStorageKey));
    } catch {
      clientProgress = emptyQuestProgress;
    }
  }
  return clientProgress;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useQuestProgress(): QuestProgress {
  return useSyncExternalStore(subscribe, getClientProgress, () => emptyQuestProgress);
}

export function updateQuestProgress(
  update: (current: QuestProgress) => QuestProgress,
): void {
  const next = update(getClientProgress());
  if (next.market === clientProgress.market && next.oracle === clientProgress.oracle && next.bag === clientProgress.bag) return;
  clientProgress = Object.freeze(next);
  storageRead = true;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(questStorageKey, serializeQuestProgress(clientProgress));
    } catch {
      // Quest progress remains available for this visit when storage is blocked.
    }
  }
  listeners.forEach((listener) => listener());
}

export function restoreQuestProgress(serialized: string | null): QuestProgress {
  if (!serialized) return emptyQuestProgress;
  try {
    const value: unknown = JSON.parse(serialized);
    if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1 || !("steps" in value)) {
      return emptyQuestProgress;
    }
    const steps = value.steps;
    if (!steps || typeof steps !== "object") return emptyQuestProgress;
    return Object.freeze({
      market: "market" in steps && steps.market === true,
      oracle: "oracle" in steps && steps.oracle === true,
      bag: "bag" in steps && steps.bag === true,
    });
  } catch {
    return emptyQuestProgress;
  }
}

export function serializeQuestProgress(progress: QuestProgress): string {
  return JSON.stringify({ version: 1, steps: progress });
}
