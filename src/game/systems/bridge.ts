import type { LocationId } from "../world/villageMap";

// A semantic bridge: engine interactions never own or mutate the cart.
export type GameEvent =
  | { type: "ready" }
  | { type: "open"; id: LocationId }
  | { type: "nearby"; id: LocationId | null }
  | { type: "hover"; id: LocationId | null }
  | { type: "player-tile"; col: number; row: number };
export type GameCommand = { type: "input"; enabled: boolean } | { type: "highlight"; id: LocationId | null };
export type GameBridge = {
  emit(e: GameEvent): void;
  subscribe(l: (e: GameEvent) => void): () => void;
  dispatch(c: GameCommand): void;
  onCommand(l: (c: GameCommand) => void): () => void;
  readonly state: { inputEnabled: boolean; highlight: LocationId | null };
};

export function createGameBridge(): GameBridge {
  const listeners = new Set<(e: GameEvent) => void>();
  const commands = new Set<(c: GameCommand) => void>();
  const state = { inputEnabled: true, highlight: null as LocationId | null };
  return {
    emit(e) { for (const l of listeners) l(e); },
    subscribe(l) { listeners.add(l); return () => { listeners.delete(l); }; },
    dispatch(c) {
      if (c.type === "input") state.inputEnabled = c.enabled;
      if (c.type === "highlight") state.highlight = c.id;
      for (const l of commands) l(c);
    },
    onCommand(l) { commands.add(l); return () => { commands.delete(l); }; },
    get state() { return { inputEnabled: state.inputEnabled, highlight: state.highlight }; },
  };
}
