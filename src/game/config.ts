import Phaser from "phaser";
import { WillowMarket } from "./scenes/WillowMarket";
import type { LocationHandler } from "./systems/interaction";

export function createGame(parent: HTMLElement, onLocation: LocationHandler) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 800,
    height: 500,
    backgroundColor: "#172d2d",
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [new WillowMarket(onLocation)],
    audio: { noAudio: true },
    banner: false,
  });
}
