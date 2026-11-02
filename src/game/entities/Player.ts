import type { Scene } from "phaser";
import { buildVillageArt } from "../art/manifest";

// Static idle visitor for now; movement and interaction arrive with WORLD-03.
export function createPlayer(scene: Scene, x: number, y: number) {
  const { player } = buildVillageArt();
  if (!scene.textures.exists(player.key)) {
    const texture = scene.textures.createCanvas(player.key, player.width, player.height);
    if (!texture) throw new Error("Could not create player canvas texture");
    const ctx = texture.getContext();
    ctx.imageSmoothingEnabled = false;
    player.paint(ctx);
    texture.refresh();
    for (let i = 0; i < 9; i++) texture.add(`${i}`, 0, (i % 3) * 16, Math.floor(i / 3) * 24, 16, 24);
  }
  if (!scene.anims.exists("walk-down")) {
    for (const [dir, base] of [["down", 0], ["up", 3], ["right", 6]] as const) {
      scene.anims.create({ key: `idle-${dir}`, frames: [{ key: player.key, frame: `${base}` }] });
      scene.anims.create({
        key: `walk-${dir}`,
        frames: [`${base + 1}`, `${base}`, `${base + 2}`, `${base}`].map((frame) => ({ key: player.key, frame })),
        frameRate: 8,
        repeat: -1,
      });
    }
  }
  return scene.add.sprite(x, y, player.key, "0").setOrigin(0.5, 1).setDepth(y);
}
