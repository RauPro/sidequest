import Phaser, { Scene } from "phaser";
import { buildVillageArt } from "../art/manifest";
import { footRect, stepMovement } from "../systems/movement";
import type { WorldPoint, WorldRect } from "../world/villageMap";

export function ensurePlayerSheet(scene: Scene) {
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
  return player.key;
}

type Facing = "down" | "up" | "left" | "right";

export class Player {
  readonly sprite: Phaser.GameObjects.Sprite;
  pos: WorldPoint;
  path: WorldPoint[] = [];
  private facing: Facing = "down";

  constructor(scene: Scene, x: number, y: number) {
    const key = ensurePlayerSheet(scene);
    this.pos = { x, y };
    this.sprite = scene.add.sprite(x, y, key, "0").setOrigin(0.5, 1).setDepth(y);
    this.sprite.play("idle-down");
  }

  get tile() {
    return { col: Math.floor(this.pos.x / 16), row: Math.floor((this.pos.y - 1) / 16) };
  }

  halt() {
    this.path = [];
    this.animate(false);
  }

  move(dir: { x: number; y: number }, dtMs: number, obstacles: readonly WorldRect[]) {
    if (dir.x || dir.y) {
      this.path = [];
      this.facing = dir.x < 0 ? "left" : dir.x > 0 ? "right" : dir.y < 0 ? "up" : "down";
      this.pos = stepMovement(this.pos, dir, dtMs, obstacles);
      this.animate(true);
      return;
    }
    if (this.path.length) {
      const next = this.path[0];
      const dx = next.x - this.pos.x;
      const dy = next.y - this.pos.y;
      if (Math.hypot(dx, dy) <= 1.5) {
        this.pos = { ...next };
        this.path.shift();
        this.animate(this.path.length > 0);
        return;
      }
      this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : dy < 0 ? "up" : "down";
      this.pos = stepMovement(this.pos, { x: dx, y: dy }, dtMs, obstacles);
      if (isFootBlocked(this.pos, obstacles)) this.path = [];
      this.animate(true);
      return;
    }
    this.animate(false);
  }

  private animate(walking: boolean) {
    const dir = this.facing === "left" ? "right" : this.facing;
    this.sprite.setFlipX(this.facing === "left");
    this.sprite.play(`${walking ? "walk" : "idle"}-${dir}`, true);
    this.sprite.setPosition(this.pos.x, this.pos.y).setDepth(this.pos.y);
  }
}

function isFootBlocked(p: WorldPoint, obstacles: readonly WorldRect[]) {
  return obstacles.some((o) => {
    const f = footRect(p);
    return f.x < o.x + o.width && o.x < f.x + f.width && f.y < o.y + o.height && o.y < f.y + f.height;
  });
}
