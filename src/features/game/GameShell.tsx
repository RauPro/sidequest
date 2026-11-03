"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { cartCount } from "@/domain/cart";
import { createGameBridge } from "@/game/systems/bridge";
import { locations, type LocationId } from "@/game/world/locations";
import { useCart } from "@/features/cart/CartProvider";
import { EncounterHost } from "@/features/encounters/EncounterHost";
import { createEncounterState, emptyEncounter } from "@/features/encounters/engine";
import type { EncounterState } from "@/features/encounters/types";
import { GameHud } from "./GameHud";
import { QuestCard } from "./QuestCard";
import {
  updateQuestProgress,
  useQuestProgress,
} from "./quest";

const PhaserHost = dynamic(() => import("@/features/world/PhaserHost"), {
  ssr: false,
  loading: () => <p className="game-loader" role="status">Loading village…</p>,
});

export function GameShell() {
  const [bridge] = useState(createGameBridge);
  const [ready, setReady] = useState(false);
  const [tile, setTile] = useState<{ col: number; row: number } | null>(null);
  const [nearby, setNearby] = useState<LocationId | null>(null);
  const [hover, setHover] = useState<LocationId | null>(null);
  const [encounter, setEncounter] = useState<EncounterState>(emptyEncounter);
  const panel = encounter.location;
  const [slow, setSlow] = useState(false);
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const deepLinkHandled = useRef(false);
  const quest = useQuestProgress();
  const { cart } = useCart();

  useEffect(() => bridge.subscribe((e) => {
    if (e.type === "ready") {
      setReady(true);
      if (!deepLinkHandled.current) {
        deepLinkHandled.current = true;
        const params = new URLSearchParams(window.location.search);
        const visit = params.get("visit");
        if (visit) {
          const target = visit === "bag" ? "bag" : locations.find((location) => location.id === visit)?.id;
          if (target) {
            setOpener(document.querySelector("[data-game-stage]"));
            setEncounter(createEncounterState(target));
            if (target === "market") updateQuestProgress((current) => ({ ...current, market: true }));
          }
          window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.hash}`);
        }
      }
    }
    if (e.type === "open") {
      setOpener(document.querySelector("[data-game-stage]"));
      setEncounter(createEncounterState(e.id));
      if (e.id === "market") updateQuestProgress((current) => ({ ...current, market: true }));
    }
    if (e.type === "open-bag") {
      setOpener(document.querySelector("[data-game-stage]"));
      setEncounter(createEncounterState("bag"));
    }
    if (e.type === "nearby") setNearby(e.id);
    if (e.type === "hover") setHover(e.id);
    if (e.type === "player-tile") setTile({ col: e.col, row: e.row });
  }), [bridge]);
  useEffect(() => { bridge.dispatch({ type: "input", enabled: panel === null }); }, [bridge, panel]);
  useEffect(() => {
    if (cartCount(cart) > 0) updateQuestProgress((current) => ({ ...current, bag: true }));
  }, [cart]);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 10000);
    return () => clearTimeout(t);
  }, []);

  const openEncounter = (id: LocationId | "bag") => (e?: SyntheticEvent) => {
    if (e) setOpener(e.currentTarget as HTMLElement);
    else setOpener(document.querySelector("[data-game-stage]"));
    if (id === "market") updateQuestProgress((current) => ({ ...current, market: true }));
    setEncounter(createEncounterState(id));
  };
  const nearLoc = locations.find((l) => l.id === nearby);
  const hoverLoc = locations.find((l) => l.id === hover);
  const hint = nearLoc
    ? `Press E or tap to enter the ${nearLoc.name} — ${nearLoc.purpose}`
    : hoverLoc
      ? `${hoverLoc.name} — ${hoverLoc.purpose}`
      : "Move: arrow keys or tap a path · Interact: E or tap a place";

  return <main id="main" className="game-shell" data-testid="village-map" data-ready={ready ? "true" : undefined} data-player-tile={tile ? `${tile.col},${tile.row}` : undefined}>
    <h1 className="visually-hidden">Willow Market</h1>
    <PhaserHost bridge={bridge} />
    <GameHud title="Willow Market" view="village" onOpenBag={(event) => openEncounter("bag")(event)} bagOpen={panel === "bag"} />
    {!ready && <p className="game-loader" role="status">Loading village…{slow && <> The map is taking a while. Use the places menu or <Link href="/shop">open Shop view</Link>.</>}</p>}
    <QuestCard progress={quest} />
    <nav className="places-menu rpg-frame" aria-label="Village places" data-dialogue-open={panel ? "true" : "false"}>{locations.map((l) =>
      <button
        key={l.id}
        className="place-button"
        aria-pressed={panel === l.id}
        aria-haspopup="dialog"
        aria-expanded={panel === l.id}
        aria-describedby={`place-purpose-${l.id}`}
        onClick={openEncounter(l.id)}
        onFocus={() => bridge.dispatch({ type: "highlight", id: l.id })}
        onBlur={() => bridge.dispatch({ type: "highlight", id: null })}
        onMouseEnter={() => bridge.dispatch({ type: "highlight", id: l.id })}
        onMouseLeave={() => bridge.dispatch({ type: "highlight", id: null })}
      >
        <span className="location-name">{l.name}</span>
        <span className="location-purpose" id={`place-purpose-${l.id}`} aria-hidden="true">{l.purpose}</span>
      </button>)}
    </nav>
    <p className="hint-bar" aria-live="polite">{hint}</p>
    <aside className="rpg-frame controls-bar" aria-label="Game controls">
      <span className="controls-keyboard"><kbd>WASD/↑↓←→</kbd> Move <kbd>E</kbd> Interact <kbd>B</kbd> Bag <kbd>Esc</kbd> Close</span>
      <span className="controls-touch">Tap a path to move · Tap a place to visit</span>
    </aside>
    {panel && <EncounterHost state={encounter} onStateChange={setEncounter} onClose={() => setEncounter(emptyEncounter)} opener={opener} />}
  </main>;
}
