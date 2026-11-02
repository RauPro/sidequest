"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, type SyntheticEvent } from "react";
import { createGameBridge } from "@/game/systems/bridge";
import { locations, type LocationId } from "@/game/world/locations";
import { BagCount } from "@/features/cart/BagCount";
import { GamePanel } from "./GamePanel";

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
  const [panel, setPanel] = useState<LocationId | "bag" | null>(null);
  const [slow, setSlow] = useState(false);
  const [opener, setOpener] = useState<HTMLElement | null>(null);

  useEffect(() => bridge.subscribe((e) => {
    if (e.type === "ready") setReady(true);
    if (e.type === "open") { setOpener(document.querySelector("[data-game-stage]")); setPanel(e.id); }
    if (e.type === "nearby") setNearby(e.id);
    if (e.type === "hover") setHover(e.id);
    if (e.type === "player-tile") setTile({ col: e.col, row: e.row });
  }), [bridge]);
  useEffect(() => { bridge.dispatch({ type: "input", enabled: panel === null }); }, [bridge, panel]);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 10000);
    return () => clearTimeout(t);
  }, []);

  const openPanel = (id: LocationId | "bag") => (e: SyntheticEvent) => {
    setOpener(e.currentTarget as HTMLElement);
    setPanel(id);
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
    <header className="hud-top">
      <span className="hud-brand">SIDEQUEST</span>
      <span className="hud-title" aria-hidden="true">Willow Market</span>
      <button className="hud-bag" aria-haspopup="dialog" aria-expanded={panel === "bag"} onClick={openPanel("bag")}><BagCount /></button>
      <Link className="hud-shop" href="/shop">Shop view</Link>
    </header>
    {!ready && <p className="game-loader" role="status">Loading village…{slow && <> The map is taking a while. Use the places menu or <Link href="/shop">open Shop view</Link>.</>}</p>}
    <nav className="places-menu" aria-label="Village locations">{locations.map((l) =>
      <button
        key={l.id}
        aria-pressed={panel === l.id}
        aria-haspopup="dialog"
        aria-expanded={panel === l.id}
        aria-describedby={`place-purpose-${l.id}`}
        onClick={openPanel(l.id)}
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
    {panel && <GamePanel panel={panel} onClose={() => setPanel(null)} opener={opener} />}
  </main>;
}
