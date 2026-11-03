"use client";

import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";
import type { ResolvedNode } from "./types";

const speakers = {
  milo: "Milo · Merchant",
  oracle: "The Oracle · Seer",
  finn: "Finn · Camp guide",
  pip: "Pip · Postmaster",
  bag: "Your backpack",
} as const;

export function DialogueBox({
  node,
  children,
  onChoose,
}: {
  node: ResolvedNode;
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

  const speakerLabel = speakers[node.speaker];
  return (
    <section
      ref={dialogRef}
      className="rpg-frame dialogue-box"
      role="dialog"
      aria-modal="false"
      aria-labelledby="dialogue-speaker"
      tabIndex={-1}
    >
      {node.speaker !== "bag" && (
        <div className="dialogue-portrait">
          <Image
            src={`/game/portraits/${node.speaker}.webp`}
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
        <p className="dialogue-text">{node.text}</p>
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
