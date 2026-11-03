"use client";

import { useEffect, useRef } from "react";
import { useLedger } from "./ledger";

export function RavenLedgerPanel({
  opener,
  onClose,
}: {
  opener: HTMLElement | null;
  onClose: () => void;
}) {
  const entries = useLedger();
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      } else if (event.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex='-1'])");
        if (!focusable?.length) {
          event.preventDefault();
          dialogRef.current?.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (opener?.isConnected) opener.focus();
    };
  }, [opener]);

  return (
    <div className="raven-ledger-backdrop">
      <section
        ref={dialogRef}
        className="rpg-frame raven-ledger-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="raven-ledger-title"
        tabIndex={-1}
      >
        <header className="raven-ledger-header">
          <div>
            <p className="side-panel-eyebrow">RAVEN POST</p>
            <h2 id="raven-ledger-title">Raven Ledger — messages sent to Klaviyo</h2>
          </div>
          <button ref={closeRef} type="button" className="rpg-btn raven-ledger-close" aria-label="Close Raven Ledger" onClick={onClose}>
            ×
          </button>
        </header>
        <p className="raven-ledger-explainer">
          Demo entries are simulated. Live entries show HTTP acceptance or failure; accepted ≠ delivered.
        </p>
        {entries.length === 0 ? (
          <p className="raven-ledger-empty">No ravens yet. Events and messages from your journey will appear here.</p>
        ) : (
          <ol className="raven-ledger-entries">
            {entries.map((entry) => (
              <li key={entry.id} className="raven-ledger-entry" data-testid="ledger-entry">
                <div className="raven-ledger-entry-heading">
                  <strong>{entry.label}</strong>
                  <time dateTime={entry.at}>{new Date(entry.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                </div>
                <div className="raven-ledger-entry-meta">
                  <span>{entry.operation}</span>
                  <span className="raven-ledger-status" data-status={entry.status}>{entry.status}</span>
                </div>
                {entry.detail && <p>{entry.detail}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
