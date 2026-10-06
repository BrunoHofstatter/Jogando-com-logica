import { describe, expect, it } from "vitest";
import { BOX_SPEED, MAX_BOXES, needsImmediateSpawn, SPAWN_INTERVAL_MS, reviewBoxPosition, initialReviewState, reviewReducer, REVIEW_TARGETS, targetTotal, type ReviewState } from "./class2Review";
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
            state = reviewReducer(state, { type: "showReplacement", slot: state.pendingReplacement!.slot });
        }
        const slot = state.targets.findIndex(target => target?.size === 5);
        const target = state.targets[slot]!;
        state = { ...state, selected: 100, boxes: [{ id: 100, value: targetTotal(target), top: 20, left: 20 }] };
        state = reviewReducer(state, { type: "match", targetId: target.id });
        expect(state.targets[slot]).toBeNull();
        expect(state.pendingReplacement).toEqual({ slot, target: expect.objectContaining({ size: 6 }) });
        state = reviewReducer(state, { type: "showReplacement", slot });
        expect(state.targets[slot]?.size).toBe(6);
        expect(state.targets.some(target => target?.size === 5)).toBe(false);
    });

    it.each([false, true])("balances unselected card lifetimes and spawning (mobile: %s)", mobile => {
        let state = reviewReducer(initialReviewState(), { type: "start" });
        let elapsed = 0;
        for (let frame = 0; frame < 2400; frame++) {
            state = reviewReducer(state, { type: "tick", seconds: 0.05 });
            elapsed += 50;
            if (elapsed >= SPAWN_INTERVAL_MS) {
                state = reviewReducer(state, { type: "spawn", random: 0.2, position: 0.3 });
                elapsed -= SPAWN_INTERVAL_MS;
            }
            expect(state.boxes.length).toBeLessThanOrEqual(MAX_BOXES);
        }
        const before = reviewBoxPosition(state.boxes[0], mobile);
        const after = reviewBoxPosition(reviewReducer(state, { type: "tick", seconds: 0.05 }).boxes[0], mobile);
        expect((mobile ? after.left - before.left : after.top - before.top)).toBeCloseTo(BOX_SPEED * 0.05);
    });

    it("clears feedback without letting an older fade erase a newer message", () => {
        let state = reviewReducer(initialReviewState(), { type: "start" });
        state = { ...state, selected: 100, boxes: [{ id: 100, value: targetTotal(state.targets[0]!), top: 20, left: 20 }] };
        state = reviewReducer(state, { type: "match", targetId: 0 });
        const previousId = state.feedbackId;
        state = reviewReducer(state, { type: "showReplacement", slot: state.pendingReplacement!.slot });
        state = { ...state, selected: 101, boxes: [{ id: 101, value: targetTotal(state.targets[0]!), top: 20, left: 20 }] };
        state = reviewReducer(state, { type: "match", targetId: 5 });
        expect(reviewReducer(state, { type: "clearFeedback", id: previousId })).toBe(state);
        expect(reviewReducer(state, { type: "clearFeedback", id: state.feedbackId }).feedback).toBeNull();
    });
    it("does not spawn, move, or score while the introduction is open", () => {
        const state = initialReviewState();
        expect(reviewReducer(state, { type: "spawn", random: 0, position: 0 })).toBe(state);
        expect(reviewReducer(state, { type: "tick", seconds: 1 })).toBe(state);
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
            state = reviewReducer(state, { type: "showReplacement", slot: state.pendingReplacement!.slot });
        }
        expect(seen.size).toBe(10);
        expect(state.mistakes).toBe(0);
        expect(state.targets.every(target => target === null)).toBe(true);
    });
    it("keeps a matched slot empty until its delayed replacement is revealed", () => {
        let state = reviewReducer(initialReviewState(), { type: "start" });
        const target = state.targets[0]!;
        state = { ...state, selected: 100, boxes: [{ id: 100, value: targetTotal(target), top: 20, left: 20 }] };
        state = reviewReducer(state, { type: "match", targetId: target.id });

        expect(state.targets[0]).toBeNull();
        expect(state.pendingReplacement?.target?.id).toBe(5);
        expect(reviewReducer(state, { type: "showReplacement", slot: 1 })).toBe(state);

        state = reviewReducer(state, { type: "showReplacement", slot: 0 });
        expect(state.targets[0]?.id).toBe(5);
        expect(state.pendingReplacement).toBeNull();
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
        const tick = reviewReducer(state, { type: "tick", seconds: 0.02 });
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
        const spawned = reviewReducer(state, { type: "spawn", random: 0.99, position: 0.9 });
        expect(state.targets.some(target => target && targetTotal(target) === spawned.boxes[0].value)).toBe(true);
    });
    it("quickly replenishes a missing choice and maintains a correct answer plus a distractor", () => {
        let state: ReviewState = {
            ...reviewReducer(initialReviewState(), { type: "start" }),
            boxes: [{ id: 50, value: 7, top: 20, left: 20 }], nextBoxId: 51,
        };
        expect(needsImmediateSpawn(state)).toBe(true);
        state = reviewReducer(state, { type: "spawn", random: 0.9, position: 0.2 });
        expect(state.boxes).toHaveLength(2);
        expect(state.boxes.some(box => state.targets.some(target => target && targetTotal(target) === box.value))).toBe(true);
        expect(needsImmediateSpawn(state)).toBe(false);

        state = { ...state, boxes: state.boxes.filter(box => box.value !== 7) };
        expect(needsImmediateSpawn(state)).toBe(true);
        state = reviewReducer(state, { type: "spawn", random: 0.1, position: 0.1 });
        expect(state.boxes.some(box => !state.targets.some(target => target && targetTotal(target) === box.value))).toBe(true);
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

describe("review availability and input accessibility", () => {
    it("does not create a blank card between the ninth match and the final replacement", () => {
        let state = reviewReducer(initialReviewState(), { type: "start" });
        for (const slot of [0, 1, 3, 4, 2]) {
            const passes = slot === 2 ? 1 : 2;
            for (let pass = 0; pass < passes; pass++) {
                const target = state.targets[slot]!;
                state = { ...state, boxes: [{ id: 100, value: targetTotal(target), top: 30, left: 30 }], selected: 100 };
                state = reviewReducer(state, { type: "match", targetId: target.id });
                if (slot !== 2) state = reviewReducer(state, { type: "showReplacement", slot });
            }
        }
        expect(state.matches).toBe(9);
        expect(state.targets.every(target => target === null)).toBe(true);
        expect(needsImmediateSpawn(state)).toBe(false);
        expect(reviewReducer(state, { type: "spawn", random: 0.2, position: 0.4 })).toBe(state);
        state = reviewReducer(state, { type: "showReplacement", slot: 2 });
        expect(needsImmediateSpawn(state)).toBe(true);
        state = reviewReducer(state, { type: "spawn", random: 0.2, position: 0.4 });
        expect(state.boxes[0].value).toBe(18);
    });

    it("preserves progress and cross-lane position in both orientations, including a held card", () => {
        let state = reviewReducer(initialReviewState(), { type: "start" });
        state = reviewReducer(state, { type: "select", id: 0 });
        const held = state.boxes[0];
        for (const mobile of [true, false, true, false]) {
            state = reviewReducer(state, { type: "tick", seconds: 0.05 });
            const position = reviewBoxPosition(state.boxes[0], mobile);
            expect(mobile ? position.left : position.top).toBe(held.top);
            expect(mobile ? position.top : position.left).toBe(held.left);
        }
        expect(state.boxes[0]).toEqual(held);
    });

    it("brings an off-lane focused card into view without freezing or retaining it", () => {
        let state = reviewReducer(initialReviewState(), { type: "start" });
        state = reviewReducer(state, { type: "focus", id: 0 });
        expect(state.boxes[0].top).toBeGreaterThan(0);
        const held = state.boxes[0];
        state = reviewReducer(state, { type: "tick", seconds: 0.05 });
        expect(state.boxes[0].top).toBeGreaterThan(held.top);
        for (let frame = 0; frame < 600; frame++) state = reviewReducer(state, { type: "tick", seconds: 0.05 });
        expect(state.boxes.find(box => box.id === held.id)).toBeUndefined();
    });

    it("finishes all ten matches with stationary choices and no timed spawns", () => {
        let state = reviewReducer(initialReviewState(), { type: "start", stationary: true });
        for (let count = 0; count < 10; count++) {
            expect(reviewReducer(state, { type: "tick", seconds: 1 })).toBe(state);
            expect(reviewReducer(state, { type: "spawn", random: 0, position: 0 })).toBe(state);
            expect(needsImmediateSpawn(state)).toBe(false);
            expect(state.boxes.every(box => Number.isFinite(box.value))).toBe(true);
            expect(state.boxes.some(box => !state.targets.some(target => target && targetTotal(target) === box.value))).toBe(true);
            const box = state.boxes.find(box => state.targets.some(target => target && targetTotal(target) === box.value))!;
            const target = state.targets.find(target => target && targetTotal(target) === box.value)!;
            state = reviewReducer(state, { type: "select", id: box.id });
            state = reviewReducer(state, { type: "match", targetId: target.id });
            state = reviewReducer(state, { type: "showReplacement", slot: state.pendingReplacement!.slot });
        }
        expect(state.phase).toBe("complete");
        expect(state.mistakes).toBe(0);
    });

    it("keeps a selected number and progress when the motion preference changes", () => {
        let state = reviewReducer(initialReviewState(), { type: "start" });
        state = reviewReducer(state, { type: "select", id: 1 });
        for (const stationary of [true, false]) {
            state = reviewReducer(state, { type: "motion", stationary });
            expect(state.selected).toBe(1);
            expect(state.boxes.find(box => box.id === state.selected)?.value).toBe(12);
            expect(state.matches).toBe(0);
            expect(state.boxes.every(box => box.top > 0 && box.top < 100)).toBe(true);
        }
    });
});


it("keeps a wrong pairing separate from selection and expires only the current feedback", () => {
    let state = reviewReducer(initialReviewState(), { type: "start", stationary: true });
    const box = state.boxes.find(box => box.value === 7)!;
    state = reviewReducer(state, { type: "select", id: box.id });
    state = reviewReducer(state, { type: "match", targetId: 0 });
    expect(state.selected).toBeNull();
    expect(state.wrongPair).toEqual({ boxId: box.id, targetId: 0 });
    expect(reviewReducer(state, { type: "clearFeedback", id: state.feedbackId - 1 }).wrongPair).toEqual(state.wrongPair);
    expect(reviewReducer(state, { type: "clearFeedback", id: state.feedbackId }).wrongPair).toBeNull();
    expect(reviewReducer(state, { type: "select", id: box.id }).wrongPair).toBeNull();
});
