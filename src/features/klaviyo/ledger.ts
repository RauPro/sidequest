"use client";

import { useEffect, useSyncExternalStore } from "react";
import { maskEmail } from "./identity";

export type LedgerChannel = "client" | "server";
export type LedgerOperation = "event" | "subscribe" | "oracle-profile" | "camp" | "back-in-stock" | "identify";
export type LedgerStatus = "simulated" | "sent" | "accepted" | "failed" | "skipped";

export type LedgerEntry = {
  id: string;
  at: string;
  channel: LedgerChannel;
  operation: LedgerOperation;
  label: string;
  status: LedgerStatus;
  detail?: string;
};

export type NewLedgerEntry = Omit<LedgerEntry, "id" | "at">;
export type LedgerPatch = Partial<Pick<LedgerEntry, "label" | "status" | "detail">>;

export const ledgerStorageKey = "sidequest:ledger:v1";

const maxEntries = 30;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const channels: LedgerChannel[] = ["client", "server"];
const operations: LedgerOperation[] = ["event", "subscribe", "oracle-profile", "camp", "back-in-stock", "identify"];
const statuses: LedgerStatus[] = ["simulated", "sent", "accepted", "failed", "skipped"];
const emptySnapshot: readonly LedgerEntry[] = Object.freeze([]);
const listeners = new Set<() => void>();

let snapshot: readonly LedgerEntry[] = emptySnapshot;
let loaded = false;

function sanitize(value: string): string {
  return value.replace(emailPattern, (email) => maskEmail(email));
}

function freezeEntries(entries: LedgerEntry[]): readonly LedgerEntry[] {
  return Object.freeze(entries.map((entry) => Object.freeze({ ...entry })));
}

function parseEntry(value: unknown): LedgerEntry | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Record<string, unknown>;
  if (
    typeof entry.id !== "string" || !entry.id ||
    typeof entry.at !== "string" || !Number.isFinite(Date.parse(entry.at)) ||
    !channels.includes(entry.channel as LedgerChannel) ||
    !operations.includes(entry.operation as LedgerOperation) ||
    typeof entry.label !== "string" ||
    !statuses.includes(entry.status as LedgerStatus)
  ) return null;

  const detail = typeof entry.detail === "string" ? sanitize(entry.detail) : undefined;
  return {
    id: entry.id,
    at: new Date(entry.at).toISOString(),
    channel: entry.channel as LedgerChannel,
    operation: entry.operation as LedgerOperation,
    label: sanitize(entry.label),
    status: entry.status as LedgerStatus,
    ...(detail ? { detail } : {}),
  };
}

function notify() {
  for (const listener of listeners) listener();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ledgerStorageKey, JSON.stringify(snapshot));
  } catch {
    return;
  }
}

function ensureLoaded(): boolean {
  if (loaded) return false;
  loaded = true;
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(ledgerStorageKey);
    if (!raw) return false;
    const stored = JSON.parse(raw);
    if (!Array.isArray(stored)) return false;
    snapshot = freezeEntries(stored.map(parseEntry).filter((entry): entry is LedgerEntry => entry !== null).slice(0, maxEntries));
    return true;
  } catch {
    return false;
  }
}

export function subscribeLedger(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLedgerSnapshot(): readonly LedgerEntry[] {
  return snapshot;
}

export function getServerLedgerSnapshot(): readonly LedgerEntry[] {
  return emptySnapshot;
}

export function hydrateLedger() {
  if (ensureLoaded()) notify();
}

export function recordLedger(entry: NewLedgerEntry): string {
  ensureLoaded();
  const id = crypto.randomUUID();
  const detail = entry.detail ? sanitize(entry.detail) : undefined;
  const nextEntry: LedgerEntry = {
    id,
    at: new Date().toISOString(),
    channel: entry.channel,
    operation: entry.operation,
    label: sanitize(entry.label),
    status: entry.status,
    ...(detail ? { detail } : {}),
  };
  snapshot = freezeEntries([nextEntry, ...snapshot].slice(0, maxEntries));
  persist();
  notify();
  return id;
}

export function updateLedger(id: string, patch: LedgerPatch) {
  ensureLoaded();
  let changed = false;
  const next = snapshot.map((entry) => {
    if (entry.id !== id) return entry;
    changed = true;
    const detail = patch.detail === undefined ? entry.detail : patch.detail ? sanitize(patch.detail) : undefined;
    return {
      ...entry,
      ...(patch.label !== undefined ? { label: sanitize(patch.label) } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(detail ? { detail } : patch.detail !== undefined ? { detail: undefined } : {}),
    };
  });
  if (!changed) return;
  snapshot = freezeEntries(next);
  persist();
  notify();
}

export function useLedger(): readonly LedgerEntry[] {
  const entries = useSyncExternalStore(subscribeLedger, getLedgerSnapshot, getServerLedgerSnapshot);
  useEffect(() => hydrateLedger(), []);
  return entries;
}
