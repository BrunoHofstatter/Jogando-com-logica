import type { LessonStep } from "./class3Lesson";

export type RotationCue = "horizontal" | "vertical";

/** Introduce dragging once; only reintroduce it when the bottom becomes relevant. */
export function rotationCueFor(step: LessonStep, practiced: boolean): RotationCue | null {
    if (step.configuration === 3 && step.kind === "expression") return "vertical";
    if (!practiced && ((step.configuration === 0 && step.kind === "faces") ||
        (step.configuration === 2 && step.kind === "expression"))) return "horizontal";
    return null;
}

export const CUE_PASS_MS = 4300;
export const CUE_GAP_MS = 4500;
export const CUE_DELAY_MS = 1000;
const ease = (value: number) => value * value * (3 - 2 * value);

/** The hand, tooltip, and cube use this one clock, including pauses and replay. */
export function rotationCueFrame(elapsed: number, reducedMotion: boolean) {
    const passes = 2;
    const elapsedAfterDelay = elapsed - CUE_DELAY_MS;
    const total = passes * CUE_PASS_MS + (passes - 1) * CUE_GAP_MS;
    const done = elapsedAfterDelay >= total;
    const local = elapsedAfterDelay % (CUE_PASS_MS + CUE_GAP_MS);
    if (elapsedAfterDelay < 0 || done || local >= CUE_PASS_MS) return { opacity: 0, travel: 0, done };
    const opacity = Math.min(1, local / 300, (CUE_PASS_MS - local) / 300);
    const travel = local < 500 ? 0 : local < 2200 ? ease((local - 500) / 1700)
        : local < 2800 ? 1 : local < 3900 ? 1 - ease((local - 2800) / 1100) : 0;
    return { opacity, travel: travel * (reducedMotion ? 0.4 : 1), done: false };
}
