"use client";

import { useEffect, useRef } from "react";
import { createGame } from "@/game/config";
import { villageMapDescription } from "@/game/world/locations";
import type { LocationHandler, SceneReadyHandler } from "@/game/systems/interaction";

export default function PhaserHost({ onLocation, onReady }: { onLocation: LocationHandler; onReady: SceneReadyHandler }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    const game = createGame(host.current, onLocation, onReady);
    return () => { game.destroy(true); };
  }, [onLocation, onReady]);
  return <div ref={host} className="game-host" role="img" aria-label={villageMapDescription} />;
}
