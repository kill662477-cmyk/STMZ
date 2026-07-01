/**
 * AudioManager — 전역 싱글턴 BGM 매니저
 *
 * - 막별 BGM을 루프 재생한다.
 * - 막이 바뀌면 크로스페이드로 자연스럽게 전환한다.
 * - 기본 볼륨 0.5 (원본 대비 절반).
 * - 사용자 볼륨 설정을 localStorage에 저장한다.
 * - 브라우저 자동재생 정책을 위해 첫 사용자 인터랙션 후 재생을 시작한다.
 */

import bgmAct1Url from "../../../assets/game/audio/bgm_act1.mp3";
import bgmAct2Url from "../../../assets/game/audio/bgm_act2.mp3";
import bgmAct3Url from "../../../assets/game/audio/bgm_act3.mp3";

const STORAGE_KEY = "slay-the-monstarz.bgm-volume";
const DEFAULT_VOLUME = 0.5;
const FADE_DURATION_MS = 1200;
const FADE_STEP_MS = 30;

/** 막 번호 → BGM URL 매핑 */
const BGM_BY_ACT: Record<number, string> = {
  1: bgmAct1Url,
  2: bgmAct2Url,
  3: bgmAct3Url,
};

/** 시작/캐릭터 선택/결과 화면에서도 1막 BGM을 사용한다. */
const MENU_ACT = 1;

class AudioManagerImpl {
  private current: HTMLAudioElement | null = null;
  private currentAct: number | null = null;
  private volume: number;
  private muted = false;
  private unlocked = false;
  private pendingAct: number | null = null;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.volume = this.loadVolume();
    // 브라우저 자동재생 정책 — 첫 인터랙션에서 잠금 해제
    if (typeof window !== "undefined") {
      const unlock = () => {
        this.unlocked = true;
        window.removeEventListener("click", unlock);
        window.removeEventListener("keydown", unlock);
        window.removeEventListener("touchstart", unlock);
        // 대기 중인 BGM이 있으면 재생
        if (this.pendingAct !== null) {
          this.playAct(this.pendingAct);
          this.pendingAct = null;
        }
      };
      window.addEventListener("click", unlock, { once: false });
      window.addEventListener("keydown", unlock, { once: false });
      window.addEventListener("touchstart", unlock, { once: false });
    }
  }

  /** 현재 설정 볼륨 (0~1) */
  getVolume(): number {
    return this.volume;
  }

  /** 음소거 상태 */
  isMuted(): boolean {
    return this.muted;
  }

  /** 볼륨 설정 (0~1). 현재 재생 중인 트랙에 즉시 반영. */
  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    this.saveVolume();
    if (this.current && !this.muted) {
      this.current.volume = this.volume;
    }
  }

  /** 음소거 토글 */
  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.current) {
      this.current.volume = this.muted ? 0 : this.volume;
    }
    return this.muted;
  }

  /** 특정 막의 BGM을 재생한다. 이미 같은 막이면 무시. */
  playAct(act: number): void {
    if (!this.unlocked) {
      this.pendingAct = act;
      return;
    }
    if (this.currentAct === act && this.current && !this.current.paused) {
      return;
    }
    const url = BGM_BY_ACT[act] ?? BGM_BY_ACT[1];
    if (!url) return;
    this.crossFadeTo(url, act);
  }

  /** 메뉴 화면 BGM (1막 BGM 재활용) */
  playMenu(): void {
    this.playAct(MENU_ACT);
  }

  /** 모든 재생 중지 */
  stop(): void {
    this.clearFade();
    if (this.current) {
      this.current.pause();
      this.current.src = "";
      this.current = null;
    }
    this.currentAct = null;
  }

  // ──────────────────── private ────────────────────

  private crossFadeTo(url: string, act: number): void {
    this.clearFade();
    const old = this.current;

    // 새 트랙 준비
    const next = new Audio(url);
    next.loop = true;
    next.volume = 0; // 페이드인 시작
    this.current = next;
    this.currentAct = act;

    const targetVol = this.muted ? 0 : this.volume;

    // 이전 트랙이 없으면 바로 재생
    if (!old || old.paused) {
      next.volume = targetVol;
      next.play().catch(() => { /* 자동재생 차단 무시 */ });
      return;
    }

    // 크로스페이드
    const steps = Math.max(1, Math.floor(FADE_DURATION_MS / FADE_STEP_MS));
    let step = 0;
    const oldStartVol = old.volume;

    next.play().catch(() => { /* 자동재생 차단 무시 */ });

    this.fadeTimer = setInterval(() => {
      step++;
      const progress = Math.min(1, step / steps);
      // 이전 트랙 페이드아웃
      old.volume = Math.max(0, oldStartVol * (1 - progress));
      // 새 트랙 페이드인
      next.volume = targetVol * progress;

      if (progress >= 1) {
        this.clearFade();
        old.pause();
        old.src = "";
      }
    }, FADE_STEP_MS);
  }

  private clearFade(): void {
    if (this.fadeTimer !== null) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  private loadVolume(): number {
    if (typeof window === "undefined") return DEFAULT_VOLUME;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed = parseFloat(raw);
        if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
          return parsed;
        }
      }
    } catch { /* localStorage 차단 환경 */ }
    return DEFAULT_VOLUME;
  }

  private saveVolume(): void {
    try {
      localStorage.setItem(STORAGE_KEY, String(this.volume));
    } catch { /* localStorage 차단 환경 */ }
  }
}

/** 전역 싱글턴 */
export const audioManager = new AudioManagerImpl();
