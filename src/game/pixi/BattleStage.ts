import {
  AnimatedSprite,
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  Texture,
} from "pixi.js";
import type { Race, StatusMap } from "../engine/types";
import jddIdleUrl from "../../../assets/game/jdd_idle_sheet.png";
import stageBgAct1Url from "../../../assets/game/stage_bg_act1.png";
import stageBgAct2Url from "../../../assets/game/stage_bg_act2.png";
import stageBgAct3Url from "../../../assets/game/stage_bg_act3.png";

const characterTextureModules = import.meta.glob(
  "../../../assets/game/characters/*.png",
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>;
const characterMotionModules = import.meta.glob(
  "../../../assets/game/character-motion/*.png",
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>;
const enemyTextureModules = import.meta.glob(
  "../../../assets/game/enemy-motion/*.png",
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>;

function indexTextureModules(modules: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(modules).map(([path, url]) => {
      const name = path.match(/\/([^/]+)\.png$/)?.[1];
      if (!name) throw new Error(`Invalid combat texture path: ${path}`);
      return [name, url];
    }),
  );
}

const CHARACTER_TEXTURE_URL = indexTextureModules(characterTextureModules);
const CHARACTER_MOTION_URL = indexTextureModules(characterMotionModules);
const ENEMY_TEXTURE_URL = indexTextureModules(enemyTextureModules);

const STAGE_BG_BY_ACT: Record<number, string> = {
  1: stageBgAct1Url,
  2: stageBgAct2Url,
  3: stageBgAct3Url,
};

const STAGE_W = 1280;
const STAGE_H = 720;
const PLAYER_FOOT_Y = 556;

interface MotionGridConfig {
  url: string;
  cols: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
  contentHeight: number;
  bottomMargin: number;
  targetHeight: number;
}

interface PlayerMotionConfig extends MotionGridConfig {
  attack?: MotionGridConfig;
  idleFrameCount?: number;
}

type EnemyAttackStyle = "ranged" | "melee";

interface EnemyMotionConfig extends MotionGridConfig {
  visualContentHeight: number;
  attackStyle: EnemyAttackStyle;
  projectileColor: number;
  projectileCore: number;
}

interface EnemyActor {
  sprite: AnimatedSprite;
  idleFrames: Texture[];
  attackFrames: Texture[];
  hitFrame: Texture;
  base: { x: number; y: number };
  scale: number;
  visualHeight: number;
  bottomMargin: number;
  ranged: boolean;
  projectileColor: number;
  projectileCore: number;
  attacking: boolean;
  dying: boolean;
  poseRun: number;
  bob: number;
}

// JDD's approved idle render is the player/enemy scale reference. Character
// cutouts were exported with different occupied alpha heights, so scaling from
// the nominal 900px safe area made several players 40–60% too large.
const PLAYER_VISUAL_HEIGHT = 208.38;
const PLAYER_IDLE_CONTENT_HEIGHT: Record<string, number> = {
  bright: 859,
  fivehundred: 871,
  jji: 859,
  sample: 809,
  soulkey: 864,
};

const LEGACY_JDD_MOTION: PlayerMotionConfig = {
  url: jddIdleUrl,
  cols: 5,
  rows: 5,
  frameWidth: 192,
  frameHeight: 292,
  contentHeight: 151,
  bottomMargin: 74,
  targetHeight: PLAYER_VISUAL_HEIGHT,
  idleFrameCount: 1,
  attack: {
    url: CHARACTER_MOTION_URL.jdd,
    cols: 5,
    rows: 5,
    frameWidth: 320,
    frameHeight: 320,
    contentHeight: 210,
    bottomMargin: 28,
    targetHeight: PLAYER_VISUAL_HEIGHT,
  },
};

function playerMotion(texture: string): PlayerMotionConfig {
  if (texture === "jdd") return LEGACY_JDD_MOTION;
  const url = CHARACTER_TEXTURE_URL[texture];
  if (!url) throw new Error(`Missing player combat texture: ${texture}`);
  const attackUrl = CHARACTER_MOTION_URL[texture];
  if (!attackUrl) throw new Error(`Missing player attack motion: ${texture}`);
  const attackContentHeight =
    texture === "sun" ? 195 : texture === "fivehundred" ? 200 : 210;
  return {
    url,
    cols: 1,
    rows: 1,
    frameWidth: 1024,
    frameHeight: 1024,
    contentHeight: PLAYER_IDLE_CONTENT_HEIGHT[texture] ?? 900,
    bottomMargin: 48,
    targetHeight: PLAYER_VISUAL_HEIGHT,
    attack: {
      url: attackUrl,
      cols: 5,
      rows: 5,
      frameWidth: 320,
      frameHeight: 320,
      contentHeight: attackContentHeight,
      bottomMargin:
        texture === "fivehundred" || texture === "tyson" ? 36 : 28,
      targetHeight: PLAYER_VISUAL_HEIGHT,
    },
  };
}

function enemyMotion(
  id: string,
  config: Omit<EnemyMotionConfig, "url">,
): EnemyMotionConfig {
  const url = ENEMY_TEXTURE_URL[id];
  if (!url) throw new Error(`Missing enemy combat texture: ${id}`);
  return { ...config, url };
}

const KEYPOSE_GRID = {
  cols: 2,
  rows: 3,
  frameWidth: 384,
  frameHeight: 480,
  contentHeight: 432,
  bottomMargin: 24,
} as const;

const WIDTH_NORMALIZED_KEYPOSE_GRID = {
  ...KEYPOSE_GRID,
  // Act 2 and Act 3 review sheets are width-normalized to a 336 px alpha span.
  // Using the 432 px vertical safe area made every enemy render ~22% too small.
  contentHeight: 336,
} as const;

const ENEMY_MOTION: Record<string, EnemyMotionConfig> = {
  sentinel_scout: enemyMotion("sentinel_scout", {
    cols: 3,
    rows: 2,
    frameWidth: 384,
    frameHeight: 480,
    contentHeight: 340,
    bottomMargin: 24,
    targetHeight: 210,
    visualContentHeight: 340,
    attackStyle: "ranged",
    projectileColor: 0x66e0ff,
    projectileCore: 0xd6f6ff,
  }),
  brood_queen: enemyMotion("brood_queen", {
    cols: 2,
    rows: 3,
    frameWidth: 640,
    frameHeight: 384,
    contentHeight: 300,
    bottomMargin: 24,
    targetHeight: 360,
    visualContentHeight: 300,
    attackStyle: "melee",
    projectileColor: 0xbaff4d,
    projectileCore: 0xf4ffd5,
  }),
  wasteland_gunner: enemyMotion("wasteland_gunner", {
    ...KEYPOSE_GRID,
    targetHeight: 220,
    visualContentHeight: 361,
    attackStyle: "ranged",
    projectileColor: 0xff8d3a,
    projectileCore: 0xffe0a8,
  }),
  acid_stalker: enemyMotion("acid_stalker", {
    ...KEYPOSE_GRID,
    frameWidth: 480,
    targetHeight: 220,
    visualContentHeight: 399,
    attackStyle: "ranged",
    projectileColor: 0xb9ff35,
    projectileCore: 0xf4ffb0,
  }),
  elite_sentinel: enemyMotion("elite_sentinel", {
    ...KEYPOSE_GRID,
    frameWidth: 480,
    targetHeight: 260,
    visualContentHeight: 367,
    attackStyle: "melee",
    projectileColor: 0x66e0ff,
    projectileCore: 0xd6f6ff,
  }),
  void_stalker: enemyMotion("void_stalker", {
    ...WIDTH_NORMALIZED_KEYPOSE_GRID,
    targetHeight: 220,
    visualContentHeight: 245,
    attackStyle: "melee",
    projectileColor: 0x72ecff,
    projectileCore: 0xf1d6ff,
  }),
  siege_marauder: enemyMotion("siege_marauder", {
    ...WIDTH_NORMALIZED_KEYPOSE_GRID,
    targetHeight: 230,
    visualContentHeight: 323,
    attackStyle: "ranged",
    projectileColor: 0xff8b36,
    projectileCore: 0xffddb0,
  }),
  chitin_brute: enemyMotion("chitin_brute", {
    ...WIDTH_NORMALIZED_KEYPOSE_GRID,
    targetHeight: 230,
    visualContentHeight: 233,
    attackStyle: "melee",
    projectileColor: 0xcaff32,
    projectileCore: 0xf0ffb1,
  }),
  resonance_warden: enemyMotion("resonance_warden", {
    ...WIDTH_NORMALIZED_KEYPOSE_GRID,
    targetHeight: 270,
    visualContentHeight: 298,
    attackStyle: "melee",
    projectileColor: 0x64eaff,
    projectileCore: 0xe3d4ff,
  }),
  abyssal_charger: enemyMotion("abyssal_charger", {
    ...WIDTH_NORMALIZED_KEYPOSE_GRID,
    targetHeight: 600,
    visualContentHeight: 192,
    attackStyle: "melee",
    projectileColor: 0xd64cff,
    projectileCore: 0xffc9ff,
  }),
  interceptor: enemyMotion("interceptor", {
    ...WIDTH_NORMALIZED_KEYPOSE_GRID,
    targetHeight: 230,
    visualContentHeight: 223,
    attackStyle: "ranged",
    projectileColor: 0x66e0ff,
    projectileCore: 0xd6f6ff,
  }),
  fire_support: enemyMotion("fire_support", {
    ...WIDTH_NORMALIZED_KEYPOSE_GRID,
    targetHeight: 360,
    visualContentHeight: 132,
    attackStyle: "ranged",
    projectileColor: 0xff8d3a,
    projectileCore: 0xffe0a8,
  }),
  abyssal_cluster: enemyMotion("abyssal_cluster", {
    ...WIDTH_NORMALIZED_KEYPOSE_GRID,
    targetHeight: 240,
    visualContentHeight: 279,
    attackStyle: "melee",
    projectileColor: 0xbaff4d,
    projectileCore: 0xf4ffd5,
  }),
  battleship_escort: enemyMotion("battleship_escort", {
    ...WIDTH_NORMALIZED_KEYPOSE_GRID,
    targetHeight: 420,
    visualContentHeight: 124,
    attackStyle: "ranged",
    projectileColor: 0x75eaff,
    projectileCore: 0xe3faff,
  }),
  interstellar_battleship: enemyMotion("interstellar_battleship", {
    ...WIDTH_NORMALIZED_KEYPOSE_GRID,
    targetHeight: 650,
    visualContentHeight: 132,
    attackStyle: "ranged",
    projectileColor: 0xff6838,
    projectileCore: 0xffe5bd,
  }),
};

function tween(durationMs: number, onUpdate: (t: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      onUpdate(t);
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function sliceGrid(base: Texture, config: MotionGridConfig): Texture[] {
  const frames: Texture[] = [];
  for (let i = 0; i < config.cols * config.rows; i++) {
    const sx = (i % config.cols) * config.frameWidth;
    const sy = Math.floor(i / config.cols) * config.frameHeight;
    frames.push(
      new Texture({
        source: base.source,
        frame: new Rectangle(sx, sy, config.frameWidth, config.frameHeight),
      }),
    );
  }
  return frames;
}

const IDLE_SPEED = 0.32;
const ATTACK_SPEED = 0.7;
const ENEMY_IDLE_SPEED = 0.025;
const ENEMY_ATTACK_SPEED = 0.1;

type CombatantSide = "player" | "enemy";
type ImpactTier = "light" | "medium" | "heavy";

interface ImpactProfile {
  tier: ImpactTier;
  hitStopMs: number;
  shakeIntensity: number;
  shakeDurationMs: number;
  knockbackPx: number;
  burstScale: number;
  damageFontSize: number;
  damageColor: number;
  damageRisePx: number;
  damageLifetimeMs: number;
  flashMs: number;
}

function impactProfile(amount: number): ImpactProfile {
  const damage = Math.max(0, amount);
  if (damage >= 15) {
    return {
      tier: "heavy",
      hitStopMs: 95,
      shakeIntensity: Math.min(26, 6 + damage),
      shakeDurationMs: 270,
      knockbackPx: 34,
      burstScale: 1.35,
      damageFontSize: 68,
      damageColor: 0xff693d,
      damageRisePx: 82,
      damageLifetimeMs: 800,
      flashMs: 140,
    };
  }
  if (damage >= 8) {
    return {
      tier: "medium",
      hitStopMs: 70,
      shakeIntensity: Math.min(18, 5 + damage * 0.9),
      shakeDurationMs: 210,
      knockbackPx: 24,
      burstScale: 1.08,
      damageFontSize: 56,
      damageColor: 0xff9b3d,
      damageRisePx: 68,
      damageLifetimeMs: 700,
      flashMs: 110,
    };
  }
  return {
    tier: "light",
    hitStopMs: 45,
    shakeIntensity: Math.min(10, 4 + damage * 0.8),
    shakeDurationMs: 160,
    knockbackPx: 16,
    burstScale: 0.82,
    damageFontSize: 44,
    damageColor: 0xffe14d,
    damageRisePx: 54,
    damageLifetimeMs: 620,
    flashMs: 90,
  };
}

export class BattleStage {
  private app = new Application();
  private root = new Container();
  private player!: AnimatedSprite;
  private playerBase = { x: 360, y: PLAYER_FOOT_Y };
  private idleFrames: Texture[] = [];
  private attackFrames: Texture[] = [];
  private playerScale = 1;
  private playerAttackScale = 1;
  private playerVisualHeight = PLAYER_VISUAL_HEIGHT;
  private playerBottomMargin = 48;
  private playerAttackBottomMargin = 28;
  private playerAttackImpactRatio = 0.3;
  private playerStatic = false;
  private playerRace: Race = "T";
  private enemies: EnemyActor[] = [];
  private shakeRun = 0;
  private knockbackRun: Record<string, number> = { player: 0 };
  private flashRun: Record<string, number> = { player: 0 };
  private playerStatuses: StatusMap = {};
  private enemyStatuses: StatusMap[] = [];

  async init(
    container: HTMLElement,
    opts: {
      playerTexture: string;
      playerRace: Race;
      enemyTexture?: string;
      enemyTextures?: string[];
      isBoss?: boolean;
      isBosses?: boolean[];
      act?: number;
    },
  ): Promise<void> {
    await this.app.init({
      width: STAGE_W,
      height: STAGE_H,
      backgroundAlpha: 0,
      antialias: true,
      resolution: 1,
      autoDensity: true,
    });
    container.appendChild(this.app.canvas);
    this.app.canvas.style.width = "100%";
    this.app.canvas.style.height = "100%";
    this.app.stage.addChild(this.root);

    const playerConfig = playerMotion(opts.playerTexture);
    const playerAttackConfig = playerConfig.attack;
    const enemyTextureIds =
      opts.enemyTextures && opts.enemyTextures.length > 0
        ? opts.enemyTextures
        : opts.enemyTexture
          ? [opts.enemyTexture]
          : [];
    const enemyConfigs = enemyTextureIds.map((id) => ENEMY_MOTION[id]);
    if (enemyConfigs.length === 0 || enemyConfigs.some((config) => !config)) {
      throw new Error(`Unknown enemy motion: ${enemyTextureIds.join(", ")}`);
    }
    const [idleTex, attackTex, bgTex, ...enemyTextures] = await Promise.all([
      Assets.load(playerConfig.url) as Promise<Texture>,
      Assets.load(playerAttackConfig?.url ?? playerConfig.url) as Promise<Texture>,
      Assets.load(STAGE_BG_BY_ACT[opts.act ?? 1] ?? stageBgAct1Url) as Promise<Texture>,
      ...enemyConfigs.map((config) => Assets.load(config.url) as Promise<Texture>),
    ]);
    const playerIdleFrames = sliceGrid(idleTex, playerConfig);
    this.idleFrames = playerIdleFrames.slice(
      0,
      playerConfig.idleFrameCount ?? playerIdleFrames.length,
    );
    this.attackFrames = playerAttackConfig
      ? sliceGrid(attackTex, playerAttackConfig)
      : [this.idleFrames[0]];
    this.playerStatic = !playerAttackConfig;
    this.playerRace = opts.playerRace;
    this.playerVisualHeight = playerConfig.targetHeight;
    this.playerBottomMargin = playerConfig.bottomMargin;
    this.playerScale = playerConfig.targetHeight / playerConfig.contentHeight;
    this.playerAttackScale = playerAttackConfig
      ? playerAttackConfig.targetHeight / playerAttackConfig.contentHeight
      : this.playerScale;
    this.playerAttackBottomMargin =
      playerAttackConfig?.bottomMargin ?? this.playerBottomMargin;
    this.playerAttackImpactRatio = opts.playerRace === "T" ? 0.3 : 0.58;
    this.playerBase = {
      x: 360,
      y: PLAYER_FOOT_Y + this.playerBottomMargin * this.playerScale,
    };

    // background (behind everything)
    const bg = new Sprite(bgTex);
    bg.anchor.set(0, 0);
    bg.setSize(STAGE_W, STAGE_H);
    this.root.addChild(bg);

    // player (animated)
    this.shadow(this.playerBase.x, PLAYER_FOOT_Y, this.playerVisualHeight);
    this.player = new AnimatedSprite(this.idleFrames);
    this.player.anchor.set(0.5, 1);
    this.player.scale.set(this.playerScale);
    this.player.x = this.playerBase.x;
    this.player.y = this.playerBase.y;
    this.player.animationSpeed = IDLE_SPEED;
    this.player.play();
    this.root.addChild(this.player);

    const isBosses =
      opts.isBosses && opts.isBosses.length === enemyConfigs.length
        ? opts.isBosses
        : enemyConfigs.map((_, index) => index === 0 && Boolean(opts.isBoss));
    const enemyXs = enemyConfigs.length === 1 ? [935] : [830, 1030];
    const enemyYs = enemyConfigs.length === 1 ? [isBosses[0] ? 600 : 560] : [570, 545];
    this.enemies = enemyConfigs.map((enemyConfig, index) => {
      const frames = sliceGrid(enemyTextures[index], enemyConfig);
      const idleFrames = frames.length >= 6 ? frames.slice(0, 2) : [frames[0]];
      const attackFrames = frames.length >= 6 ? frames.slice(2, 5) : [frames[0]];
      const scale = enemyConfig.targetHeight / enemyConfig.contentHeight;
      const base = { x: enemyXs[index] ?? 935, y: enemyYs[index] ?? 560 };
      const actor: EnemyActor = {
        sprite: new AnimatedSprite(idleFrames),
        idleFrames,
        attackFrames,
        hitFrame: frames[5] ?? frames[0],
        base,
        scale,
        visualHeight: enemyConfig.visualContentHeight * scale,
        bottomMargin: enemyConfig.bottomMargin,
        ranged: enemyConfig.attackStyle === "ranged",
        projectileColor: enemyConfig.projectileColor,
        projectileCore: enemyConfig.projectileCore,
        attacking: false,
        dying: false,
        poseRun: 0,
        bob: index * Math.PI,
      };
      this.shadow(base.x, base.y, enemyConfig.targetHeight);
      actor.sprite.anchor.set(0.5, 1);
      actor.sprite.scale.set(scale);
      actor.sprite.x = base.x;
      actor.sprite.y = this.enemySpriteY(actor);
      actor.sprite.animationSpeed = ENEMY_IDLE_SPEED;
      actor.sprite.play();
      this.root.addChild(actor.sprite);
      this.knockbackRun[`enemy-${index}`] = 0;
      this.flashRun[`enemy-${index}`] = 0;
      return actor;
    });

    this.app.ticker.add(() => {
      for (const enemy of this.enemies) {
        enemy.bob += 0.05;
        if (!enemy.dying) {
          enemy.sprite.y = this.enemySpriteY(enemy) + Math.sin(enemy.bob) * 4;
        }
      }
    });

    (window as unknown as Record<string, unknown>).__stmzStage = this;
  }

  pause(): void {
    this.app.ticker.stop();
  }
  resume(): void {
    this.app.ticker.start();
  }

  syncStatuses(playerStatuses: StatusMap, enemiesStatuses: StatusMap[]): void {
    this.playerStatuses = playerStatuses;
    this.enemyStatuses = enemiesStatuses;

    if (this.player && !this.player.destroyed) {
      this.player.tint = this.getBaseTint("player", 0);
    }
    this.enemies.forEach((enemy, i) => {
      if (enemy.sprite && !enemy.sprite.destroyed) {
        enemy.sprite.tint = this.getBaseTint("enemy", i);
      }
    });
  }

  private getBaseTint(side: CombatantSide, enemyIndex = 0): number {
    const statuses = side === "player" ? this.playerStatuses : this.enemyStatuses[enemyIndex] ?? {};
    if (statuses.stun) return 0xaaaaaa;
    if (statuses.poison) return 0x88ff88;
    if (statuses.regen) return 0x55ffaa;
    if (statuses.vulnerable) return 0xffaaaa;
    if (statuses.weak) return 0xaaaaff;
    if (statuses.strength) return 0xffdd88;
    return 0xffffff;
  }

  private shadow(x: number, y: number, h: number): void {
    const g = new Graphics().ellipse(x, y + 6, h * 0.3, h * 0.085).fill({ color: 0x000000, alpha: 0.32 });
    this.root.addChild(g);
  }

  private enemyAt(index = 0): EnemyActor {
    const enemy = this.enemies[index];
    if (!enemy) throw new Error(`Unknown enemy actor: ${index}`);
    return enemy;
  }

  private runKey(side: CombatantSide, enemyIndex = 0): string {
    return side === "player" ? "player" : `enemy-${enemyIndex}`;
  }

  private spriteFor(side: CombatantSide, enemyIndex = 0): AnimatedSprite | Sprite {
    return side === "player" ? this.player : this.enemyAt(enemyIndex).sprite;
  }

  private enemySpriteY(enemy: EnemyActor): number {
    return enemy.base.y + enemy.bottomMargin * enemy.scale;
  }

  private setEnemyIdle(enemyIndex = 0): void {
    const enemy = this.enemyAt(enemyIndex);
    if (enemy.dying || enemy.sprite.destroyed) return;
    enemy.poseRun += 1;
    enemy.attacking = false;
    enemy.sprite.onComplete = undefined;
    enemy.sprite.textures = enemy.idleFrames;
    enemy.sprite.loop = true;
    enemy.sprite.animationSpeed = ENEMY_IDLE_SPEED;
    enemy.sprite.gotoAndPlay(0);
  }

  private startEnemyAttackAnimation(enemyIndex = 0): Promise<void> {
    const enemy = this.enemyAt(enemyIndex);
    enemy.poseRun += 1;
    enemy.attacking = true;
    enemy.sprite.textures = enemy.attackFrames;
    enemy.sprite.loop = false;
    enemy.sprite.animationSpeed = ENEMY_ATTACK_SPEED;
    if (enemy.attackFrames.length === 1) {
      enemy.sprite.gotoAndStop(0);
      return sleep(320);
    }
    const complete = new Promise<void>((resolve) => {
      enemy.sprite.onComplete = () => {
        enemy.sprite.onComplete = undefined;
        resolve();
      };
    });
    enemy.sprite.gotoAndPlay(0);
    return complete;
  }

  private showEnemyHit(durationMs: number, enemyIndex = 0): void {
    const enemy = this.enemyAt(enemyIndex);
    if (enemy.dying || enemy.attacking || enemy.sprite.destroyed) return;
    const run = ++enemy.poseRun;
    enemy.sprite.onComplete = undefined;
    enemy.sprite.textures = [enemy.hitFrame];
    enemy.sprite.loop = false;
    enemy.sprite.gotoAndStop(0);
    setTimeout(() => {
      if (enemy.poseRun === run && !enemy.dying) this.setEnemyIdle(enemyIndex);
    }, durationMs);
  }

  private flash(side: CombatantSide, durationMs: number, enemyIndex = 0): void {
    const sprite = this.spriteFor(side, enemyIndex);
    const key = this.runKey(side, enemyIndex);
    const run = ++this.flashRun[key];
    sprite.tint = 0xff6a6a;
    setTimeout(() => {
      if (this.flashRun[key] === run && !sprite.destroyed) sprite.tint = this.getBaseTint(side, enemyIndex);
    }, durationMs);
  }

  private async shake(intensity: number, durationMs: number): Promise<void> {
    const run = ++this.shakeRun;
    await tween(durationMs, (t) => {
      if (this.shakeRun !== run) return;
      const d = (1 - easeOut(t)) * intensity;
      this.root.x = (Math.random() - 0.5) * 2 * d;
      this.root.y = (Math.random() - 0.5) * 2 * d;
    });
    if (this.shakeRun === run) {
      this.root.x = 0;
      this.root.y = 0;
    }
  }

  private spawnDamage(
    x: number,
    y: number,
    amount: number,
    profile: ImpactProfile,
    hitIndex: number,
    hitCount: number,
  ): void {
    const blocked = amount <= 0;
    const big = amount >= 12;
    const text = new Text({
      text: blocked ? "BLOCK" : `-${amount}`,
      style: {
        fontFamily: "Black Han Sans, sans-serif",
        fontSize: blocked ? 38 : profile.damageFontSize,
        fill: blocked ? 0x9fe6ff : profile.damageColor,
        stroke: { color: blocked ? 0x123a59 : 0x2a1500, width: big ? 8 : 6 },
      },
    });
    text.anchor.set(0.5);
    text.x = x + (hitIndex - (hitCount - 1) / 2) * 30;
    text.y = y;
    text.rotation = (hitIndex - (hitCount - 1) / 2) * 0.045;
    this.root.addChild(text);
    void tween(profile.damageLifetimeMs, (t) => {
      const pop =
        t < 0.16
          ? 0.45 + (t / 0.16) * 0.9
          : 1.35 - easeOut((t - 0.16) / 0.84) * 0.35;
      text.scale.set(pop);
      text.y = y - profile.damageRisePx * easeOut(t);
      text.alpha = t < 0.78 ? 1 : 1 - (t - 0.78) / 0.22;
    }).then(() => text.destroy());
  }

  private impactBurst(x: number, y: number, color: number, profile: ImpactProfile): void {
    const fx = new Container();
    const rays = new Graphics();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6 + Math.random() * 0.35;
      const len = 28 + Math.random() * 16;
      rays.poly([
        0,
        0,
        Math.cos(a) * len,
        Math.sin(a) * len,
        Math.cos(a + 0.28) * len * 0.42,
        Math.sin(a + 0.28) * len * 0.42,
      ]);
    }
    rays.fill({ color, alpha: 0.95 });
    rays.circle(0, 0, 13).fill({ color: 0xffffff, alpha: 0.94 });

    const ring = new Graphics().circle(0, 0, 18).stroke({ color, width: 5, alpha: 0.9 });
    fx.addChild(rays, ring);

    for (let i = 0; i < 5; i++) {
      const spark = new Graphics().circle(0, 0, 3 + Math.random() * 2).fill({
        color: i % 2 === 0 ? 0xffffff : color,
        alpha: 0.95,
      });
      const angle = (Math.PI * 2 * i) / 5 + Math.random() * 0.4;
      spark.label = `${angle}`;
      fx.addChild(spark);
    }

    fx.x = x;
    fx.y = y;
    this.root.addChild(fx);
    void tween(profile.tier === "heavy" ? 240 : 190, (t) => {
      rays.scale.set((0.4 + easeOut(t) * 1.35) * profile.burstScale);
      rays.alpha = 1 - t;
      rays.rotation = t * 0.5;
      ring.scale.set(0.55 + easeOut(t) * 2.2 * profile.burstScale);
      ring.alpha = 1 - easeOut(t);
      for (let i = 2; i < fx.children.length; i++) {
        const spark = fx.children[i];
        const angle = Number(spark.label);
        const distance = easeOut(t) * 58 * profile.burstScale;
        spark.x = Math.cos(angle) * distance;
        spark.y = Math.sin(angle) * distance;
        spark.alpha = 1 - t;
      }
    }).then(() => fx.destroy({ children: true }));
  }

  private knockback(
    which: CombatantSide,
    dir: number,
    distance: number,
    enemyIndex = 0,
  ): void {
    const spr = this.spriteFor(which, enemyIndex);
    const base =
      which === "player" ? this.playerBase.x : this.enemyAt(enemyIndex).base.x;
    const key = this.runKey(which, enemyIndex);
    const start = spr.x;
    const run = ++this.knockbackRun[key];
    void (async () => {
      await tween(55, (t) => {
        if (this.knockbackRun[key] === run) {
          spr.x = start + (base + dir * distance - start) * easeOut(t);
        }
      });
      if (this.knockbackRun[key] !== run) return;
      const recoveryStart = spr.x;
      await tween(210, (t) => {
        if (this.knockbackRun[key] === run) {
          spr.x = recoveryStart + (base - recoveryStart) * easeOut(t);
        }
      });
      if (this.knockbackRun[key] === run) spr.x = base;
    })();
  }

  private spawnMuzzleFlash(): void {
    const flash = new Graphics()
      .poly([0, 0, 24, -12, 20, -4, 58, 0, 20, 5, 25, 13])
      .fill({ color: 0xffb52e, alpha: 0.96 })
      .poly([2, 0, 16, -7, 13, -2, 40, 0, 13, 3, 17, 8])
      .fill({ color: 0xfff2a3, alpha: 1 })
      .circle(4, 0, 7)
      .fill({ color: 0xffffff, alpha: 1 });
    flash.x = this.playerBase.x + Math.min(150, this.playerVisualHeight * 0.34);
    flash.y = PLAYER_FOOT_Y - this.playerVisualHeight * 0.42;
    flash.rotation = (Math.random() - 0.5) * 0.1;
    flash.scale.set(0.72);
    this.root.addChild(flash);

    void tween(120, (t) => {
      flash.alpha = 1 - t;
      flash.scale.set(0.72 + easeOut(t) * 0.58);
    }).then(() => flash.destroy());
  }

  private spawnPlayerAttackFlash(): void {
    if (this.playerRace === "T") {
      this.spawnMuzzleFlash();
      return;
    }
  }

  private spawnPlayerMeleeSlash(): void {
    const protoss = this.playerRace === "P";
    const color = protoss ? 0x45eaff : 0xd85cff;
    const core = protoss ? 0xffffff : 0xcaff48;
    const radius = protoss ? 92 : 80;
    const fx = new Graphics()
      .arc(0, 0, radius, -1.08, 1.08)
      .stroke({ color, width: protoss ? 19 : 16, alpha: 0.9 })
      .arc(0, 0, radius - 12, -1.02, 1.02)
      .stroke({ color: core, width: protoss ? 7 : 5, alpha: 1 })
      .circle(radius - 2, 0, protoss ? 6 : 4)
      .fill({ color: core, alpha: 1 });
    fx.x =
      this.player.x + this.playerVisualHeight * (protoss ? 0.34 : 0.27);
    fx.y =
      PLAYER_FOOT_Y - this.playerVisualHeight * (protoss ? 0.46 : 0.43);
    fx.rotation = -0.7;
    fx.scale.set(0.66);
    this.root.addChild(fx);
    void tween(180, (t) => {
      fx.alpha = 1 - t;
      fx.rotation = -0.7 + easeOut(t) * 1.35;
      fx.scale.set(0.66 + easeOut(t) * 0.62);
    }).then(() => fx.destroy());
  }

  private async impactTarget(
    target: CombatantSide,
    amount: number,
    hitIndex: number,
    hitCount: number,
    damageY?: number,
    enemyIndex = 0,
  ): Promise<void> {
    const profile = impactProfile(amount);
    const enemy = target === "enemy" ? this.enemyAt(enemyIndex) : null;
    const sprite = this.spriteFor(target, enemyIndex);
    const x = target === "player" ? this.playerBase.x : enemy!.base.x;
    const y =
      target === "player"
        ? PLAYER_FOOT_Y - 110
        : enemy!.base.y - enemy!.visualHeight * 0.5;
    const textY =
      damageY ??
      (target === "player"
        ? this.playerBase.y - this.player.height * 0.6
        : enemy!.base.y - enemy!.visualHeight * 0.6);
    const playerWasPlaying = this.player.playing;

    this.player.stop();
    if (target === "enemy") {
      this.showEnemyHit(Math.max(profile.flashMs, profile.hitStopMs) + 100, enemyIndex);
    }
    this.flash(target, profile.flashMs, enemyIndex);
    this.impactBurst(x, y, target === "player" ? 0xff9a6a : 0xfff2a3, profile);
    this.knockback(target, target === "player" ? -1 : 1, profile.knockbackPx, enemyIndex);
    void this.shake(profile.shakeIntensity, profile.shakeDurationMs);
    this.spawnDamage(x, textY, amount, profile, hitIndex, hitCount);
    await sleep(profile.hitStopMs);

    if (playerWasPlaying && !sprite.destroyed) this.player.play();
  }

  async playerAttack(hitAmounts: number[], enemyIndex = 0): Promise<void> {
    const hits = hitAmounts.length > 0 ? hitAmounts : [0];
    if (this.playerStatic) {
      await this.playerStaticAttack(hits, enemyIndex);
      return;
    }

    this.player.x = this.playerBase.x;
    this.player.y =
      PLAYER_FOOT_Y + this.playerAttackBottomMargin * this.playerAttackScale;
    this.player.scale.set(this.playerAttackScale);
    this.player.textures = this.attackFrames;
    this.player.loop = false;
    this.player.animationSpeed = ATTACK_SPEED;
    const attackMs = (this.attackFrames.length / (60 * ATTACK_SPEED)) * 1000;
    const animationComplete = new Promise<void>((resolve) => {
      this.player.onComplete = () => resolve();
    });
    this.player.gotoAndPlay(0);

    const impactSequence = (async () => {
      await sleep(attackMs * this.playerAttackImpactRatio);
      for (let i = 0; i < hits.length; i++) {
        await sleep(i === 0 ? attackMs * 0.04 : 42);
        await this.impactTarget("enemy", hits[i], i, hits.length, undefined, enemyIndex);
        if (i < hits.length - 1) await sleep(38);
      }
    })();

    await Promise.all([animationComplete, impactSequence]);
    this.player.onComplete = undefined;
    this.player.textures = this.idleFrames;
    this.player.loop = true;
    this.player.animationSpeed = IDLE_SPEED;
    this.player.scale.set(this.playerScale);
    this.player.y = this.playerBase.y;
    this.player.gotoAndPlay(0);
  }

  private async playerStaticAttack(hitAmounts: number[], enemyIndex: number): Promise<void> {
    if (this.playerRace !== "T") {
      await this.playerStaticMeleeAttack(hitAmounts, enemyIndex);
      return;
    }

    this.player.stop();
    const startX = this.playerBase.x;
    const startScale = this.playerScale;
    const reach = Math.min(48, this.playerVisualHeight * 0.13);
    await tween(120, (t) => {
      this.player.x = startX + reach * easeOut(t);
      this.player.scale.set(startScale * (1 + 0.04 * Math.sin(t * Math.PI)));
    });
    for (let i = 0; i < hitAmounts.length; i++) {
      this.spawnPlayerAttackFlash();
      await sleep(55);
      await this.impactTarget("enemy", hitAmounts[i], i, hitAmounts.length, undefined, enemyIndex);
      if (i < hitAmounts.length - 1) await sleep(50);
    }
    const recoveryX = this.player.x;
    await tween(180, (t) => {
      this.player.x = recoveryX + (startX - recoveryX) * easeOut(t);
      this.player.scale.set(startScale);
    });
    this.player.x = startX;
    this.player.scale.set(startScale);
    this.player.textures = this.idleFrames;
    this.player.loop = true;
    this.player.animationSpeed = IDLE_SPEED;
    this.player.gotoAndPlay(0);
  }

  private async playerStaticMeleeAttack(
    hitAmounts: number[],
    enemyIndex: number,
  ): Promise<void> {
    this.player.stop();
    const startX = this.playerBase.x;
    const startRotation = this.player.rotation;
    const reach = Math.min(100, this.playerVisualHeight * 0.3);

    await tween(90, (t) => {
      this.player.x = startX - 12 * easeOut(t);
      this.player.rotation = startRotation - 0.035 * easeOut(t);
    });
    await tween(125, (t) => {
      this.player.x = startX - 12 + (reach + 12) * easeOut(t);
      this.player.rotation =
        startRotation - 0.035 + 0.12 * Math.sin(t * Math.PI);
    });

    for (let i = 0; i < hitAmounts.length; i++) {
      this.spawnPlayerMeleeSlash();
      await sleep(45);
      await this.impactTarget("enemy", hitAmounts[i], i, hitAmounts.length, undefined, enemyIndex);
      if (i < hitAmounts.length - 1) await sleep(55);
    }

    const recoveryX = this.player.x;
    await tween(190, (t) => {
      this.player.x = recoveryX + (startX - recoveryX) * easeOut(t);
      this.player.rotation = startRotation;
    });
    this.player.x = startX;
    this.player.rotation = startRotation;
    this.player.textures = this.idleFrames;
    this.player.loop = true;
    this.player.animationSpeed = IDLE_SPEED;
    this.player.gotoAndPlay(0);
  }

  async enemyAttack(hitAmounts: number[], enemyIndex = 0): Promise<void> {
    const enemy = this.enemyAt(enemyIndex);
    const hits = hitAmounts.length > 0 ? hitAmounts : [0];
    const animation = this.startEnemyAttackAnimation(enemyIndex);
    const action = enemy.ranged
      ? this.enemyRangedAttack(hits, enemyIndex)
      : this.enemyMeleeAttack(hits, enemyIndex);
    await Promise.all([animation, action]);
    this.setEnemyIdle(enemyIndex);
  }

  private async enemyMeleeAttack(
    hitAmounts: number[],
    enemyIndex: number,
  ): Promise<void> {
    const enemy = this.enemyAt(enemyIndex);
    const reach = -90;
    await tween(140, (t) => (enemy.sprite.x = enemy.base.x + reach * easeOut(t)));
    for (let i = 0; i < hitAmounts.length; i++) {
      await this.impactTarget("player", hitAmounts[i], i, hitAmounts.length, undefined, enemyIndex);
      if (i < hitAmounts.length - 1) await sleep(65);
    }
    await tween(220, (t) => (enemy.sprite.x = enemy.base.x + reach * (1 - easeOut(t))));
    enemy.sprite.x = enemy.base.x;
  }

  private async enemyRangedAttack(
    hitAmounts: number[],
    enemyIndex: number,
  ): Promise<void> {
    const enemy = this.enemyAt(enemyIndex);
    // charge pulse
    await tween(180, (t) =>
      enemy.sprite.scale.set(
        enemy.scale * (1 + 0.07 * Math.sin(t * Math.PI)),
      ),
    );
    enemy.sprite.scale.set(enemy.scale);
    for (let i = 0; i < hitAmounts.length; i++) {
      // projectile travels to player
      const orb = new Graphics()
        .circle(0, 0, 16)
        .fill({ color: enemy.projectileColor, alpha: 0.4 })
        .circle(0, 0, 8)
        .fill({ color: enemy.projectileCore, alpha: 1 });
      const sx = enemy.base.x - enemy.sprite.width * 0.35;
      const sy = enemy.base.y - enemy.visualHeight * 0.55;
      const tx = this.playerBase.x;
      const ty = PLAYER_FOOT_Y - 90;
      orb.x = sx;
      orb.y = sy;
      this.root.addChild(orb);
      await tween(240, (t) => {
        orb.x = sx + (tx - sx) * t;
        orb.y = sy + (ty - sy) * t;
      });
      orb.destroy();
      await this.impactTarget("player", hitAmounts[i], i, hitAmounts.length, ty, enemyIndex);
      if (i < hitAmounts.length - 1) await sleep(55);
    }
  }

  async enemyDeath(enemyIndex = 0): Promise<void> {
    const enemy = this.enemyAt(enemyIndex);
    enemy.dying = true;
    enemy.attacking = false;
    enemy.poseRun += 1;
    enemy.sprite.onComplete = undefined;
    enemy.sprite.stop();
    const startY = enemy.sprite.y;
    await tween(550, (t) => {
      enemy.sprite.alpha = 1 - t;
      enemy.sprite.scale.set(enemy.scale * (1 - 0.28 * easeOut(t)));
      enemy.sprite.y = startY + 26 * easeOut(t);
    });
  }

  async block(target: CombatantSide, amount: number, enemyIndex = 0): Promise<void> {
    const enemy = target === "enemy" ? this.enemyAt(enemyIndex) : null;
    const sprite = this.spriteFor(target, enemyIndex);
    const x = target === "player" ? this.playerBase.x + 36 : enemy!.base.x;
    const y =
      target === "player"
        ? PLAYER_FOOT_Y - 95
        : enemy!.base.y - enemy!.visualHeight * 0.48;
    const shieldScale = Math.min(1.25, 0.9 + amount * 0.015);
    const pts: number[] = [];
    const r =
      target === "player"
        ? 64
        : Math.max(54, Math.min(86, enemy!.visualHeight * 0.22));
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (Math.PI * 2 * i) / 6;
      pts.push(Math.cos(a) * r, Math.sin(a) * r * 1.3);
    }
    const fx = new Container();
    const shield = new Graphics().poly(pts).fill({ color: 0x7fd4ff, alpha: 0.14 });
    shield.poly(pts).stroke({ color: 0x9fe6ff, width: 5, alpha: 0.9 });
    const pulse = new Graphics().circle(0, 0, r * 0.7).stroke({
      color: 0xd7f5ff,
      width: 4,
      alpha: 0.8,
    });
    const label = new Text({
      text: `+${amount}`,
      style: {
        fontFamily: "Black Han Sans, sans-serif",
        fontSize: target === "player" ? 36 : 42,
        fill: 0xbcecff,
        stroke: { color: 0x123a59, width: 6 },
      },
    });
    label.anchor.set(0.5);
    fx.addChild(shield, pulse, label);
    fx.x = x;
    fx.y = y;
    this.root.addChild(fx);

    const key = this.runKey(target, enemyIndex);
    const tintRun = ++this.flashRun[key];
    sprite.tint = 0xcdeeff;
    await tween(440, (t) => {
      fx.alpha = t < 0.24 ? t / 0.24 : 1 - (t - 0.24) / 0.76;
      shield.scale.set((0.78 + easeOut(t) * 0.3) * shieldScale);
      pulse.scale.set(0.5 + easeOut(t) * 1.35);
      pulse.alpha = 1 - easeOut(t);
      label.y = -18 * easeOut(t);
      label.scale.set(0.7 + Math.sin(Math.min(1, t * 2) * Math.PI * 0.5) * 0.35);
    });
    fx.destroy({ children: true });
    if (this.flashRun[key] === tintRun && !sprite.destroyed) sprite.tint = this.getBaseTint(target, enemyIndex);
  }

  destroy(): void {
    this.shakeRun += 1;
    this.knockbackRun.player += 1;
    this.flashRun.player += 1;
    for (let index = 0; index < this.enemies.length; index++) {
      this.knockbackRun[`enemy-${index}`] += 1;
      this.flashRun[`enemy-${index}`] += 1;
    }
    this.app.destroy(true, { children: true, texture: false });
  }
}
