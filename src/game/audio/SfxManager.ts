/**
 * SfxManager — Web Audio API 절차적 효과음 합성기
 *
 * 외부 오디오 파일 없이 Web Audio API의 OscillatorNode, GainNode,
 * BiquadFilterNode, noise buffer로 게임 효과음을 실시간 합성한다.
 *
 * 볼륨은 AudioManager의 마스터 볼륨과 독립된 SFX 볼륨을 곱한다.
 * 기본 SFX 볼륨 0.5 (BGM과 균형).
 */

const STORAGE_KEY = "slay-the-monstarz.sfx-volume";
const DEFAULT_SFX_VOLUME = 0.5;

class SfxManagerImpl {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number;
  private muted = false;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    this.volume = this.loadVolume();
  }

  // ─── public API ───

  getVolume(): number { return this.volume; }
  isMuted(): boolean { return this.muted; }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    this.saveVolume();
    this.updateGain();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.updateGain();
    return this.muted;
  }

  // ─── 전투 효과음 ───

  /** 플레이어 공격 히트 (경량) */
  hitLight(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    // 대역 통과 필터로 중저음역대 타격음 강조 (틱 -> 퍽)
    this.noiseHit(ctx, t, 0.1, 400, 0.5, "bandpass");
    this.tonePunch(ctx, t, 100, 30, 0.08, 0.5, "triangle");
  }

  /** 플레이어 공격 히트 (중량) */
  hitHeavy(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    // 저역 통과 필터로 묵직한 파열음 (매우 둔탁한 퍽)
    this.noiseHit(ctx, t, 0.2, 300, 0.8, "lowpass");
    this.tonePunch(ctx, t, 80, 20, 0.15, 0.8, "triangle");
    this.tonePunch(ctx, t + 0.02, 60, 20, 0.1, 0.5, "sine");
    this.metalClink(ctx, t, 200, 0.08, 0.3); // 둔탁한 파편
  }

  /** 플레이어 다단 공격 개별 히트 */
  hitMulti(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    // 다단 공격은 조금 빠르되, 그래도 너무 얇지 않게
    this.noiseHit(ctx, t, 0.06, 800, 0.4, "bandpass");
    this.tonePunch(ctx, t, 150, 60, 0.05, 0.4, "triangle");
  }

  /** 적 공격 히트 (플레이어가 맞을 때) */
  hitEnemy(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    // 강하고 무거운 피격음
    this.noiseHit(ctx, t, 0.15, 400, 0.6, "lowpass");
    this.tonePunch(ctx, t, 120, 30, 0.1, 0.7, "triangle");
    // 경고 느낌의 높은 톤
    this.tonePunch(ctx, t, 300, 100, 0.08, 0.3, "sine");
  }

  /** 방어도 획득 */
  block(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    // 메탈릭한 짧은 클링
    this.metalClink(ctx, t, 1200, 0.06, 0.2);
    this.metalClink(ctx, t + 0.03, 1800, 0.04, 0.12);
  }

  /** 적 사망 */
  enemyDeath(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    // 하강 톤 + 노이즈
    this.sweepDown(ctx, t, 400, 60, 0.3, 0.3);
    this.noiseHit(ctx, t, 0.25, 400, 0.2);
  }

  /** 보스 등장 (웅장한 타격음과 낮은 울림) */
  bossEntrance(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.noiseHit(ctx, t, 0.2, 800, 0.6);
    this.tonePunch(ctx, t, 60, 20, 0.4, 0.6);
    this.sweepDown(ctx, t, 100, 30, 0.8, 0.5);
  }

  /** 카드 사용 */
  cardPlay(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    // 짧은 스위시
    this.noiseHit(ctx, t, 0.03, 2000, 0.12);
    this.tonePunch(ctx, t, 600, 400, 0.03, 0.06);
  }

  /** 턴 종료 */
  endTurn(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    // 부드러운 2음 차임
    this.toneChime(ctx, t, 523, 0.08, 0.1); // C5
    this.toneChime(ctx, t + 0.06, 659, 0.1, 0.08); // E5
  }

  /** 포션 사용 */
  potionUse(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    // 버블 느낌
    this.toneChime(ctx, t, 880, 0.04, 0.1);
    this.toneChime(ctx, t + 0.04, 1100, 0.04, 0.08);
    this.toneChime(ctx, t + 0.08, 1320, 0.06, 0.1);
  }

  // ─── UI 효과음 ───

  /** 버튼 클릭 */
  uiClick(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.toneChime(ctx, t, 800, 0.02, 0.06);
  }

  /** 버튼 호버 */
  uiHover(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.toneChime(ctx, t, 1200, 0.015, 0.03);
  }

  /** 골드 획득 */
  goldGain(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.metalClink(ctx, t, 2400, 0.04, 0.1);
    this.metalClink(ctx, t + 0.06, 3000, 0.04, 0.08);
  }

  /** 유물 획득 */
  relicGain(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.toneChime(ctx, t, 523, 0.08, 0.12);
    this.toneChime(ctx, t + 0.1, 659, 0.08, 0.1);
    this.toneChime(ctx, t + 0.2, 784, 0.12, 0.14);
  }

  /** 승리 */
  victory(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    // 상승 팡파르
    this.toneChime(ctx, t, 523, 0.12, 0.14); // C5
    this.toneChime(ctx, t + 0.12, 659, 0.12, 0.12); // E5
    this.toneChime(ctx, t + 0.24, 784, 0.15, 0.16); // G5
    this.toneChime(ctx, t + 0.4, 1047, 0.25, 0.18); // C6
  }

  /** 패배 */
  defeat(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    // 하강 톤
    this.sweepDown(ctx, t, 300, 80, 0.5, 0.2);
    this.sweepDown(ctx, t + 0.15, 200, 50, 0.6, 0.15);
  }

  /** 회복 */
  heal(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.toneChime(ctx, t, 440, 0.06, 0.08);
    this.toneChime(ctx, t + 0.08, 554, 0.08, 0.1);
    this.toneChime(ctx, t + 0.16, 659, 0.1, 0.1);
  }

  /** 상점 구매 */
  purchase(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.metalClink(ctx, t, 1800, 0.03, 0.08);
    this.toneChime(ctx, t + 0.04, 700, 0.05, 0.06);
  }

  /** 카드 강화 */
  upgrade(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.sweepUp(ctx, t, 400, 1200, 0.2, 0.14);
    this.toneChime(ctx, t + 0.15, 1047, 0.1, 0.1);
  }

  /** 상태이상 적용 (디버프) */
  debuffApply(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.sweepDown(ctx, t, 500, 200, 0.1, 0.12);
  }

  /** 버프 적용 */
  buffApply(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.sweepUp(ctx, t, 300, 600, 0.08, 0.1);
  }

  /** 지도 노드 선택 */
  nodeSelect(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.toneChime(ctx, t, 600, 0.04, 0.08);
    this.toneChime(ctx, t + 0.05, 750, 0.04, 0.06);
  }

  // ─── 합성 프리미티브 ───

  private noiseHit(ctx: AudioContext, t: number, dur: number, freq: number, vol: number, type: BiquadFilterType = "highpass"): void {
    const buf = this.getNoiseBuffer(ctx);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(gain).connect(this.masterGain!);
    src.start(t);
    src.stop(t + dur + 0.01);
  }

  private tonePunch(ctx: AudioContext, t: number, freqStart: number, freqEnd: number, dur: number, vol: number, type: OscillatorType = "sine"): void {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  private metalClink(ctx: AudioContext, t: number, freq: number, dur: number, vol: number): void {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  private toneChime(ctx: AudioContext, t: number, freq: number, dur: number, vol: number): void {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.setValueAtTime(vol, t + dur * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  private sweepDown(ctx: AudioContext, t: number, freqStart: number, freqEnd: number, dur: number, vol: number): void {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freqStart, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + dur);
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(freqStart * 2, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(filter).connect(gain).connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  private sweepUp(ctx: AudioContext, t: number, freqStart: number, freqEnd: number, dur: number, vol: number): void {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freqStart, t);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.6, t);
    gain.gain.setValueAtTime(vol, t + dur * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  // ─── 내부 ───

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.updateGain();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private updateGain(): void {
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
    }
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const length = ctx.sampleRate; // 1초
    const buf = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buf;
    return buf;
  }

  private loadVolume(): number {
    if (typeof window === "undefined") return DEFAULT_SFX_VOLUME;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed = parseFloat(raw);
        if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) return parsed;
      }
    } catch {}
    return DEFAULT_SFX_VOLUME;
  }

  private saveVolume(): void {
    try { localStorage.setItem(STORAGE_KEY, String(this.volume)); } catch {}
  }
}

/** 전역 싱글턴 */
export const sfx = new SfxManagerImpl();
