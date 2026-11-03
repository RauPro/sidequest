"use client";

import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";
import type { NpcId, ResolvedNode } from "./types";

const speakers = {
  milo: "Milo · Merchant",
  oracle: "The Oracle · Seer",
  finn: "Finn · Camp guide",
  pip: "Pip · Postmaster",
  bag: "Your backpack",
} as const;

export function DialogueBox({
  node,
  speakerOverride,
  children,
  onChoose,
}: {
  node: ResolvedNode;
  speakerOverride?: NpcId;
  children?: ReactNode;
  onChoose: (choiceId: string) => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const choicesRef = useRef(node.choices);
  const onChooseRef = useRef(onChoose);

  useEffect(() => {
    choicesRef.current = node.choices;
    onChooseRef.current = onChoose;
  }, [node.choices, onChoose]);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (!/^[1-4]$/.test(event.key)) return;
      const target = event.target;
      if (target instanceof HTMLElement && (
        target.isContentEditable || target.matches("input, textarea, select")
      )) return;
      const choice = choicesRef.current[Number(event.key) - 1];
      if (!choice) return;
      event.preventDefault();
      onChooseRef.current(choice.id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const speakerId = speakerOverride ?? node.speaker;
  const speakerLabel = speakers[speakerId];
  return (
    <section
      ref={dialogRef}
      className={`rpg-frame dialogue-box${speakerId === "finn" ? " camp-dialogue" : ""}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="dialogue-speaker"
      tabIndex={-1}
    >
      {speakerId === "bag" ? (
        <div className="dialogue-portrait backpack-portrait" aria-hidden="true">
          <svg viewBox="0 0 16 16" shapeRendering="crispEdges">
            <rect x="6" y="1" width="4" height="2" fill="#d4a857" />
            <rect x="5" y="3" width="6" height="2" fill="#6f442f" />
            <rect x="3" y="5" width="10" height="9" fill="#8b5437" />
            <rect x="4" y="6" width="8" height="6" fill="#c77d42" />
            <rect x="5" y="8" width="6" height="4" fill="#8b5437" />
            <rect x="6" y="9" width="4" height="2" fill="#d4a857" />
            <rect x="2" y="6" width="1" height="6" fill="#d4a857" />
            <rect x="13" y="6" width="1" height="6" fill="#d4a857" />
            <rect x="4" y="14" width="2" height="1" fill="#d4a857" />
            <rect x="10" y="14" width="2" height="1" fill="#d4a857" />
          </svg>
        </div>
      ) : (
        <div className="dialogue-portrait">
          <Image
            src={`/game/portraits/${speakerId}.webp`}
            alt=""
            width={112}
            height={112}
            className="game-image"
            aria-hidden="true"
          />
        </div>
      )}
      <div className="dialogue-content">
        <h2 id="dialogue-speaker">{speakerLabel}</h2>
        {node.text && <p className="dialogue-text">{node.text}</p>}
        {children}
        <div className="dialogue-choices">
          {node.choices.map((choice, index) => (
            <button key={choice.id} type="button" className="rpg-choice" onClick={() => onChoose(choice.id)}>
              {index < 4 && <span className="rpg-hotkey" aria-hidden="true">[{index + 1}]</span>}
              <span>{choice.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
