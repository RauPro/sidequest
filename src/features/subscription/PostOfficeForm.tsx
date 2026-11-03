"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { maskEmail } from "@/features/klaviyo/identity";

export function PostOfficeForm({
  identityEmail,
  onEmailSubmitted,
  onForgetIdentity,
}: {
  identityEmail: string | null;
  onEmailSubmitted: (email: string) => void;
  onForgetIdentity: () => void;
}) {
  const [mode, setMode] = useState<"demo" | "live" | null>(null);
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/subscribe", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Subscription is temporarily unavailable.");
        const result = await response.json();
        if (result.mode !== "demo" && result.mode !== "live") throw new Error("Subscription is temporarily unavailable.");
        setMode(result.mode);
        setConfirmationRequired(result.confirmationRequired === true);
      })
      .catch((error) => { if (!controller.signal.aborted) setMessage(error.message); });
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || submitted || !mode || !consent) return;
    const submittedEmail = new FormData(event.currentTarget).get("email");
    if (typeof submittedEmail !== "string" || !submittedEmail.trim()) return;
    submitting.current = true;
    setPending(true);
    setMessage("");
    const value = submittedEmail.trim();
    onEmailSubmitted(value);
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, consent }),
      });
      const result = await response.json();
      if (!response.ok && result.error === "provider_outcome_unknown") setSubmitted(true);
      if (!response.ok) throw new Error(typeof result.message === "string" ? result.message : "Please try again.");
      if (result.status === "simulated") {
        setMessage("Demo request validated. No subscription was created and no email was sent.");
      } else if (result.status === "accepted" && result.operation === "subscribe") {
        setSubmitted(true);
        setMessage(result.confirmationRequired === true
          ? "Your request was accepted. Check your inbox to confirm your subscription if you haven’t already."
          : "Your request was accepted for processing. If confirmation is required, check your inbox. Subscription is not yet verified here.");
      } else {
        throw new Error("The server returned an unexpected status.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The request could not be completed.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section className="post-office-form">
      {mode === "demo" && <p>Demo: no subscription or email delivery takes place.</p>}
      {confirmationRequired && <p>Confirm your email to join. You can unsubscribe at any time.</p>}
      {identityEmail && (
        <p className="remembered-identity">
          Remembered as {maskEmail(identityEmail)} · <button type="button" onClick={onForgetIdentity}>Forget</button>
        </p>
      )}
      <form onSubmit={submit}>
        <label htmlFor="newsletter-email">Email address</label>
        <input key={identityEmail ?? "anonymous"} id="newsletter-email" name="email" type="email" autoComplete="email" maxLength={254} required aria-describedby="subscription-status" defaultValue={identityEmail ?? ""} />
        <label className="post-consent">
          <input name="consent" type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          I agree to receive companion news and village updates.
        </label>
        <button type="submit" className="rpg-btn rpg-btn--primary" disabled={pending || submitted || !mode}>
          {pending ? "Submitting…" : "Send letter request"}
        </button>
        <p id="subscription-status" role="status" aria-live="polite">{message}</p>
      </form>
    </section>
  );
}
