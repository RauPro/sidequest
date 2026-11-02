"use client";

import { useState } from "react";
import { getProduct } from "@/domain/catalog";
import { moods, recommend, type DeskMood } from "@/domain/recommendations";
import { Panel } from "@/components/ui/Panel";

export function OraclePanel() {
  const [mood, setMood] = useState<DeskMood | null>(null);
  const result = mood ? recommend(mood) : null;
  return <Panel title="The Oracle"><p>Choose a desk mood to try the starter recommendation rule.</p>
    <div className="actions">{moods.map((item) => <button key={item} aria-pressed={mood === item} onClick={() => setMood(item)}>{item}</button>)}</div>
    <div aria-live="polite">{result && <p><strong>{getProduct(result.productId).name}</strong> — {result.explanation}</p>}</div>
  </Panel>;
}
