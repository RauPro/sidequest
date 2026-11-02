"use client";

import { useRef, useState, type FormEvent } from "react";
import { Panel } from "@/components/ui/Panel";

export function SubscriptionForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
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
      if (!response.ok) throw new Error(typeof result.message === "string" ? result.message : "Please try again.");
      if (result.status !== "simulated") throw new Error("The server returned an unexpected status.");
      setMessage("Demo request validated. No subscription was created and no email was sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The request could not be completed.");
    } finally { submitting.current = false; setPending(false); }
  }
  return <Panel title="Post Office"><p>Try the subscription form. This foundation only simulates the request.</p>
    <form onSubmit={submit}>
      <label htmlFor="newsletter-email">Email address</label>
      <input id="newsletter-email" name="email" type="email" autoComplete="email" maxLength={254} required aria-describedby="subscription-status" />
      <label className="consent"><input name="consent" type="checkbox" required /> I agree to receive companion news and village updates.</label>
      <button disabled={pending}>{pending ? "Checking…" : "Try demo subscription"}</button>
      <p id="subscription-status" role="status">{message}</p>
    </form>
  </Panel>;
}
