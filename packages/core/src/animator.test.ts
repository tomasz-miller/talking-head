import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { VisemeAnimator } from "./animator.js";
import type { VisemeTimeline } from "./types.js";

function createTestTimeline(duration = 2): VisemeTimeline {
  return {
    frames: [
      { viseme: "A", start: 0, end: 1 },
      { viseme: "E", start: 1, end: duration },
    ],
    duration,
  };
}

describe("VisemeAnimator", () => {
  let currentTime = 0;

  beforeEach(() => {
    currentTime = 0;
    vi.useFakeTimers();
    vi.spyOn(performance, "now").mockImplementation(() => currentTime);
    vi.stubGlobal("requestAnimationFrame", () => 0);
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("resumes from paused position", () => {
    const animator = new VisemeAnimator();
    animator.setTimeline(createTestTimeline(5));

    animator.play();
    currentTime = 2500;
    animator.pause();

    expect(animator.getState().elapsed).toBeCloseTo(2.5, 1);

    animator.play();
    currentTime = 3000;

    expect(animator.getState().elapsed).toBeCloseTo(3, 1);
  });

  it("preserves playback position when timeline is extended", () => {
    const animator = new VisemeAnimator();
    animator.setTimeline(createTestTimeline(2));

    animator.play();
    currentTime = 1500;

    animator.setTimeline(createTestTimeline(5), { preservePosition: true });
    currentTime = 2000;

    expect(animator.getState().elapsed).toBeCloseTo(2, 1);
    expect(animator.getState().currentViseme).toBe("E");
  });

  it("resets position when preservePosition is false", () => {
    const animator = new VisemeAnimator();
    animator.setTimeline(createTestTimeline());

    animator.play();
    currentTime = 1500;
    animator.setTimeline(createTestTimeline(4), { preservePosition: false });

    expect(animator.getState().elapsed).toBe(0);
    expect(animator.getState().currentViseme).toBe("A");
  });

  it("uses audio clock only while audio is playing", () => {
    const animator = new VisemeAnimator();
    animator.setTimeline(createTestTimeline(5));

    const audio = {
      currentTime: 0.4,
      paused: true,
      ended: false,
    };

    animator.setAudioSync({ audioElement: audio as HTMLAudioElement });
    animator.play();

    currentTime = 1000;
    expect(animator.getState().elapsed).toBeCloseTo(1, 1);

    audio.paused = false;
    expect(animator.getState().elapsed).toBe(0.4);

    animator.pause();
    expect(animator.getState().elapsed).toBe(0.4);
  });

  it("uses getCurrentTime callback only while playing", () => {
    const animator = new VisemeAnimator();
    animator.setTimeline(createTestTimeline(5));

    const getCurrentTime = vi.fn(() => 0.75);
    animator.setAudioSync({ getCurrentTime });
    animator.play();

    expect(animator.getState().elapsed).toBe(0.75);

    animator.pause();
    expect(animator.getState().elapsed).toBe(0.75);
    expect(getCurrentTime).toHaveBeenCalled();
  });
});
