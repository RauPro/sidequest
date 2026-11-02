import type { Scene } from "phaser";
import { ART_SCALE } from "../art/canvas";
import { paintCharacter, visitorLook } from "../art/characters";

const VISITOR_KEY = "visitor";

// Static visitor sprite; movement and animation arrive with WORLD-03.
export function createPlayer(scene: Scene, x: number, y: number) {
  if (!scene.textures.exists(VISITOR_KEY)) {
    const texture = scene.textures.createCanvas(VISITOR_KEY, 12, 16);
    if (!texture) throw new Error("Could not create visitor canvas texture");
    const ctx = texture.getContext();
    ctx.imageSmoothingEnabled = false;
    paintCharacter(ctx, 6, 15, visitorLook);
    texture.refresh();
  }
  return scene.add.image(x, y, VISITOR_KEY).setOrigin(0.5, 1).setScale(ART_SCALE);
}
