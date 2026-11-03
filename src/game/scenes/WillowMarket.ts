import Phaser, { Scene } from "phaser";
import { Player } from "../entities/Player";
import type { GameBridge } from "../systems/bridge";
import { cameraCenter, cameraZoom } from "../systems/camera";
import { findPath, nearestReachable, tileWalkable } from "../systems/pathfinding";
import { locations } from "../world/locations";
import {
  TILE_SIZE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  visitorSpawn,
  type LocationId,
  type TilePoint,
} from "../world/villageMap";

export class WillowMarket extends Scene {
  private player!: Player;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private nearbyId: LocationId | null = null;
  private hoverId: LocationId | null = null;
  private lastTile = "";
  private rings: Partial<Record<LocationId, Phaser.GameObjects.Rectangle>> = {};
  private target?: Phaser.GameObjects.Arc;
  private cleanup: (() => void)[] = [];
  private reducedMotion = false;

  constructor(private readonly bridge: GameBridge) {
    super("willow-market");
  }

  private ownsKeys() {
    const el = document.activeElement;
    return this.bridge.state.inputEnabled && (el === document.body || !!el?.closest("[data-game-stage]"));
  }

  private walkable = (col: number, row: number) => tileWalkable(col, row);

  private createWalkAnimations() {
    const directions = [
      ["down", 0],
      ["left", 1],
      ["right", 2],
      ["up", 3],
    ] as const;

    for (const [direction, row] of directions) {
      const key = `walk-${direction}`;
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers("player", { start: row * 4, end: row * 4 + 3 }),
          frameRate: 8,
          repeat: -1,
        });
      }
    }
  }

  private updateRings(time = this.time.now) {
    for (const location of locations) {
      const active = this.hoverId === location.id || this.bridge.state.highlight === location.id;
      let ring = this.rings[location.id];
      if (active && !ring) {
        const { x, y, width, height } = location.hitArea;
        ring = this.add.rectangle(
          x + width / 2,
          y + height / 2,
          Math.max(1, width - 4),
          Math.max(1, height - 4),
          0xf1c95e,
          0,
        ).setStrokeStyle(3, 0xf1c95e).setDepth(2);
        this.rings[location.id] = ring;
      }
      ring?.setVisible(active);
      if (active) ring?.setAlpha(0.62 + Math.sin(time * 0.005) * 0.28);
    }
  }

  private showTarget(x: number, y: number) {
    this.target ??= this.add.circle(0, 0, 9, 0xffe89a, 0).setStrokeStyle(2, 0xffe89a).setDepth(2);
    this.target.setPosition(x, y).setVisible(true);
  }

  preload() {
    this.load.image("village-background", "/game/village/background.webp");
    this.load.spritesheet("player", "/game/sprites/player.png", { frameWidth: 128, frameHeight: 128 });
  }

  create() {
    if (!this.add) return; // destroyed by a StrictMode remount before boot finished
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.add.image(0, 0, "village-background").setOrigin(0, 0).setDepth(-1);
    this.createWalkAnimations();

    this.player = new Player(this, visitorSpawn.x, visitorSpawn.y);
    this.player.sprite.setScale(1);

    const onCanvas = (pointer: Phaser.Input.Pointer) =>
      (pointer.event?.target ?? this.game.canvas) === this.game.canvas;
    for (const location of locations) {
      const { x, y, width, height } = location.hitArea;
      this.add.zone(x + width / 2, y + height / 2, width, height)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
          if (onCanvas(pointer)) this.bridge.emit({ type: "open", id: location.id });
        })
        .on("pointerover", (pointer: Phaser.Input.Pointer) => {
          if (!onCanvas(pointer)) return;
          this.hoverId = location.id;
          this.bridge.emit({ type: "hover", id: location.id });
          this.updateRings();
        })
        .on("pointerout", () => {
          this.hoverId = null;
          this.bridge.emit({ type: "hover", id: null });
          this.updateRings();
        });
    }

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer, over: unknown[]) => {
      if (!this.bridge.state.inputEnabled || over.length || !onCanvas(pointer)) return;
      const goalTile: TilePoint = {
        col: Math.floor(pointer.worldX / TILE_SIZE),
        row: Math.floor(pointer.worldY / TILE_SIZE),
      };
      const goal = nearestReachable(this.player.tile, goalTile, this.walkable);
      if (!goal) return;
      const path = findPath(this.player.tile, goal, this.walkable);
      if (!path) return;
      this.player.path = path.map((tile) => ({
        x: tile.col * TILE_SIZE + TILE_SIZE / 2,
        y: tile.row * TILE_SIZE + TILE_SIZE / 2,
      }));
      this.showTarget(goal.col * TILE_SIZE + TILE_SIZE / 2, goal.row * TILE_SIZE + TILE_SIZE / 2);
    });

    if (this.input.keyboard) {
      this.keys = this.input.keyboard.addKeys("UP,DOWN,LEFT,RIGHT,W,A,S,D", false) as Record<
        string,
        Phaser.Input.Keyboard.Key
      >;
      this.input.keyboard.disableGlobalCapture();
      const interact = () => {
        if (this.ownsKeys() && this.nearbyId) this.bridge.emit({ type: "open", id: this.nearbyId });
      };
      const openBag = () => {
        if (this.ownsKeys()) this.bridge.emit({ type: "open-bag" });
      };
      this.input.keyboard.on("keydown-E", interact);
      this.input.keyboard.on("keydown-SPACE", interact);
      this.input.keyboard.on("keydown-ENTER", interact);
      this.input.keyboard.on("keydown-B", openBag);
    }

    const blur = () => {
      if (this.ownsKeys()) return;
      this.input.keyboard?.resetKeys();
      this.player.halt();
    };
    this.events.once("shutdown", () => {
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", blur);
      for (const cleanup of this.cleanup) cleanup();
    });
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", blur);
    this.cleanup.push(this.bridge.onCommand((command) => {
      if (command.type === "highlight") this.updateRings();
      if (command.type === "input" && !command.enabled) {
        this.input.keyboard?.resetKeys();
        this.player.halt();
      }
    }));

    const camera = this.cameras.main;
    const updateCamera = () => {
      camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      const zoom = cameraZoom(this.scale.width, this.scale.height);
      const center = cameraCenter(this.scale.width, this.scale.height, zoom, {
        x: this.player.pos.x,
        y: this.player.pos.y - 12,
      });
      camera.setZoom(zoom).centerOn(center.x, center.y);
    };
    updateCamera();
    this.scale.on("resize", updateCamera);
    this.cleanup.push(() => this.scale.off("resize", updateCamera));

    this.lastTile = `${this.player.tile.col},${this.player.tile.row}`;
    this.bridge.emit({ type: "player-tile", ...this.player.tile });
    this.bridge.emit({ type: "ready" });
  }

  update(time: number, delta: number) {
    const camera = this.cameras.main;
    const zoom = cameraZoom(this.scale.width, this.scale.height);
    const target = cameraCenter(this.scale.width, this.scale.height, zoom, {
      x: this.player.pos.x,
      y: this.player.pos.y - 12,
    });
    camera.setZoom(zoom);
    if (this.reducedMotion || (Math.abs(camera.midPoint.x - target.x) < 0.5 && Math.abs(camera.midPoint.y - target.y) < 0.5)) {
      camera.centerOn(target.x, target.y);
    } else {
      camera.centerOn(
        camera.midPoint.x + (target.x - camera.midPoint.x) * 0.15,
        camera.midPoint.y + (target.y - camera.midPoint.y) * 0.15,
      );
    }

    const dir = { x: 0, y: 0 };
    if (this.ownsKeys() && this.keys.LEFT) {
      dir.x = (this.keys.LEFT.isDown || this.keys.A.isDown ? -1 : 0) +
        (this.keys.RIGHT.isDown || this.keys.D.isDown ? 1 : 0);
      dir.y = (this.keys.UP.isDown || this.keys.W.isDown ? -1 : 0) +
        (this.keys.DOWN.isDown || this.keys.S.isDown ? 1 : 0);
    }
    this.player.move(dir, delta);
    if (!this.player.path.length && this.target?.visible) this.target.setVisible(false);
    this.updateRings(time);

    const tileKey = `${this.player.tile.col},${this.player.tile.row}`;
    if (tileKey !== this.lastTile) {
      this.lastTile = tileKey;
      this.bridge.emit({ type: "player-tile", ...this.player.tile });
    }
    let nearby: LocationId | null = null;
    for (const location of locations) {
      const entranceX = location.entrance.col * TILE_SIZE + TILE_SIZE / 2;
      const entranceY = location.entrance.row * TILE_SIZE + TILE_SIZE / 2;
      if (Math.hypot(entranceX - this.player.pos.x, entranceY - this.player.pos.y) <= 24) {
        nearby = location.id;
        break;
      }
    }
    if (nearby !== this.nearbyId) {
      this.nearbyId = nearby;
      this.bridge.emit({ type: "nearby", id: nearby });
    }
  }
}
