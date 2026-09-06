import { describe, expect, it } from "vitest";
import { class2Reducer, initialLessonState, LESSON_STEPS, lessonCubeProps } from "./class2Lesson";

describe("Class 2 lesson flow", () => {
    it("pauses for discovery, rejects duplicate answers, and reaches the unchanged review", () => {
        let state = initialLessonState(false);
        for (const [stepIndex, step] of LESSON_STEPS.entries()) {
            expect(state.stepIndex).toBe(stepIndex);
            const answered = class2Reducer(state, { type: "guess", answer: step.answer });
            expect(class2Reducer(answered, { type: "guess", answer: step.answer })).toEqual(answered);
            expect(class2Reducer(answered, { type: "hint" })).toEqual(answered);
            if (step.kind === "addition") {
                expect(answered.phase).toBe("reveal");
                expect(class2Reducer(answered, { type: "advance" })).toEqual(answered);
                const replayed = class2Reducer(answered, { type: "replay" });
                expect(replayed.stepIndex).toBe(stepIndex);
                expect(replayed.assistanceCount).toBe(0);
                state = class2Reducer(replayed, { type: "continueReveal" });
            } else {
                expect(answered.phase).toBe("transition");
                state = class2Reducer(answered, { type: "advance" });
            }
        }
        expect(state.phase).toBe("summary");
        expect(class2Reducer(state, { type: "advance" })).toEqual(state);
        expect(initialLessonState(true).phase).toBe("summary");
    });

    it("counts requested help separately from wrong answers and resets hints per question", () => {
        let state = class2Reducer(initialLessonState(false), { type: "hint" });
        expect(state.assistanceCount).toBe(1);
        expect(state.incorrectCount).toBe(0);
        state = class2Reducer(state, { type: "guess", answer: "2" });
        expect(state.assistanceCount).toBe(2);
        expect(state.incorrectCount).toBe(1);
        state = class2Reducer(state, { type: "hint" });
        expect(class2Reducer(state, { type: "hint" })).toEqual(state);
        state = class2Reducer(state, { type: "guess", answer: "2" });
        expect(state.incorrectCount).toBe(2);
        expect(state.assistanceCount).toBe(3);
        state = class2Reducer(state, { type: "guess", answer: "3" });
        state = class2Reducer(state, { type: "advance" });
        expect(state.hintLevel).toBe(0);
        expect(state.assistanceCount).toBe(3);
        expect(state.incorrectCount).toBe(2);
    });

    it("lets the child preview addition choices without treating exploration as an error", () => {
        const stepIndex = LESSON_STEPS.findIndex(step => step.kind === "addition");
        let state = { ...initialLessonState(false), stepIndex };
        state = class2Reducer(state, { type: "selectSum", answer: "3 + 3" });
        state = class2Reducer(state, { type: "selectSum", answer: "3 + 3 + 3" });
        expect(state.phase).toBe("question");
        expect(state.incorrectCount).toBe(0);
        state = class2Reducer(state, { type: "guess", answer: state.selectedSum! });
        expect(state.phase).toBe("reveal");
    });
});

describe("equal groups and partial-face targets", () => {
    const partialSteps = LESSON_STEPS.filter(step => step.rows < step.size);

    it.each(partialSteps)("keeps excluded rows out of every hint in $id", step => {
        for (const hintLevel of [0, 1, 2, 3]) {
            const props = lessonCubeProps(step, { ...initialLessonState(false), hintLevel });
            const stickers = props.faceAppearances!.front!.stickers!;
            expect(stickers.filter(sticker => !sticker?.muted)).toHaveLength(step.rows * step.size);
            expect(stickers.slice(step.rows * step.size).every(sticker => sticker?.muted)).toBe(true);
            expect(props.rowGuides!.front!.every(guide => guide.row < step.rows)).toBe(true);
            expect(props.rowGuides!.front).toHaveLength(step.rows);
        }
    });

    it("asks for computations on 2×2, 5×5, and 6×6 and totals on their larger partial faces", () => {
        for (const size of [2, 5, 6]) {
            expect(LESSON_STEPS.some(step => step.size === size && step.rows === size && step.kind === "multiplication")).toBe(true);
        }
        expect(partialSteps.some(step => step.size === 5 && step.rows === 4 && step.answer === "20")).toBe(true);
        expect(partialSteps.some(step => step.size === 6 && step.rows === 5 && step.answer === "30")).toBe(true);
    });

    it("never offers an equivalent valid calculation as a wrong answer", () => {
        for (const step of LESSON_STEPS.filter(step => step.kind === "multiplication")) {
            const target = step.rows * step.size;
            for (const option of step.options) {
                const [groups, amount] = option.value.split(" × ").map(Number);
                expect(groups * amount === target).toBe(option.value === step.answer);
            }
        }
    });

    it("restores stripes through help on the independent ordinary face", () => {
        const step = LESSON_STEPS.find(step => step.striped === false)!;
        const plain = lessonCubeProps(step, initialLessonState(false));
        expect(plain.rowGuides!.front).toHaveLength(0);
        expect(plain.faceAppearances!.front!.stickers!.every(sticker => sticker?.color === undefined)).toBe(true);
        const helped = lessonCubeProps(step, { ...initialLessonState(false), hintLevel: 2 });
        expect(helped.rowGuides!.front).toHaveLength(step.rows);
        expect(helped.faceAppearances!.front!.stickers!.every(sticker => sticker?.color)).toBe(true);
    });
});
