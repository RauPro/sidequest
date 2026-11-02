"use client";

import { useEffect, useRef } from "react";
import { createGame } from "@/game/config";
import type { LocationHandler } from "@/game/systems/interaction";

export default function PhaserHost({ onLocation }: { onLocation: LocationHandler }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    const game = createGame(host.current, onLocation);
    return () => { game.destroy(true); };
  }, [onLocation]);
  return <div ref={host} className="game-host" role="img" aria-label="Willow Market map. Use the location buttons below for keyboard navigation." />;
}
