import { describe, expect, it, vi } from "vitest";
import { createGameBridge } from "./bridge";

describe("game bridge", () => {
  it("emits to multiple listeners and supports unsubscribe", () => {
    const bridge = createGameBridge();
    const a = vi.fn(), b = vi.fn();
    const offA = bridge.subscribe(a);
    bridge.subscribe(b);
    bridge.emit({ type: "ready" });
    offA();
    bridge.emit({ type: "open", id: "camp" });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenLastCalledWith({ type: "open", id: "camp" });
  });
  it("updates state on dispatch before notifying command listeners", () => {
    const bridge = createGameBridge();
    const seen: boolean[] = [];
    bridge.onCommand(() => seen.push(bridge.state.inputEnabled));
    expect(bridge.state).toEqual({ inputEnabled: true, highlight: null });
    bridge.dispatch({ type: "input", enabled: false });
    expect(seen).toEqual([false]);
    bridge.dispatch({ type: "highlight", id: "oracle" });
    expect(bridge.state.highlight).toBe("oracle");
  });
});
