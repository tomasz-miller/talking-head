import type {
  AnimatorListener,
  AnimatorState,
  AudioSyncOptions,
  SetTimelineOptions,
  Viseme,
  VisemeTimeline,
} from "./types.js";

export class VisemeAnimator {
  private timeline: VisemeTimeline | null = null;
  private rafId: number | null = null;
  private startTimestamp = 0;
  private pausedAt = 0;
  private playing = false;
  private speed = 1;
  private listeners = new Set<AnimatorListener>();
  private audioSync: AudioSyncOptions | null = null;
  private currentViseme: Viseme = "rest";

  setTimeline(timeline: VisemeTimeline, options: SetTimelineOptions = {}): void {
    const preservePosition = options.preservePosition ?? false;
    const elapsed = preservePosition ? this.getElapsed() : 0;
    this.timeline = timeline;
    this.pausedAt = Math.min(Math.max(0, elapsed), timeline.duration);

    if (this.playing) {
      this.startTimestamp = performance.now();
    }

    this.updateViseme(this.pausedAt);
    this.emit();
  }

  setSpeed(speed: number): void {
    this.speed = Math.max(0.1, speed);
  }

  setAudioSync(options: AudioSyncOptions | null): void {
    this.audioSync = options;
  }

  subscribe(listener: AnimatorListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  play(): void {
    if (!this.timeline || this.playing) {
      return;
    }

    this.playing = true;
    this.startTimestamp = performance.now();
    this.tick();
  }

  pause(): void {
    if (!this.playing) {
      return;
    }

    this.pausedAt = this.getElapsed();
    this.playing = false;
    this.stopRaf();
    this.emit();
  }

  stop(): void {
    this.playing = false;
    this.pausedAt = 0;
    this.startTimestamp = 0;
    this.stopRaf();
    this.currentViseme = "rest";
    this.emit();
  }

  seek(seconds: number): void {
    this.pausedAt = Math.max(0, seconds);

    if (this.timeline) {
      this.pausedAt = Math.min(this.pausedAt, this.timeline.duration);
    }

    if (this.playing) {
      this.startTimestamp = performance.now();
    }

    this.updateViseme(this.pausedAt);
    this.emit();
  }

  getState(): AnimatorState {
    return {
      currentViseme: this.currentViseme,
      elapsed: this.getElapsed(),
      isPlaying: this.playing,
    };
  }

  destroy(): void {
    this.stop();
    this.listeners.clear();
    this.timeline = null;
    this.audioSync = null;
  }

  private shouldUseAudioClock(): boolean {
    const sync = this.audioSync;
    if (!sync || !this.playing) {
      return false;
    }

    if (sync.audioElement) {
      const audio = sync.audioElement;
      return !audio.paused && !audio.ended;
    }

    return Boolean(sync.getCurrentTime);
  }

  private getElapsed(): number {
    if (this.shouldUseAudioClock()) {
      if (this.audioSync?.getCurrentTime) {
        return this.audioSync.getCurrentTime();
      }

      return this.audioSync?.audioElement?.currentTime ?? this.pausedAt;
    }

    if (!this.playing) {
      return this.pausedAt;
    }

    return this.pausedAt + ((performance.now() - this.startTimestamp) / 1000) * this.speed;
  }

  private tick = (): void => {
    const elapsed = this.getElapsed();
    this.updateViseme(elapsed);
    this.emit();

    if (!this.timeline) {
      this.stopRaf();
      return;
    }

    if (elapsed >= this.timeline.duration) {
      this.currentViseme = "rest";
      this.playing = false;
      this.pausedAt = this.timeline.duration;
      this.stopRaf();
      this.emit();
      return;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  private updateViseme(elapsed: number): void {
    if (!this.timeline || this.timeline.frames.length === 0) {
      this.currentViseme = "rest";
      return;
    }

    const frame = this.timeline.frames.find(
      (entry) => elapsed >= entry.start && elapsed < entry.end,
    );

    this.currentViseme = frame?.viseme ?? "rest";
  }

  private emit(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  private stopRaf(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
