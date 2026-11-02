"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Panel } from "@/components/ui/Panel";

export function SubscriptionForm() {
  const [mode, setMode] = useState<"demo" | "live" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/subscribe", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Subscription is temporarily unavailable.");
        const result = await response.json();
        if (result.mode !== "demo" && result.mode !== "live") throw new Error("Subscription is temporarily unavailable.");
        setMode(result.mode);
      })
      .catch(error => { if (!controller.signal.aborted) setMessage(error.message); });
    return () => controller.abort();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || submitted || !mode) return;
    submitting.current = true;
    setPending(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), consent: data.get("consent") === "on" }),
      });
      const result = await response.json();
      if (!response.ok && result.error === "provider_outcome_unknown") setSubmitted(true);
      if (!response.ok) throw new Error(typeof result.message === "string" ? result.message : "Please try again.");
      if (result.status === "simulated") {
        setMessage("Demo request validated. No subscription was created and no email was sent.");
      } else if (result.status === "accepted" && result.operation === "subscribe") {
        setSubmitted(true);
        setMessage("Your request was accepted for processing. If confirmation is required, check your inbox. Subscription is not yet verified here.");
      } else throw new Error("The server returned an unexpected status.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The request could not be completed.");
    } finally { submitting.current = false; setPending(false); }
  }
  return <Panel title="Post Office"><p>Receive companion news and letters from Willow Market.</p>{mode === "demo" && <p>This is a demo: no subscription or email delivery takes place.</p>}
    <form onSubmit={submit}>
      <label htmlFor="newsletter-email">Email address</label>
      <input id="newsletter-email" name="email" type="email" autoComplete="email" maxLength={254} required aria-describedby="subscription-status" />
      <label className="consent"><input name="consent" type="checkbox" required /> I agree to receive companion news and village updates.</label>
      <button disabled={pending || submitted || !mode}>{pending ? "Submitting…" : submitted ? "Request submitted" : mode === "demo" ? "Try demo subscription" : "Subscribe to village letters"}</button>
      <p id="subscription-status" role="status">{message}</p>
    </form>
  </Panel>;
}
