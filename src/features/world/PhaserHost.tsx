"use client";

import { useEffect, useRef } from "react";
import { createGame } from "@/game/config";
import type { GameBridge } from "@/game/systems/bridge";
import { villageMapDescription } from "@/game/world/locations";

export default function PhaserHost({ bridge }: { bridge: GameBridge }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    const game = createGame(host.current, bridge);
    return () => { game.destroy(true); };
  }, [bridge]);
  return <div
    ref={host}
    className="game-stage"
    data-game-stage
    tabIndex={0}
    role="application"
    aria-label={`${villageMapDescription} Use the arrow keys or WASD to walk and E to enter a place.`}
  />;
}
