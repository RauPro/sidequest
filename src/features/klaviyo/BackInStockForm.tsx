"use client";

import { useState, type FormEvent } from "react";
import type { ProductId } from "@/domain/catalog";
import { useIdentity } from "./useIdentity";
import { sendBackInStockRequest } from "./backInStock";

export function BackInStockForm({ productId, productName }: { productId: ProductId; productName: string }) {
  const { email: rememberedEmail } = useIdentity();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || submitted) return;
    const submittedEmail = new FormData(event.currentTarget).get("email");
    if (typeof submittedEmail !== "string") return;
    setPending(true);
    setMessage("");
    try {
      const result = await sendBackInStockRequest(submittedEmail, productId);
      setMessage(result.message);
      setSubmitted(result.status === "accepted" || result.status === "simulated");
    } catch {
      setMessage("The raven request could not be confirmed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const emailId = `back-in-stock-email-${productId}`;
  const statusId = `back-in-stock-status-${productId}`;
  return (
    <form className="rpg-frame back-in-stock-form" onSubmit={submit} aria-label={`Send a raven when ${productName} returns`}>
      <h3>Send a raven when {productName} returns</h3>
      <p>We&apos;ll email you once when {productName} is back. This doesn&apos;t subscribe you to the newsletter.</p>
      <label htmlFor={emailId}>Email address</label>
      <input
        key={rememberedEmail ?? "anonymous"}
        id={emailId}
        name="email"
        type="email"
        autoComplete="email"
        maxLength={254}
        required
        defaultValue={rememberedEmail ?? ""}
        aria-describedby={statusId}
      />
      <button type="submit" className="rpg-btn rpg-btn--primary" disabled={pending || submitted}>
        {pending ? "Sending the raven…" : submitted ? "Raven accepted" : "Send the raven"}
      </button>
      <p id={statusId} role="status" aria-live="polite">{message}</p>
    </form>
  );
}
