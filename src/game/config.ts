import Phaser from "phaser";
import { WillowMarket } from "./scenes/WillowMarket";
import { WORLD_HEIGHT, WORLD_WIDTH } from "./world/villageMap";
import type { LocationHandler, SceneReadyHandler } from "./systems/interaction";

export function createGame(parent: HTMLElement, onLocation: LocationHandler, onReady: SceneReadyHandler) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    backgroundColor: "#101d17",
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [new WillowMarket(onLocation, onReady)],
    audio: { noAudio: true },
    banner: false,
  });
}
