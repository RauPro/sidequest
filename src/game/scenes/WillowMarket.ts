import Phaser, { Scene } from "phaser";
import { ART_HEIGHT, ART_WIDTH } from "../art/canvas";
import { buildVillageArt } from "../art/manifest";
import { locations } from "../world/locations";
import { decorObstacles } from "../world/decor";
import { villageProps, visitorSpawn, WORLD_HEIGHT, WORLD_WIDTH, type LocationId, type TilePoint, type WorldRect } from "../world/villageMap";
import { Player } from "../entities/Player";
import { cameraCenter, cameraZoom } from "../systems/camera";
import { findPath, nearestReachable, tileWalkable } from "../systems/pathfinding";
import type { GameBridge } from "../systems/bridge";

export class WillowMarket extends Scene {
  private player!: Player;
  private obstacles: readonly WorldRect[] = [];
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private nearbyId: LocationId | null = null;
  private hoverId: LocationId | null = null;
  private lastTile = "";
  private rings: Partial<Record<LocationId, Phaser.GameObjects.Rectangle>> = {};
  private target?: Phaser.GameObjects.Image;
  private cleanup: (() => void)[] = [];
  private reducedMotion = false;

  constructor(private readonly bridge: GameBridge) { super("willow-market"); }

  private texture(key: string, width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) {
    if (this.textures.exists(key)) return;
    const texture = this.textures.createCanvas(key, width, height);
    if (!texture) throw new Error(`Could not create ${key} canvas texture`);
    const ctx = texture.getContext();
    ctx.imageSmoothingEnabled = false;
    paint(ctx);
    texture.refresh();
  }

  private ownsKeys() {
    const el = document.activeElement;
    return this.bridge.state.inputEnabled && (el === document.body || !!el?.closest("[data-game-stage]"));
  }

  private walkable = (c: number, r: number) => tileWalkable(c, r, this.obstacles);

  private updateRings() {
    for (const l of locations) {
      const active = this.hoverId === l.id || this.bridge.state.highlight === l.id;
      let ring = this.rings[l.id];
      if (active && !ring) {
        const { x, y, width, height } = l.hitArea;
        ring = this.add.rectangle(x + width / 2, y + height / 2, width - 2, height - 2)
          .setStrokeStyle(2, 0xe0b45c).setFillStyle().setDepth(1050);
        this.rings[l.id] = ring;
      }
      ring?.setVisible(active);
    }
  }

  private showTarget(x: number, y: number) {
    this.texture("target-ring", 12, 12, (ctx) => {
      ctx.strokeStyle = "#ffe89a";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 10, 10);
    });
    this.target ??= this.add.image(0, 0, "target-ring").setDepth(-500);
    this.target.setPosition(x, y).setVisible(true);
  }

  create() {
    if (!this.add) return; // destroyed by a StrictMode remount before boot finished
    this.obstacles = decorObstacles();
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const art = buildVillageArt();
    this.texture("village-ground", ART_WIDTH, ART_HEIGHT, art.ground);
    this.add.image(0, 0, "village-ground").setOrigin(0).setDepth(-1000);
    this.texture("village-foreground", ART_WIDTH, ART_HEIGHT, art.foreground);
    this.add.image(0, 0, "village-foreground").setOrigin(0).setDepth(1000);
    for (const sprite of art.sprites) this.texture(sprite.key, sprite.width, sprite.height, sprite.paint);
    for (const item of art.placements) {
      this.add.image(item.x, item.y, item.key).setOrigin(item.originX, item.originY).setDepth(item.depth ?? item.y);
    }
    this.player = new Player(this, visitorSpawn.x, visitorSpawn.y);
    this.texture("glow", 64, 64, (ctx) => {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(0.45, "rgba(255,255,255,0.28)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
    });
    for (const l of art.lights) {
      this.add.image(l.x, l.y, "glow").setBlendMode(Phaser.BlendModes.ADD).setTint(l.color).setAlpha(l.alpha).setDisplaySize(l.radius * 2, l.radius * 2).setDepth(1100);
    }
    this.texture("vignette", WORLD_WIDTH, WORLD_HEIGHT, (ctx) => {
      const g = ctx.createRadialGradient(320, 200, 120, 320, 200, 400);
      g.addColorStop(0, "rgba(5,10,14,0)");
      g.addColorStop(0.75, "rgba(5,10,14,0.28)");
      g.addColorStop(1, "rgba(5,10,14,0.6)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    });
    this.add.image(0, 0, "vignette").setOrigin(0).setDepth(1200);

    const onCanvas = (pointer: Phaser.Input.Pointer) => (pointer.event?.target ?? this.game.canvas) === this.game.canvas;
    for (const location of locations) {
      const { x, y, width, height } = location.hitArea;
      this.add.zone(x + width / 2, y + height / 2, width, height)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", (pointer: Phaser.Input.Pointer) => { if (onCanvas(pointer)) this.bridge.emit({ type: "open", id: location.id }); })
        .on("pointerover", (pointer: Phaser.Input.Pointer) => { if (!onCanvas(pointer)) return; this.hoverId = location.id; this.bridge.emit({ type: "hover", id: location.id }); this.updateRings(); })
        .on("pointerout", () => { this.hoverId = null; this.bridge.emit({ type: "hover", id: null }); this.updateRings(); });
    }
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer, over: unknown[]) => {
      if (!this.bridge.state.inputEnabled || over.length || !onCanvas(pointer)) return;
      const goalTile = { col: Math.floor(pointer.worldX / 16), row: Math.floor(pointer.worldY / 16) };
      const goal = nearestReachable(this.player.tile, goalTile, this.walkable);
      if (!goal) return;
      const path = findPath(this.player.tile, goal, this.walkable);
      if (!path) return;
      this.player.path = path.map((t: TilePoint) => ({ x: t.col * 16 + 8, y: t.row * 16 + 16 }));
      this.showTarget(goal.col * 16 + 8, goal.row * 16 + 8);
    });

    if (this.input.keyboard) {
      this.keys = this.input.keyboard.addKeys("UP,DOWN,LEFT,RIGHT,W,A,S,D", false) as Record<string, Phaser.Input.Keyboard.Key>;
      this.input.keyboard.disableGlobalCapture();
      const interact = () => { if (this.ownsKeys() && this.nearbyId) this.bridge.emit({ type: "open", id: this.nearbyId }); };
      this.input.keyboard.on("keydown-E", interact);
      this.input.keyboard.on("keydown-SPACE", interact);
      this.input.keyboard.on("keydown-ENTER", interact);
    }
    const blur = () => { if (this.ownsKeys()) return; this.input.keyboard?.resetKeys(); this.player.halt(); };
    this.events.once("shutdown", () => {
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", blur);
      for (const fn of this.cleanup) fn();
    });
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", blur);
    this.cleanup.push(this.bridge.onCommand((c) => {
      if (c.type === "highlight") this.updateRings();
      if (c.type === "input" && !c.enabled) { this.input.keyboard?.resetKeys(); this.player.halt(); }
    }));

    const cam = this.cameras.main;
    const snap = () => {
      const c = cameraCenter(this.scale.width, this.scale.height, cameraZoom(this.scale.width, this.scale.height), { x: this.player.pos.x, y: this.player.pos.y - 12 });
      cam.setZoom(cameraZoom(this.scale.width, this.scale.height)).centerOn(c.x, c.y);
    };
    snap();
    this.scale.on("resize", snap);
    this.cleanup.push(() => this.scale.off("resize", snap));
    this.bridge.emit({ type: "ready" });
  }

  update(_time: number, delta: number) {
    const cam = this.cameras.main;
    const zoom = cameraZoom(this.scale.width, this.scale.height);
    const target = cameraCenter(this.scale.width, this.scale.height, zoom, { x: this.player.pos.x, y: this.player.pos.y - 12 });
    cam.setZoom(zoom);
    if (this.reducedMotion || (Math.abs(cam.midPoint.x - target.x) < 0.5 && Math.abs(cam.midPoint.y - target.y) < 0.5)) cam.centerOn(target.x, target.y);
    else cam.centerOn(cam.midPoint.x + (target.x - cam.midPoint.x) * 0.15, cam.midPoint.y + (target.y - cam.midPoint.y) * 0.15);

    const dir = { x: 0, y: 0 };
    if (this.ownsKeys() && this.keys.LEFT) {
      dir.x = (this.keys.LEFT.isDown || this.keys.A.isDown ? -1 : 0) + (this.keys.RIGHT.isDown || this.keys.D.isDown ? 1 : 0);
      dir.y = (this.keys.UP.isDown || this.keys.W.isDown ? -1 : 0) + (this.keys.DOWN.isDown || this.keys.S.isDown ? 1 : 0);
    }
    this.player.move(dir, delta, this.obstacles);
    if (!this.player.path.length && this.target?.visible) this.target.setVisible(false);

    const tileKey = `${this.player.tile.col},${this.player.tile.row}`;
    if (tileKey !== this.lastTile) {
      this.lastTile = tileKey;
      this.bridge.emit({ type: "player-tile", ...this.player.tile });
    }
    const foot = this.player.pos;
    let nearby: LocationId | null = null;
    for (const l of locations) {
      const spots = [[l.entrance.col, l.entrance.row], ...villageProps.filter((p) => p.location === l.id).map((p) => [p.col, p.row] as const)];
      if (spots.some(([c, r]) => Math.hypot(c * 16 + 8 - foot.x, r * 16 + 8 - foot.y) <= 24)) { nearby = l.id; break; }
    }
    if (nearby !== this.nearbyId) {
      this.nearbyId = nearby;
      this.bridge.emit({ type: "nearby", id: nearby });
    }
  }
}
