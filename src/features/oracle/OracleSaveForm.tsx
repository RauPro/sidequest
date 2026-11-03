"use client";

import { useRef, useState, type FormEvent } from "react";
import type { DeskMood } from "@/domain/recommendations";

export function OracleSaveForm({
  mood,
  onEmailSubmitted,
}: {
  mood: DeskMood;
  onEmailSubmitted: (email: string) => void;
}) {
  const [status, setStatus] = useState("");
  const pending = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    if (typeof email !== "string") return;
    pending.current = true;
    setStatus("");
    onEmailSubmitted(email);
    try {
      const response = await fetch("/api/oracle/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mood }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "The Oracle could not save this reading.");
      if (result.status === "saved" && result.saved === true) {
        setStatus("Your reading is written in the stars — saved to your Klaviyo profile.");
      } else if (result.status === "simulated") {
        setStatus("Demo mode: the reading was checked but not saved anywhere.");
      } else {
        throw new Error("The Oracle could not verify this reading.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The Oracle could not save this reading.");
    } finally {
      pending.current = false;
    }
  }

  return (
    <form className="oracle-save-form" onSubmit={submit}>
      <label htmlFor="oracle-reading-email">Your email address</label>
      <input id="oracle-reading-email" name="email" type="email" autoComplete="email" maxLength={254} required aria-describedby="oracle-reading-status" />
      <button type="submit" className="rpg-btn rpg-btn--primary">Save reading</button>
      <p id="oracle-reading-status" role="status" aria-live="polite">{status}</p>
    </form>
  );
}
