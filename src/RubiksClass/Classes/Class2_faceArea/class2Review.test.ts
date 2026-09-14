import { describe, expect, it } from "vitest";
import { BOX_SPEED, MAX_BOXES, SPAWN_INTERVAL_MS, initialReviewState, reviewReducer, REVIEW_TARGETS, targetTotal, type ReviewState } from "./class2Review";
import { nearestAngle } from "../../Components/useCubeReturnRotation";

describe("Class 2 replacement-cube review", () => {
    it("uses the requested size mix and only unlocks the 6×6 after matching the 5×5", () => {
        const counts = Object.fromEntries([2, 3, 4, 5, 6].map(size => [size, REVIEW_TARGETS.filter(target => target.size === size).length]));
        expect(counts).toEqual({ 2: 2, 3: 3, 4: 3, 5: 1, 6: 1 });
        let state = reviewReducer(initialReviewState(), { type: "start" });
        while (state.targets.some(target => target && target.size !== 5)) {
            const target = state.targets.find(target => target && target.size !== 5)!;
            state = { ...state, selected: 100, boxes: [{ id: 100, value: targetTotal(target), top: 20, left: 20 }] };
            state = reviewReducer(state, { type: "match", targetId: target.id });
            expect(state.targets.some(target => target?.size === 6)).toBe(false);
        }
        const slot = state.targets.findIndex(target => target?.size === 5);
        const target = state.targets[slot]!;
        state = { ...state, selected: 100, boxes: [{ id: 100, value: targetTotal(target), top: 20, left: 20 }] };
        state = reviewReducer(state, { type: "match", targetId: target.id });
        expect(state.targets[slot]?.size).toBe(6);
        expect(state.targets.some(target => target?.size === 5)).toBe(false);
    });

    it.each([false, true])("balances unselected card lifetimes and spawning (mobile: %s)", mobile => {
        let state = reviewReducer(initialReviewState(), { type: "start", mobile });
        let elapsed = 0;
        for (let frame = 0; frame < 2400; frame++) {
            state = reviewReducer(state, { type: "tick", seconds: 0.05, mobile });
            elapsed += 50;
            if (elapsed >= SPAWN_INTERVAL_MS) {
                // Natural spacing should not need the safety cap to reject a spawn.
                expect(state.boxes.length).toBeLessThan(MAX_BOXES);
                state = reviewReducer(state, { type: "spawn", random: 0.2, position: 0.3, mobile });
                elapsed -= SPAWN_INTERVAL_MS;
            }
            expect(state.boxes.length).toBeLessThanOrEqual(MAX_BOXES);
        }
        const before = state.boxes[0];
        const after = reviewReducer(state, { type: "tick", seconds: 0.05, mobile }).boxes[0];
        expect((mobile ? after.left - before.left : after.top - before.top)).toBeCloseTo(BOX_SPEED * 0.05);
    });

    it("clears feedback without letting an older fade erase a newer message", () => {
        let state = reviewReducer(initialReviewState(), { type: "start" });
        state = reviewReducer(state, { type: "match", targetId: 0 });
        const previousId = state.feedbackId;
        state = reviewReducer(state, { type: "match", targetId: 0 });
        expect(reviewReducer(state, { type: "clearFeedback", id: previousId })).toBe(state);
        expect(reviewReducer(state, { type: "clearFeedback", id: state.feedbackId }).feedback).toBeNull();
    });
    it("does not spawn, move, or score while the introduction is open", () => {
        const state = initialReviewState();
        expect(reviewReducer(state, { type: "spawn", random: 0, position: 0, mobile: false })).toBe(state);
        expect(reviewReducer(state, { type: "tick", seconds: 1, mobile: true })).toBe(state);
        expect(reviewReducer(state, { type: "match", targetId: 0 })).toBe(state);
        const started = reviewReducer(state, { type: "start" });
        expect(started.boxes.some(box => box.value === targetTotal(started.targets[0]!))).toBe(true);
        expect(reviewReducer(started, { type: "start" })).toBe(started);
    });
    it("replaces matched targets and finishes once after exactly ten matches", () => {
        let state = reviewReducer(initialReviewState(), { type: "start" });
        const seen = new Set<number>();
        for (let count = 1; count <= 10; count++) {
            const target = state.targets.find(target => target !== null)!;
            seen.add(target.id);
            state = { ...state, boxes: [{ id: count, value: targetTotal(target), top: 20, left: 20 }], selected: count };
            state = reviewReducer(state, { type: "match", targetId: target.id });
            expect(state.matches).toBe(count);
            expect(state.phase).toBe(count === 10 ? "complete" : "playing");
            expect(reviewReducer(state, { type: "match", targetId: target.id })).toBe(state);
        }
        expect(seen.size).toBe(10);
        expect(state.mistakes).toBe(0);
        expect(state.targets.every(target => target === null)).toBe(true);
    });
    it("allows either target when two different groups have the same total", () => {
        for (const targetId of [20, 21]) {
            const state: ReviewState = { ...initialReviewState(), phase: "playing", selected: 1,
                targets: [{ id: 20, size: 4, rows: 3 }, { id: 21, size: 6, rows: 2 }],
                boxes: [{ id: 1, value: 12, top: 20, left: 20 }],
            };
            expect(reviewReducer(state, { type: "match", targetId }).matches).toBe(1);
        }
    });
    it("counts wrong matches without removing the target, and keeps selected cards still", () => {
        let state = reviewReducer(initialReviewState(), { type: "start" });
        state = reviewReducer(state, { type: "select", id: 2 });
        const selected = state.boxes[2];
        const tick = reviewReducer(state, { type: "tick", seconds: 0.02, mobile: false });
        expect(tick.boxes[2]).toEqual(selected);
        expect(tick.boxes[0].top).toBeGreaterThan(state.boxes[0].top);
        state = reviewReducer(tick, { type: "match", targetId: 0 });
        expect(state.mistakes).toBe(1);
        expect(state.matches).toBe(0);
        expect(state.targets[0]).toEqual(REVIEW_TARGETS[0]);
        expect(state.selected).toBeNull();
    });
    it("forces a usable number when none of the current targets is represented", () => {
        let state = reviewReducer(initialReviewState(), { type: "start" });
        state = { ...state, boxes: [] };
        const spawned = reviewReducer(state, { type: "spawn", random: 0.99, position: 0.9, mobile: true });
        expect(state.targets.some(target => target && targetTotal(target) === spawned.boxes[0].value)).toBe(true);
    });
});

describe("return rotation", () => {
    it("returns along the short path even after multiple turns", () => {
        for (const start of [-1080, -190, -10, 350, 1080]) {
            const end = nearestAngle(start, -32);
            expect(Math.abs(end - start)).toBeLessThanOrEqual(180);
            expect(((end + 32) % 360 + 360) % 360).toBe(0);
        }
    });
});

