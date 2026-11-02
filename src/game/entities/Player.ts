import type { Scene } from "phaser";

// Placeholder visitor marker. Animated movement is a later implementation step.
export function createPlayer(scene: Scene, x: number, y: number) {
  return scene.add.circle(x, y, 10, 0xf4e4bb).setStrokeStyle(3, 0x152b2b);
}
