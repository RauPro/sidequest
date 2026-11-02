"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { getProduct } from "@/domain/catalog";
import { moods, recommend, type DeskMood } from "@/domain/recommendations";
import { Panel } from "@/components/ui/Panel";

function readStoredMood(): DeskMood | null {
  try {
    const saved = localStorage.getItem("sidequest:oracle:mood");
    return moods.find(value => value === saved) ?? null;
  } catch { return null; }
}
function subscribeToStorage(listener: () => void) {
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}
const serverMood = () => null;

export function OraclePanel() {
  const storedMood = useSyncExternalStore(subscribeToStorage, readStoredMood, serverMood);
  const [selection, setSelection] = useState<DeskMood | null>(null);
  const mood = selection ?? storedMood;
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  function choose(value: DeskMood) {
    setSelection(value);
    setMessage("");
    try { localStorage.setItem("sidequest:oracle:mood", value); } catch { /* Optional persistence. */ }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mood || submitting.current) return;
    submitting.current = true; setPending(true); setMessage("");
    const email = new FormData(event.currentTarget).get("email");
    try {
      const response = await fetch("/api/oracle/preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, mood }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Your preference could not be saved.");
      if (result.status === "saved" && result.saved === true) setMessage("Your Oracle preferences are saved to your Klaviyo profile. No newsletter subscription was added.");
      else if (result.status === "simulated") setMessage("Demo request validated. Your preference was not sent to Klaviyo.");
      else throw new Error("Your preference could not be verified.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Your preference could not be saved."); }
    finally { submitting.current = false; setPending(false); }
  }
  const result = mood ? recommend(mood) : null;
  return <Panel title="The Oracle"><p>Choose a desk mood to try the starter recommendation rule.</p>
    <div className="actions">{moods.map((item) => <button disabled={pending} key={item} aria-pressed={mood === item} onClick={() => choose(item)}>{item}</button>)}</div>
    <div aria-live="polite">{result && <p><strong>{getProduct(result.productId).name}</strong> — {result.explanation}</p>}</div>
    {result && <form onSubmit={save}>
      <h3>Remember my Oracle choice</h3>
      <p>Save your desk mood and companion preference to the Klaviyo profile for your email. This does not subscribe you to marketing. Profile saving is currently available to invited demo testers.</p>
      <label htmlFor="oracle-email">Your email address</label>
      <input id="oracle-email" name="email" type="email" autoComplete="email" maxLength={254} required disabled={pending} aria-describedby="oracle-save-status" />
      <button disabled={pending}>{pending ? "Saving…" : "Save my Oracle preferences"}</button>
      <p id="oracle-save-status" role="status">{message}</p>
    </form>}
  </Panel>;
}
