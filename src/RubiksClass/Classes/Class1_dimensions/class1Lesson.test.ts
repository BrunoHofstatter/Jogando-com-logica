import { describe, expect, it } from "vitest";
import { CLASS1_STEPS, class1Reducer, initialClass1 } from "./class1Lesson";
import { initialReview, reviewReducer, shuffleSizes } from "./class1Review";
import { lessonCheckpoints } from "../../Testing/registry";

describe("Class 1 discovery progression", () => {
    it("finishes from every checkpoint, with a child-paced notation reveal", () => {
        for (const checkpoint of lessonCheckpoints.class1) {
            let state = initialClass1(checkpoint.stepIndex);
            let steps = 0;
            while (state.phase !== "summary" && steps++ < 20) {
                if (state.phase === "reveal") {
                    expect(state.stepIndex).toBe(1);
                    expect(class1Reducer(state, { type: "guess", answer: "2" })).toBe(state);
                    state = class1Reducer(state, { type: "continue" });
                } else {
                    const index = state.stepIndex;
                    state = class1Reducer(state, { type: "guess", answer: CLASS1_STEPS[index].answer });
                    expect(state.phase).toBe("transition");
                    expect(class1Reducer(state, { type: "advance", stepIndex: index - 1 })).toBe(state);
                    state = class1Reducer(state, { type: "advance", stepIndex: index });
                }
            }
            expect(state).toMatchObject({ phase: "summary", incorrectCount: 0, assistanceCount: 0 });
        }
    });
    it("counts distinct support separately from wrong answers and allows hint replay", () => {
        let state = initialClass1();
        state = class1Reducer(state, { type: "hint" });
        state = class1Reducer(state, { type: "hint" });
        expect(state).toMatchObject({ assistanceCount: 2, incorrectCount: 0 });
        for (let index = 0; index < 3; index++) state = class1Reducer(state, { type: "guess", answer: "4" });
        expect(state).toMatchObject({ assistanceCount: 2, incorrectCount: 3, lastWrong: "4", feedbackVersion: 5 });
        state = class1Reducer(state, { type: "hint" });
        expect(state).toMatchObject({ assistanceCount: 2, incorrectCount: 3, focusVersion: 6 });
    });
    it("retains practiced rotation through advancement and uses plausible answer choices", () => {
        let state = class1Reducer(initialClass1(), { type: "rotate" });
        state = class1Reducer(state, { type: "guess", answer: "2" });
        state = class1Reducer(state, { type: "advance", stepIndex: 0 });
        expect(state.practicedRotation).toBe(true);
        CLASS1_STEPS.forEach(step => {
            expect(step.options.filter(answer => answer === step.answer)).toHaveLength(1);
            expect(new Set(step.options).size).toBe(step.options.length);
            expect(step.options).toHaveLength(4);
        });
        expect(CLASS1_STEPS.filter(step => step.kind === "size").map(step => step.size)).toEqual([3, 5, 4, 6]);
    });
});
describe("Class 1 review", () => {
    it("keeps selection after errors, counts help separately, and completes after exactly five matches", () => {
        let state = reviewReducer(initialReview, { type: "answer", size: 3 });
        expect(state.mistakes).toBe(0);
        state = reviewReducer(state, { type: "select", size: 2 });
        state = reviewReducer(state, { type: "answer", size: 3 });
        expect(state).toMatchObject({ selected: 2, mistakes: 1 });
        state = reviewReducer(state, { type: "hint" });
        expect(state).toMatchObject({ selected: 2, hints: 1, mistakes: 1 });
        for (const size of [2, 3, 4, 5, 6]) {
            state = reviewReducer(state, { type: "select", size });
            state = reviewReducer(state, { type: "answer", size });
        }
        expect(state.phase).toBe("complete");
        expect(reviewReducer(state, { type: "answer", size: 4 })).toBe(state);
    });
    it("shuffles without dropping or duplicating sizes", () => {
        for (const random of [() => 0, () => 0.5, () => 0.999]) expect(shuffleSizes(random).sort()).toEqual([2, 3, 4, 5, 6]);
    });
});
