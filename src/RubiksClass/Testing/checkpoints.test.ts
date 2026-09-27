import { describe, expect, it } from "vitest";
import { cubeCheckpoints, checkpointUrl, resolveCheckpoint } from "./checkpoints";
import { lessonCheckpoints } from "./registry";
import { class2Reducer, initialLessonState, LESSON_STEPS as class2Steps } from "../Classes/Class2_faceArea/class2Lesson";
import { class3Reducer, initialState, LESSON_STEPS as class3Steps } from "../Classes/Class3_totalSquares/class3Lesson";

describe("cube checkpoint navigation", () => {
    it("keeps stable identities when earlier questions are inserted or sections reordered", () => {
        const a = { id: "a", size: 3 }, b = { id: "b", size: 3 };
        expect(cubeCheckpoints([a, a, b])).toEqual([
            { id: "a", label: "1º 3×3", stepIndex: 0 },
            { id: "b", label: "2º 3×3", stepIndex: 2 },
        ]);
        expect(resolveCheckpoint("?checkpoint=b", cubeCheckpoints([a, a, a, b])).stepIndex).toBe(3);
        expect(resolveCheckpoint("?checkpoint=b", cubeCheckpoints([b, a])).stepIndex).toBe(0);
        expect(cubeCheckpoints([b])[0].label).toBe("3×3");
    });
    it("distinguishes ordinary entry from deleted or empty checkpoints", () => {
        expect(resolveCheckpoint("?mode=game", [])).toEqual({ isCheckpoint: false, valid: true, stepIndex: 0 });
        for (const search of ["?checkpoint=deleted", "?checkpoint="]) {
            expect(resolveCheckpoint(search, lessonCheckpoints.class1)).toMatchObject({ isCheckpoint: true, valid: false });
        }
        const url = checkpointUrl("/lesson", "cube with spaces");
        expect(resolveCheckpoint(url.slice(url.indexOf("?")), [{ id: "cube with spaces", label: "3×3", stepIndex: 4 }]).stepIndex).toBe(4);
    });
    it("groups row changes on the same cube and keeps distinct Class 3 configurations", () => {
        expect(lessonCheckpoints.class1.map(item => item.stepIndex)).toEqual([0, 2, 3, 4, 5]);
        expect(lessonCheckpoints.class2.map(item => item.stepIndex)).toEqual([0, 4, 8, 9, 11]);
        expect(lessonCheckpoints.class3.map(item => item.stepIndex)).toEqual([0, 4, 8, 10, 11, 13, 14]);
        expect(lessonCheckpoints.class3.map(item => item.label)).toEqual(["2×2", "3×3", "4×4", "1º 5×5", "2º 5×5", "1º 6×6", "2º 6×6"]);
    });
    it("can finish Class 2 from every checkpoint through its ordinary transitions", () => {
        for (const checkpoint of lessonCheckpoints.class2) {
            let state = initialLessonState(false, checkpoint.stepIndex);
            expect(state).toMatchObject({ phase: "question", hintLevel: 0, incorrectCount: 0, assistanceCount: 0, selectedSum: null });
            for (let index = checkpoint.stepIndex; index < class2Steps.length; index++) {
                expect(state.stepIndex).toBe(index);
                state = class2Reducer(state, { type: "guess", answer: class2Steps[index].answer });
                state = class2Reducer(state, { type: state.phase === "reveal" ? "continueReveal" : "advance" });
            }
            expect(state.phase).toBe("summary");
        }
        expect(initialLessonState(true).phase).toBe("summary");
        expect(initialLessonState(false).stepIndex).toBe(0);
    });
    it("can finish Class 3 from every checkpoint, including explanations and calculations", () => {
        for (const checkpoint of lessonCheckpoints.class3) {
            let state = { ...initialState, stepIndex: checkpoint.stepIndex };
            for (let index = checkpoint.stepIndex; index < class3Steps.length; index++) {
                expect(state.stepIndex).toBe(index);
                if (state.phase === "calculationIntro") state = class3Reducer(state, { type: "continue" });
                const step = class3Steps[index];
                state = class3Reducer(state, step.kind === "calculation"
                    ? { type: "calculationComplete", usedHints: 0 } : { type: "guess", answer: step.answer });
                state = class3Reducer(state, state.phase === "faceResult"
                    ? { type: "continue" } : { type: "advance", stepIndex: index });
            }
            expect(state).toMatchObject({ phase: "complete", incorrectCount: 0, assistanceCount: 0 });
        }
    });
});
