"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { cartCount } from "@/domain/cart";
import { recommend } from "@/domain/recommendations";
import { createGameBridge } from "@/game/systems/bridge";
import { locations, type LocationId } from "@/game/world/locations";
import { useCart } from "@/features/cart/CartProvider";
import { EncounterHost } from "@/features/encounters/EncounterHost";
import { createEncounterState, emptyEncounter } from "@/features/encounters/engine";
import type { EncounterState } from "@/features/encounters/types";
import { GameHud } from "./GameHud";
import { QuestCard } from "./QuestCard";
import { readOracleReading } from "@/features/oracle/reading";
import { useIdentity } from "@/features/klaviyo/useIdentity";
import { trackEventOnce } from "@/features/klaviyo/track";
import {
  updateQuestProgress,
  useQuestProgress,
} from "./quest";

const PhaserHost = dynamic(() => import("@/features/world/PhaserHost"), {
  ssr: false,
  loading: () => <p className="game-loader" role="status">Loading village…</p>,
});

function newEncounter(location: LocationId | "bag"): EncounterState {
  const state = createEncounterState(location);
  if (location !== "oracle") return state;
  const reading = readOracleReading();
  if (!reading) return state;
  const result = recommend(reading.mood, reading.realm);
  return {
    ...state,
    nodeId: "oracle-reveal",
    deskMood: reading.mood,
    visualStyle: reading.realm,
    recommendedProductId: result.productId,
    alternateProductId: result.alternateId ?? null,
    productId: result.productId,
  };
}

export function GameShell() {
  const [bridge] = useState(createGameBridge);
  const [ready, setReady] = useState(false);
  const [tile, setTile] = useState<{ col: number; row: number } | null>(null);
  const [nearby, setNearby] = useState<LocationId | null>(null);
  const [hover, setHover] = useState<LocationId | null>(null);
  const [encounter, setEncounter] = useState<EncounterState>(emptyEncounter);
  const panel = encounter.location;
  const [slow, setSlow] = useState(false);
  const [hintOverride, setHintOverride] = useState<string | null>(null);
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const deepLinkHandled = useRef(false);
  const locationOpener = useRef<LocationId | null>(null);
  const quest = useQuestProgress();
  const { cart } = useCart();
  const identity = useIdentity();

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
            const opened = newEncounter(target);
            setEncounter(opened);
            if (target !== "bag") trackEventOnce(`location:${target}`, "Sidequest Location Visited", { location: target });
            if (opened.location === "oracle" && opened.nodeId === "oracle-reveal") {
              trackEventOnce(`product:oracle:${opened.productId}`, "Sidequest Product Viewed", {
                productId: opened.productId,
                discoverySource: "oracle",
              });
            }
            if (target === "market") updateQuestProgress((current) => ({ ...current, market: true }));
          }
          window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.hash}`);
        }
      }
    }
    if (e.type === "open") {
      setHintOverride(null);
      setOpener(document.querySelector("[data-game-stage]"));
      const opened = newEncounter(e.id);
      setEncounter(opened);
      trackEventOnce(`location:${e.id}`, "Sidequest Location Visited", { location: e.id });
      if (opened.location === "oracle" && opened.nodeId === "oracle-reveal") {
        trackEventOnce(`product:oracle:${opened.productId}`, "Sidequest Product Viewed", {
          productId: opened.productId,
          discoverySource: "oracle",
        });
      }
      if (e.id === "market") updateQuestProgress((current) => ({ ...current, market: true }));
    }
    if (e.type === "open-bag") {
      setHintOverride(null);
      setOpener(document.querySelector("[data-game-stage]"));
      setEncounter(newEncounter("bag"));
    }
    if (e.type === "nearby") { setNearby(e.id); if (e.id) setHintOverride(null); }
    if (e.type === "hover") { setHover(e.id); if (e.id) setHintOverride(null); }
    if (e.type === "player-tile") { setTile({ col: e.col, row: e.row }); setHintOverride(null); }
  }), [bridge]);
  useEffect(() => { bridge.dispatch({ type: "input", enabled: panel === null }); }, [bridge, panel]);
  useEffect(() => {
    if (panel !== null || !locationOpener.current) return;
    const location = locationOpener.current;
    locationOpener.current = null;
    document.querySelector<HTMLButtonElement>(`[data-location-id="${location}"]`)?.focus();
  }, [panel]);
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
    if (id !== "bag" && e) locationOpener.current = id;
    if (id !== "bag") trackEventOnce(`location:${id}`, "Sidequest Location Visited", { location: id });
    if (id === "market") updateQuestProgress((current) => ({ ...current, market: true }));
    const opened = newEncounter(id);
    setEncounter(opened);
    if (opened.location === "oracle" && opened.nodeId === "oracle-reveal") {
      trackEventOnce(`product:oracle:${opened.productId}`, "Sidequest Product Viewed", {
        productId: opened.productId,
        discoverySource: "oracle",
      });
    }
  };
  const nearLoc = locations.find((l) => l.id === nearby);
  const hoverLoc = locations.find((l) => l.id === hover);
  const touchInput = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const hint = panel ? "" : hintOverride ?? (nearLoc
    ? touchInput
      ? `Tap ${nearLoc.name} again to enter`
      : `Press E to visit the ${nearLoc.name}`
    : hoverLoc
      ? touchInput
        ? `Tap ${hoverLoc.name} to visit`
        : `Press E to visit the ${hoverLoc.name}`
      : "");

  const pointToLocation = (id: LocationId) => {
    const target = locations.find((location) => location.id === id);
    if (!target) return;
    bridge.dispatch({ type: "highlight", id });
    setHintOverride(`Follow the glow to the ${target.name}`);
  };

  return <main id="main" className="game-shell" data-testid="village-map" data-ready={ready ? "true" : undefined} data-player-tile={tile ? `${tile.col},${tile.row}` : undefined}>
    <h1 className="visually-hidden">Willow Market</h1>
    <PhaserHost bridge={bridge} />
    <GameHud title="Willow Market" view="village" onOpenBag={(event) => openEncounter("bag")(event)} bagOpen={panel === "bag"} />
    {!ready && <p className="game-loader" role="status">Loading village…{slow && <> The map is taking a while. Use the places menu or <Link href="/shop">open Shop view</Link>.</>}</p>}
    <QuestCard progress={quest} />
    {!panel && <nav className="places-menu rpg-frame" aria-label="Village places">{locations.map((l) =>
      <button
        key={l.id}
        className="place-button"
        data-location-id={l.id}
        aria-label={l.name}
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
        <span className="location-purpose visually-hidden" id={`place-purpose-${l.id}`}>{l.purpose}</span>
      </button>)}
    </nav>}
    <p className="hint-bar rpg-frame" aria-live="polite" aria-atomic="true" hidden={!hint}>{hint}</p>
    <aside className="rpg-frame controls-bar" aria-label="Game controls">
      <span className="controls-keyboard"><kbd>WASD/↑↓←→</kbd> Move <kbd>E</kbd> Interact <kbd>B</kbd> Bag <kbd>Esc</kbd> Close</span>
      <span className="controls-touch">Tap a path to move · Tap a place to visit</span>
    </aside>
    {panel && <EncounterHost state={encounter} onStateChange={setEncounter} onClose={() => setEncounter(emptyEncounter)} opener={opener} onGotoLocation={pointToLocation} identityEmail={identity.email} onEmailSubmitted={identity.remember} onForgetIdentity={identity.forget} />}
  </main>;
}
