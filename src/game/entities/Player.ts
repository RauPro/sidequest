import Phaser, { Scene } from "phaser";
import { stepMovement } from "../systems/movement";
import { TILE_SIZE, type WorldPoint } from "../world/villageMap";

type Facing = "down" | "up" | "left" | "right";
const facingRows: Readonly<Record<Facing, number>> = { down: 0, left: 1, right: 2, up: 3 };

export class Player {
  readonly sprite: Phaser.GameObjects.Sprite;
  pos: WorldPoint;
  path: WorldPoint[] = [];
  private facing: Facing = "down";

  constructor(scene: Scene, x: number, y: number) {
    this.pos = { x, y };
    this.sprite = scene.add.sprite(x, y, "player", 0).setOrigin(0.5, 1).setDepth(1);
  }

  get tile() {
    return { col: Math.floor(this.pos.x / TILE_SIZE), row: Math.floor((this.pos.y - 1) / TILE_SIZE) };
  }

  halt() {
    this.path = [];
    this.animate(false);
  }

  move(dir: { x: number; y: number }, dtMs: number) {
    if (dir.x || dir.y) {
      this.path = [];
      this.facing = dir.x < 0 ? "left" : dir.x > 0 ? "right" : dir.y < 0 ? "up" : "down";
      this.pos = stepMovement(this.pos, dir, dtMs);
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
      const nextPosition = stepMovement(this.pos, { x: dx, y: dy }, dtMs);
      if (nextPosition.x === this.pos.x && nextPosition.y === this.pos.y) {
        this.path = [];
        this.animate(false);
        return;
      }
      this.pos = nextPosition;
      this.animate(true);
      return;
    }
    this.animate(false);
  }

  private animate(walking: boolean) {
    if (walking) this.sprite.play(`walk-${this.facing}`, true);
    else {
      this.sprite.stop();
      this.sprite.setFrame(facingRows[this.facing] * 4);
    }
    this.sprite.setPosition(this.pos.x, this.pos.y).setDepth(this.pos.y);
  }
}
