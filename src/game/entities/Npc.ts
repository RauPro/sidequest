import Phaser, { Scene } from "phaser";
import {
  createDuckState,
  createNpcState,
  stepDuck,
  stepNpc,
  type DuckState,
  type NpcFacing,
  type NpcState,
  type RandomSource,
} from "../systems/npc";
import type { DuckDefinition, NpcDefinition } from "../world/villageFx";

const directions: readonly NpcFacing[] = ["down", "left", "right", "up"];

function animation(scene: Scene, key: string, texture: string, row: number, start = 0, end = 3, frameRate = 8, repeat = -1) {
  if (scene.anims.exists(key)) return;
  scene.anims.create({
    key,
    frames: scene.anims.generateFrameNumbers(texture, {
      start: row * 4 + start,
      end: row * 4 + end,
    }),
    frameRate,
    repeat,
  });
}

export class Npc {
  readonly sprite: Phaser.GameObjects.Sprite;
  private state: NpcState;

  constructor(
    private readonly scene: Scene,
    private readonly definition: NpcDefinition,
    private readonly reducedMotion: boolean,
    private readonly rng: RandomSource = Math.random,
  ) {
    this.state = createNpcState(definition, rng);
    this.createAnimations();
    this.sprite = scene.add.sprite(this.state.x, this.state.y, definition.texture, 0)
      .setOrigin(0.5, 1);
    this.render();
  }

  private createAnimations() {
    if (this.definition.behavior === "pace") {
      animation(
        this.scene,
        `${this.definition.texture}-idle`,
        this.definition.texture,
        this.definition.idleRow,
        0,
        1,
        2,
      );
      animation(
        this.scene,
        `${this.definition.texture}-wave`,
        this.definition.texture,
        this.definition.idleRow,
        2,
        3,
        3,
      );
    }

    for (const direction of directions) {
      const row = (this.definition.walkRows as Partial<Record<NpcFacing, number>>)[direction];
      if (row === undefined) continue;
      animation(
        this.scene,
        `${this.definition.texture}-walk-${direction}`,
        this.definition.texture,
        row,
      );
    }

    if (this.definition.behavior === "pace") {
      animation(
        this.scene,
        `${this.definition.texture}-walk-left`,
        this.definition.texture,
        this.definition.walkRows.right,
      );
    }
  }

  update(delta: number) {
    if (!this.reducedMotion) this.state = stepNpc(this.state, delta, this.rng);
    this.render();
  }

  private render() {
    const { x, y, facing, walking } = this.state;
    this.sprite.setPosition(x, y).setDepth(y);

    if (this.reducedMotion) {
      const idleFrame = this.definition.behavior === "pace"
        ? this.definition.idleRow * 4
        : this.definition.walkRows.down * 4;
      this.sprite.stop().setFlipX(false).setFrame(idleFrame);
      return;
    }

    if (this.state.kind === "pace" && this.definition.behavior === "pace") {
      this.sprite.setFlipX(walking && facing === "left");
      if (walking) {
        this.sprite.play(`${this.definition.texture}-walk-${facing}`, true);
      } else if (this.state.gesture === "wave") {
        this.sprite.play(`${this.definition.texture}-wave`, true);
      } else {
        this.sprite.play(`${this.definition.texture}-idle`, true);
      }
      return;
    }

    this.sprite.setFlipX(false);
    if (walking) {
      this.sprite.play(`${this.definition.texture}-walk-${facing}`, true);
    } else {
      this.sprite.stop().setFrame(this.definition.walkRows.down * 4);
    }
  }
}

export class Duck {
  readonly sprite: Phaser.GameObjects.Sprite;
  private state: DuckState;
  private readonly animationKey: string;

  constructor(
    private readonly scene: Scene,
    definition: DuckDefinition,
    private readonly reducedMotion: boolean,
    private readonly rng: RandomSource = Math.random,
    spawn: readonly [number, number] = definition.spawns[0],
  ) {
    this.state = createDuckState(rng, spawn);
    this.animationKey = `${definition.texture}-bob`;
    if (!scene.anims.exists(this.animationKey)) {
      scene.anims.create({
        key: this.animationKey,
        frames: scene.anims.generateFrameNumbers(definition.texture, { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      });
    }
    this.sprite = scene.add.sprite(this.state.x, this.state.y, definition.texture, 0)
      .setOrigin(0.5, 0.75)
      .setDepth(-800);
    this.render();
  }

  update(delta: number) {
    if (!this.reducedMotion) this.state = stepDuck(this.state, delta, this.rng);
    this.render();
  }

  private render() {
    this.sprite.setPosition(this.state.x, this.state.y)
      .setDepth(-800)
      .setFlipX(this.state.facing === "right");
    if (this.reducedMotion) {
      this.sprite.stop().setFrame(0);
    } else {
      this.sprite.play(this.animationKey, true);
    }
  }
}
