import { describe, expect, it } from "vitest";
import { adjacent, appearanceFor, class3Reducer, closestFace, CONFIGURATIONS, FACE_ORDER, faceRotation, faceTour, initialState, LESSON_STEPS, nearestAngle, valueOfExpression } from "./class3Lesson";

describe("Class 3 equal-face lesson", () => {
    it("removes scaffolding, pauses for face results, and completes exactly once", () => {
        expect(CONFIGURATIONS).toHaveLength(7);
        expect(LESSON_STEPS).toHaveLength(16);
        expect(LESSON_STEPS.filter(step => step.kind === "total" || step.kind === "calculation")).toHaveLength(5);
        expect(LESSON_STEPS.filter(step => step.kind === "calculation")).toHaveLength(3);
        let state = initialState;
        for (const [index, step] of LESSON_STEPS.entries()) {
            expect(state.stepIndex).toBe(index);
            if (step.kind === "calculation") {
                expect(state.phase).toBe("calculationIntro");
                expect(class3Reducer(state, { type: "advance", stepIndex: index })).toEqual(state);
                state = class3Reducer(state, { type: "continue" });
                state = class3Reducer(state, { type: "calculationComplete", usedHints: 2 });
            } else {
                state = class3Reducer(state, { type: "guess", answer: step.answer });
                expect(class3Reducer(state, { type: "guess", answer: step.answer })).toEqual(state);
                if (step.kind === "faceExpression") {
                    expect(state.phase).toBe("faceResult");
                    expect(class3Reducer(state, { type: "advance", stepIndex: index })).toEqual(state);
                    state = class3Reducer(state, { type: "continue" });
                }
            }
            expect(class3Reducer(state, { type: "advance", stepIndex: index - 1 })).toEqual(state);
            state = class3Reducer(state, { type: "advance", stepIndex: index });
        }
        expect(state.phase).toBe("complete");
        expect(state.assistanceCount).toBe(6);
        expect(state.incorrectCount).toBe(0);
        expect(class3Reducer(state, { type: "advance", stepIndex: 15 })).toEqual(state);
    });

    it("counts wrong answers separately from escalating help and ignores duplicate hints", () => {
        let state = class3Reducer(initialState, { type: "hint" });
        state = class3Reducer(state, { type: "guess", answer: "wrong" });
        state = class3Reducer(state, { type: "hint" });
        expect(state.assistanceCount).toBe(3);
        expect(state.incorrectCount).toBe(1);
        expect(class3Reducer(state, { type: "hint" })).toEqual(state);
        expect(class3Reducer(state, { type: "guess", answer: "wrong" }).incorrectCount).toBe(2);
    });

    it("uses five target colors, keeps excluded faces muted, and has no equivalent distractors", () => {
        expect(new Set(CONFIGURATIONS.map(config => config.color)).size).toBe(5);
        for (const config of CONFIGURATIONS) {
            expect(config.color).not.toBe("white");
            const appearance = appearanceFor(config)!;
            for (const face of FACE_ORDER) {
                expect(appearance[face]?.muted).toBe(!config.faces.includes(face));
                expect(appearance[face]?.color).toBe(config.color);
            }
        }
        for (const step of LESSON_STEPS.filter(step => step.kind === "expression" || step.kind === "faceExpression")) {
            expect(step.options.filter(option => valueOfExpression(option) === valueOfExpression(step.answer))).toEqual([step.answer]);
        }
    });
});

describe("face inspection routes", () => {
    it("visits every selected face using only adjacent hops from every possible starting face", () => {
        for (let mask = 1; mask < 64; mask++) {
            const selected = FACE_ORDER.filter((_, index) => mask & (1 << index));
            for (const start of FACE_ORDER) {
                const route = faceTour(selected, start);
                expect(route[0]).toBe(start);
                const counted = new Set(route.filter(face => selected.includes(face)));
                expect(counted.size).toBe(selected.length);
                expect(route.length).toBeLessThanOrEqual(7);
                for (let index = 1; index < route.length; index++) expect(adjacent(route[index - 1], route[index])).toBe(true);
            }
        }
    });
    it("keeps lesson tours to quarter-turns and reveals the requested surface", () => {
        for (const config of CONFIGURATIONS) {
            let rotation = { x: 0, y: 0 };
            for (const face of faceTour(config.faces)) {
                const target = faceRotation(face, rotation);
                expect(Math.abs(target.x - rotation.x)).toBeLessThanOrEqual(90);
                expect(Math.abs(target.y - rotation.y)).toBeLessThanOrEqual(90);
                expect(closestFace(target)).toBe(face);
                rotation = target;
            }
        }
        expect(nearestAngle(0, -350)).toBe(-360);
        expect(nearestAngle(-90, 350)).toBe(270);
        expect(closestFace({ x: 180, y: 0 })).toBe("back");
    });
});
