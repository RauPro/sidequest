import Phaser, { Scene } from "phaser";
import { Duck, Npc } from "../entities/Npc";
import { Player } from "../entities/Player";
import type { GameBridge } from "../systems/bridge";
import { cameraCenter, cameraZoom } from "../systems/camera";
import { findPath, nearestReachable, tileWalkable } from "../systems/pathfinding";
import { locations } from "../world/locations";
import {
  ducks,
  embers,
  frameRate,
  fxBounds,
  lights,
  npcs,
  occluders,
  sleeper,
  sway,
  water,
  type FxLight,
} from "../world/villageFx";
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
  private ambientNpcs: Npc[] = [];
  private ambientDucks: Duck[] = [];
  private ambientLights: {
    definition: FxLight;
    image: Phaser.GameObjects.Image;
    alpha: number;
    scale: number;
    phase: number;
  }[] = [];

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
        ).setStrokeStyle(3, 0xf1c95e).setDepth(9000);
        this.rings[location.id] = ring;
      }
      ring?.setVisible(active);
      if (active) ring?.setAlpha(0.62 + Math.sin(time * 0.005) * 0.28);
    }
  }

  private showTarget(x: number, y: number) {
    this.target ??= this.add.circle(0, 0, 9, 0xffe89a, 0).setStrokeStyle(2, 0xffe89a).setDepth(9000);
    this.target.setPosition(x, y).setVisible(true);
  }

  preload() {
    this.load.image("village-background", "/game/village/background.webp");
    this.load.spritesheet("player", "/game/sprites/player.png", { frameWidth: 128, frameHeight: 128 });
    for (const region of water) {
      const bounds = fxBounds(region.polygon);
      this.load.spritesheet(`fx-water-${region.id}`, `/game/fx/water-${region.id}.png`, {
        frameWidth: bounds.width,
        frameHeight: bounds.height,
      });
    }
    for (const region of sway) {
      const bounds = fxBounds(region.polygon);
      this.load.spritesheet(`fx-sway-${region.id}`, `/game/fx/sway-${region.id}.png`, {
        frameWidth: bounds.width,
        frameHeight: bounds.height,
      });
    }
    for (const region of occluders) {
      this.load.image(`fx-occluder-${region.id}`, `/game/fx/occluder-${region.id}.png`);
    }
    for (const npc of npcs) {
      this.load.spritesheet(npc.texture, `/game/sprites/${npc.texture}.png`, {
        frameWidth: 128,
        frameHeight: 128,
      });
    }
    this.load.spritesheet(ducks.texture, `/game/sprites/${ducks.texture}.png`, {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  private createFxLayers() {
    for (const region of water) {
      const bounds = fxBounds(region.polygon);
      const texture = `fx-water-${region.id}`;
      const animation = `${texture}-flow`;
      if (!this.anims.exists(animation)) {
        this.anims.create({
          key: animation,
          frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 7 }),
          frameRate,
          repeat: -1,
        });
      }
      const image = this.add.sprite(bounds.x, bounds.y, texture, 0)
        .setOrigin(0, 0)
        .setDepth(-900);
      if (!this.reducedMotion) image.play(animation);
    }
    for (const region of sway) {
      const bounds = fxBounds(region.polygon);
      const texture = `fx-sway-${region.id}`;
      const animation = `${texture}-sway`;
      if (!this.anims.exists(animation)) {
        this.anims.create({
          key: animation,
          frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 7 }),
          frameRate: 4,
          repeat: -1,
        });
      }
      const image = this.add.sprite(bounds.x, bounds.y, texture, 0)
        .setOrigin(0, 0)
        .setDepth(-900);
      if (!this.reducedMotion) image.play(animation);
    }
    for (const region of occluders) {
      const bounds = fxBounds(region.polygon);
      this.add.image(bounds.x, bounds.y, `fx-occluder-${region.id}`)
        .setOrigin(0, 0)
        .setDepth(bounds.y + bounds.height);
    }
  }

  private createGlowTextures() {
    if (!this.textures.exists("fx-glow")) {
      const texture = this.textures.createCanvas("fx-glow", 64, 64);
      if (texture) {
        const gradient = texture.context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, "rgba(255,255,255,1)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        texture.context.fillStyle = gradient;
        texture.context.fillRect(0, 0, 64, 64);
        texture.refresh();
      }
    }
    if (!this.textures.exists("fx-ember")) {
      const texture = this.textures.createCanvas("fx-ember", 2, 2);
      if (texture) {
        texture.context.fillStyle = "#ff8a24";
        texture.context.fillRect(0, 0, 1, 2);
        texture.context.fillStyle = "#ffd65a";
        texture.context.fillRect(1, 0, 1, 2);
        texture.refresh();
      }
    }
  }

  private createAmbientLights() {
    const baseAlpha: Record<FxLight["kind"], number> = {
      lantern: 0.35,
      candle: 0.4,
      crystal: 0.45,
      fire: 0.55,
    };
    this.ambientLights = lights.map((definition) => {
      const scale = definition.radius * 2 / 64;
      const alpha = baseAlpha[definition.kind];
      const image = this.add.image(definition.x, definition.y, "fx-glow")
        .setTint(Number.parseInt(definition.color.slice(1), 16))
        .setScale(scale)
        .setAlpha(alpha)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(5000);
      const light = { definition, image, alpha, scale, phase: Math.random() * Math.PI * 2 };
      if (!this.reducedMotion && definition.kind === "lantern") {
        image.setAlpha(alpha - 0.08);
        const tween = this.tweens.add({
          targets: image,
          alpha: alpha + 0.08,
          duration: 1200 + Math.random() * 1200,
          delay: Math.random() * 1200,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        this.cleanup.push(() => tween.stop());
      } else if (!this.reducedMotion && definition.kind === "crystal") {
        image.setAlpha(0.3).setScale(scale * 0.9);
        const tween = this.tweens.add({
          targets: image,
          alpha: 0.6,
          scale: scale * 1.1,
          duration: 1300,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        this.cleanup.push(() => tween.stop());
      }
      return light;
    });
  }

  private createParticles() {
    if (this.reducedMotion) return;

    const emberEmitter = this.add.particles(embers.x, embers.y, "fx-ember", {
        frequency: 140,
        lifespan: { min: 1200, max: 2000 },
        speedX: { min: -7, max: 7 },
        speedY: { min: -40, max: -20 },
        scale: { start: 1, end: 0.3, ease: "Sine.easeIn" },
        alpha: { start: 0.9, end: 0, ease: "Sine.easeIn" },
        color: [0xff8a24, 0xffd65a],
        maxAliveParticles: 40,
        emitZone: {
          type: "random",
          source: {
            getRandomPoint: (point: Phaser.Types.Math.Vector2Like) => {
              point.x = Math.random() * embers.width - embers.width / 2;
              point.y = 0;
            },
          },
        },
      })
      .setDepth(6000)
      .setBlendMode(Phaser.BlendModes.ADD);
    const fireflyEmitter = this.add.particles(0, 0, "fx-glow", {
        frequency: 320,
        lifespan: { min: 4000, max: 7000 },
        speed: { min: 4, max: 10 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.1, end: 0.16, ease: "Sine.easeInOut" },
        alpha: {
          onUpdate: (_particle: Phaser.GameObjects.Particles.Particle, _key: string, t: number) =>
            Math.max(0, Math.min(1, t * 4, (1 - t) * 4)),
        },
        tint: 0xf6ff9a,
        maxAliveParticles: 40,
        emitZone: {
          type: "random",
          source: {
            getRandomPoint: (point: Phaser.Types.Math.Vector2Like) => {
              point.x = Math.random() * WORLD_WIDTH;
              point.y = Math.random() * WORLD_HEIGHT;
            },
          },
        },
      })
      .setDepth(6000)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.cleanup.push(() => {
      emberEmitter.destroy();
      fireflyEmitter.destroy();
    });
  }

  private createSleeperZs() {
    if (this.reducedMotion) return;
    const event = this.time.addEvent({
      delay: 1600,
      loop: true,
      callback: () => {
        const text = this.add.text(sleeper.x, sleeper.y - 22, "z", {
          fontFamily: "monospace",
          fontSize: "10px",
          fontStyle: "bold",
          color: "#e8f0ff",
        }).setOrigin(0.5, 1).setScale(0.8).setDepth(6000);
        this.tweens.add({
          targets: text,
          x: sleeper.x + 8,
          y: sleeper.y - 40,
          scale: 1.3,
          alpha: 0,
          duration: 1400,
          ease: "Sine.easeOut",
          onComplete: () => text.destroy(),
        });
      },
    });
    this.cleanup.push(() => event.remove());
  }

  create() {
    if (!this.add) return; // destroyed by a StrictMode remount before boot finished
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.add.image(0, 0, "village-background").setOrigin(0, 0).setDepth(-1000);
    this.createWalkAnimations();
    this.createFxLayers();

    this.ambientNpcs = npcs.map((definition) => new Npc(this, definition, this.reducedMotion));
    this.ambientDucks = ducks.spawns.map((spawn) =>
      new Duck(this, ducks, this.reducedMotion, Math.random, spawn),
    );
    this.createGlowTextures();
    this.createAmbientLights();
    this.createParticles();
    this.createSleeperZs();

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
      for (const cleanup of this.cleanup.splice(0)) cleanup();
      this.ambientNpcs = [];
      this.ambientDucks = [];
      this.ambientLights = [];
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
    for (const npc of this.ambientNpcs) npc.update(delta);
    for (const duck of this.ambientDucks) duck.update(delta);
    if (!this.reducedMotion) {
      for (const light of this.ambientLights) {
        if (light.definition.kind !== "candle" && light.definition.kind !== "fire") continue;
        const wave = (
          Math.sin(time * 0.012 + light.phase) +
          Math.sin(time * 0.023 + light.phase * 1.7) * 0.5 +
          Math.sin(time * 0.006 + light.phase * 0.4) * 0.25
        ) / 1.75;
        const alphaRange = light.definition.kind === "fire" ? 0.14 : 0.05;
        light.image.setAlpha(light.alpha + wave * alphaRange);
        if (light.definition.kind === "fire") {
          light.image.setScale(light.scale * (1 + wave * 0.08));
        }
      }
    }

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
