"use client";

import type { QuestProgress } from "./quest";
import { useState, useSyncExternalStore } from "react";

function subscribeViewport(listener: () => void): () => void {
  const query = window.matchMedia("(max-width: 719px)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function getCompactViewport(): boolean {
  return window.matchMedia("(max-width: 719px)").matches;
}

function useCompactViewport(): boolean {
  return useSyncExternalStore(subscribeViewport, getCompactViewport, () => false);
}

const steps = [
  { key: "market", label: "Talk to Milo at the Market" },
  { key: "oracle", label: "Get a reading from the Oracle" },
  { key: "bag", label: "Add a companion to your bag" },
] as const;

export function QuestCard({
  progress,
}: {
  progress: QuestProgress;
}) {
  const compact = useCompactViewport();
  const [collapsedOverride, setCollapsedOverride] = useState<boolean | null>(null);
  const collapsed = collapsedOverride ?? compact;
  return (
    <aside className="rpg-frame quest-card" aria-labelledby="quest-title">
      <button
        type="button"
        className="quest-toggle"
        aria-controls="quest-content"
        aria-expanded={!collapsed}
        onClick={() => setCollapsedOverride(!collapsed)}
      >
        <span id="quest-title">Your first quest</span>
        <span aria-hidden="true">{collapsed ? "＋" : "−"}</span>
      </button>
      {!collapsed && (
        <div id="quest-content" className="quest-content">
          <ol>
            {steps.map(({ key, label }, index) => (
              <li key={key} className={progress[key] ? "quest-step is-complete" : "quest-step"}>
                <span className="quest-check" aria-label={progress[key] ? "Completed" : "Not completed"}>
                  {progress[key] ? "☑" : "☐"}
                </span>
                <span><span className="quest-number">{index + 1}.</span> {label}</span>
              </li>
            ))}
          </ol>
          <p>Then visit Camp or the Post Office</p>
        </div>
      )}
    </aside>
  );
}
