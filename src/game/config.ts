import Phaser from "phaser";
import { WillowMarket } from "./scenes/WillowMarket";
import type { GameBridge } from "./systems/bridge";

export function createGame(parent: HTMLElement, bridge: GameBridge) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: parent.clientWidth || 640,
    height: parent.clientHeight || 400,
    backgroundColor: "#0f1428",
    transparent: false,
    scale: { mode: Phaser.Scale.RESIZE },
    pixelArt: true,
    audio: { noAudio: true },
    banner: false,
    scene: new WillowMarket(bridge),
  });
}
