import { describe, expect, it } from "vitest";
import { LESSON_STEPS } from "./class3Lesson";
import { CUE_DELAY_MS, CUE_GAP_MS, CUE_PASS_MS, rotationCueFor, rotationCueFrame } from "./rotationCue";

describe("rotation instruction", () => {
    it("only appears when rotation is introduced or bottom inspection matters", () => {
        expect(LESSON_STEPS.flatMap((step, index) => rotationCueFor(step, false) ? [index] : [])).toEqual([0, 8, 10]);
        expect(LESSON_STEPS.flatMap((step, index) => rotationCueFor(step, true) ? [index] : [])).toEqual([10]);
        expect(rotationCueFor(LESSON_STEPS[10], true)).toBe("vertical");
    });
    it("synchronizes the visible gesture, return, quiet gap, and limited replay", () => {
        expect(rotationCueFrame(500, false)).toEqual({opacity: 0, travel: 0, done: false});
        expect(rotationCueFrame(CUE_DELAY_MS + 2400, false)).toEqual({opacity: 1, travel: 1, done: false});
        const returning = rotationCueFrame(CUE_DELAY_MS + 3300, false);
        expect(returning.travel).toBeGreaterThan(0);
        expect(returning.travel).toBeLessThan(1);
        expect(rotationCueFrame(CUE_DELAY_MS + CUE_PASS_MS + 1000, false).opacity).toBe(0);
        expect(rotationCueFrame(CUE_DELAY_MS + CUE_PASS_MS + CUE_GAP_MS + 2400, false).travel).toBe(1);
        expect(rotationCueFrame(CUE_DELAY_MS + 2 * CUE_PASS_MS + CUE_GAP_MS, false).done).toBe(true);
    });
    it("keeps the essential instruction visible with gentler motion and the same replay under reduced motion", () => {
        expect(rotationCueFrame(CUE_DELAY_MS + 2400, true)).toEqual({opacity: 1, travel: 0.4, done: false});
        expect(rotationCueFrame(CUE_DELAY_MS + CUE_PASS_MS + CUE_GAP_MS + 2400, true)).toEqual({opacity: 1, travel: 0.4, done: false});
        expect(rotationCueFrame(CUE_DELAY_MS + 2 * CUE_PASS_MS + CUE_GAP_MS, true).done).toBe(true);
    });
});
