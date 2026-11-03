import { afterEach, describe, expect, it, vi } from "vitest";
import { maskEmail } from "./identity";

function storage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

async function freshLedger() {
  vi.resetModules();
  return import("./ledger");
}

afterEach(() => vi.unstubAllGlobals());

describe("Raven Ledger store", () => {
  it("keeps newest entries first and caps memory and storage at 30", async () => {
    const session = storage();
    vi.stubGlobal("window", { sessionStorage: session });
    const { getLedgerSnapshot, ledgerStorageKey, recordLedger } = await freshLedger();

    for (let i = 0; i < 35; i += 1) {
      recordLedger({ channel: "client", operation: "event", label: `Entry ${i}`, status: "simulated" });
    }

    expect(getLedgerSnapshot()).toHaveLength(30);
    expect(getLedgerSnapshot()[0].label).toBe("Entry 34");
    expect(getLedgerSnapshot()[29].label).toBe("Entry 5");
    expect(JSON.parse(session.values.get(ledgerStorageKey) ?? "[]")).toHaveLength(30);
  });

  it("updates an entry and masks email addresses before memory or storage", async () => {
    const session = storage();
    vi.stubGlobal("window", { sessionStorage: session });
    const { getLedgerSnapshot, ledgerStorageKey, recordLedger, updateLedger } = await freshLedger();
    const email = "visitor@example.com";

    const id = recordLedger({
      channel: "server",
      operation: "subscribe",
      label: `Newsletter request for ${email}`,
      status: "sent",
      detail: `unique_id abcdef12… · Ember · $24.00 · HTTP 202 accepted · Recipient ${email}`,
    });
    updateLedger(id, {
      status: "accepted",
      detail: `unique_id abcdef12… · Ember · $24.00 · HTTP 202 accepted · Recipient ${email}`,
    });

    const [entry] = getLedgerSnapshot();
    expect(entry).toMatchObject({
      id,
      status: "accepted",
      label: `Newsletter request for ${maskEmail(email)}`,
      detail: `unique_id abcdef12… · Ember · $24.00 · HTTP 202 accepted · Recipient ${maskEmail(email)}`,
    });
    expect(JSON.stringify(JSON.parse(session.values.get(ledgerStorageKey) ?? "[]"))).not.toContain(email);
  });

  it("hydrates from storage and exposes an empty server snapshot", async () => {
    const session = storage();
    session.setItem("sidequest:ledger:v1", JSON.stringify([{
      id: "stored",
      at: "2026-11-03T00:00:00.000Z",
      channel: "client",
      operation: "event",
      label: "Viewed Product",
      status: "simulated",
    }]));
    vi.stubGlobal("window", { sessionStorage: session });
    const { getLedgerSnapshot, getServerLedgerSnapshot, hydrateLedger } = await freshLedger();

    expect(getServerLedgerSnapshot()).toEqual([]);
    expect(getLedgerSnapshot()).toEqual([]);
    hydrateLedger();
    expect(getLedgerSnapshot().map(({ id }) => id)).toEqual(["stored"]);
  });

  it("keeps entries in memory when session storage fails", async () => {
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: () => { throw new Error("storage unavailable"); },
        setItem: () => { throw new Error("storage unavailable"); },
      },
    });
    const { getLedgerSnapshot, recordLedger } = await freshLedger();

    recordLedger({ channel: "client", operation: "event", label: "Viewed Product", status: "simulated" });

    expect(getLedgerSnapshot()).toHaveLength(1);
    expect(getLedgerSnapshot()[0].label).toBe("Viewed Product");
  });
});
