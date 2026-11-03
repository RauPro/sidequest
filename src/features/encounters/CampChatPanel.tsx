"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { maskEmail } from "@/features/klaviyo/identity";

type ChatLine = { role: "user" | "agent"; content: string };

export function CampChatPanel({
  stage,
  messages,
  pending,
  identityEmail,
  allowEmailPrompt,
  onForgetIdentity,
  onSkipEmail,
  onSend,
  onEmailChoice,
}: {
  stage: string | null;
  messages: ChatLine[];
  pending: boolean;
  identityEmail: string | null;
  allowEmailPrompt: boolean;
  onForgetIdentity: () => void;
  onSkipEmail: () => void;
  onSend: (content: string, email?: string) => void;
  onEmailChoice: (email: string | null) => void;
}) {
  const [value, setValue] = useState("");
  const [email, setEmail] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const visible = messages.slice(-12);
  const closed = stage === "camp-handoff";
  const emailChoice = stage === "camp-email";
  const askCustom = stage === "camp-custom";

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTop = transcript.scrollHeight;
  }, [messages.length, pending]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = value.trim();
    if (!content || pending || closed) return;
    onSend(content, email.trim() || identityEmail || undefined);
    setValue("");
  }

  function chooseEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onEmailChoice(email.trim() || identityEmail);
  }

  return (
    <section className="camp-chat-panel" aria-label="Camp chat">
      <div ref={transcriptRef} className="camp-transcript" role="log" aria-label="Chat transcript">
        {visible.map((message, index) => (
          <p key={`${messages.length - visible.length + index}-${message.role}`} aria-live={message.role === "agent" && index === visible.length - 1 ? "polite" : undefined}>
            <strong>{message.role === "user" ? "You:" : "Finn:"}</strong> {message.content}
          </p>
        ))}
      </div>
      {identityEmail && (
        <p className="remembered-identity">
          Remembered as {maskEmail(identityEmail)} · <button type="button" onClick={onForgetIdentity}>Forget</button>
        </p>
      )}
      {pending && <p className="camp-pending" role="status">Finn is thinking<span aria-hidden="true">…</span></p>}
      {emailChoice ? (
        <form className="camp-email-form" onSubmit={chooseEmail}>
          {!identityEmail && (
            <>
              <label htmlFor="camp-followup-email">Share your email so the guide can follow up (optional)</label>
              <input id="camp-followup-email" type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
            </>
          )}
          <button type="submit" className="rpg-btn rpg-btn--primary">Continue</button>
        </form>
      ) : closed ? null : (
        <form className="camp-chat-form" onSubmit={submit}>
          {askCustom && allowEmailPrompt && !identityEmail && (
            <>
              <label htmlFor="camp-question-email">Share your email so the guide can follow up (optional)</label>
              <input id="camp-question-email" type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
              <button type="button" className="rpg-btn" onClick={() => { setEmail(""); onSkipEmail(); }}>Skip</button>
            </>
          )}
          <label htmlFor="camp-question">Your message</label>
          <div className="camp-input-row">
            <input ref={inputRef} id="camp-question" type="text" maxLength={500} value={value} onChange={(event) => setValue(event.target.value)} disabled={pending} />
            <button type="submit" className="rpg-btn rpg-btn--primary" disabled={pending || !value.trim()}>Send</button>
          </div>
        </form>
      )}
    </section>
  );
}
