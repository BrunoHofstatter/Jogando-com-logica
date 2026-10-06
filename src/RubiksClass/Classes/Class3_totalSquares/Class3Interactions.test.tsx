// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Class3TotalSquares from "./Class3TotalSquares";
import { CONFIGURATIONS, LESSON_STEPS } from "./class3Lesson";

const analytics = vi.hoisted(() => ({ startAttempt: vi.fn(), completeAttempt: vi.fn() }));
vi.mock("../../../analytics/useGameAttemptAnalytics", () => ({ useGameAttemptAnalytics: () => analytics }));
let container: HTMLDivElement, root: Root;
beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
});
afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});
const click = (text: string) => {
    const button = [...container.querySelectorAll("button")].find(node => node.textContent === text);
    expect(button).toBeDefined();
    act(() => button!.click());
};
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const cubes = () => container.querySelectorAll('[role="group"][aria-label^="Cubo "]');

it("keeps one current cube and hint after repeated wrong answers on question two and later steps", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    act(() => root.render(<MemoryRouter><Class3TotalSquares /></MemoryRouter>));
    click(LESSON_STEPS[0].answer);
    advance(1200);

    for (let index = 1; index < 9; index++) {
        const step = LESSON_STEPS[index];
        const wrong = step.options.find(option => option !== step.answer)!;
        for (let attempt = 0; attempt < 3; attempt++) {
            click(wrong);
            expect(cubes()).toHaveLength(1);
            expect(container.querySelectorAll('[class*="hintCard"]')).toHaveLength(1);
        }
        // Feedback still expires and restarts for another incorrect attempt.
        advance(3000);
        expect(container.textContent).not.toContain("Ainda não!");
        click(wrong);
        expect(container.textContent).toContain("Ainda não!");
        expect(cubes()).toHaveLength(1);

        click(step.answer);
        if (step.kind === "faceExpression") click("Continuar");
        else advance(1200);
        expect(cubes()).toHaveLength(1);
        const nextSize = CONFIGURATIONS[LESSON_STEPS[index + 1].configuration].size;
        expect(cubes()[0].getAttribute("aria-label")).toContain(`Cubo ${nextSize} por ${nextSize}.`);
        expect(container.querySelectorAll('[class*="hintCard"]')).toHaveLength(0);
    }
    expect(errors).not.toHaveBeenCalled();
});
