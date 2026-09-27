// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Class2SummaryView from "./Class2SummaryView";
import Class2FaceArea from "./Class2FaceArea";
import { EntryContext } from "../../Testing/entryContext";
import { REVIEW_TARGETS, targetTotal } from "./class2Review";

const analytics = vi.hoisted(() => ({ startAttempt: vi.fn(() => true), completeAttempt: vi.fn(() => true) }));
vi.mock("../../../analytics/useGameAttemptAnalytics", () => ({ useGameAttemptAnalytics: () => analytics }));

let container: HTMLDivElement, root: Root;
let reduced: boolean;
let mediaListeners: Set<() => void>;
beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.useFakeTimers();
    reduced = true;
    mediaListeners = new Set();
    vi.stubGlobal("matchMedia", (query: string) => ({
        get matches() { return query.includes("prefers-reduced-motion") && reduced; },
        addEventListener: (_event: string, listener: () => void) => { if (query.includes("prefers-reduced-motion")) mediaListeners.add(listener); },
        removeEventListener: (_event: string, listener: () => void) => { mediaListeners.delete(listener); },
    }));
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
    vi.unstubAllGlobals();
});
const render = (node: ReactNode) => act(() => root.render(<MemoryRouter>{node}</MemoryRouter>));
const click = (node: HTMLElement) => act(() => node.click());
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const numbers = () => [...container.querySelectorAll<HTMLButtonElement>("[data-review-number]")];
const cubes = () => [...container.querySelectorAll<HTMLDivElement>("[data-review-target] [role=button]")];
function key(node: HTMLElement, value: string, repeat = false) {
    act(() => node.dispatchEvent(new KeyboardEvent("keydown", { key: value, repeat, bubbles: true, cancelable: true })));
}
function start() {
    const button = [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Jogar")!;
    click(button);
}

it("uses one cube tab stop for rotation and matching, then restores number focus", () => {
    render(<Class2SummaryView totalFlags={0} onStart={() => true} onComplete={() => true} />);
    start();
    expect(document.activeElement).toBe(numbers()[0]);
    expect(container.querySelectorAll("[data-review-target] [tabindex='0']")).toHaveLength(5);
    click(numbers().find(button => button.textContent === "6")!);
    const cube = cubes()[0];
    expect(document.activeElement).toBe(cube);
    const before = cube.style.transform;
    key(cube, "ArrowRight");
    expect(cube.style.transform).not.toBe(before);
    key(cube, "Enter", true);
    expect(container.textContent).toContain("0 / 10");
    key(cube, "Enter");
    expect(container.textContent).toContain("1 / 10");
    expect(numbers()).toContain(document.activeElement);
    advance(500);
    expect(numbers()).toContain(document.activeElement);
    expect(cubes()).toHaveLength(5);
});

it("returns to numbers after a wrong keyboard match and supports Space", () => {
    render(<Class2SummaryView totalFlags={0} onStart={() => true} onComplete={() => true} />);
    start();
    click(numbers().find(button => button.textContent === "7")!);
    key(cubes()[0], " ");
    expect(container.textContent).toContain("Ainda não combina");
    expect(container.textContent).toContain("0 / 10");
    expect(numbers()).toContain(document.activeElement);
});

it("finishes stationary play without waiting for numbers and focuses completion once", () => {
    const complete = vi.fn(() => true);
    render(<Class2SummaryView totalFlags={2} onStart={() => true} onComplete={complete} />);
    start();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    const initial = numbers().map(button => button.textContent);
    advance(30000);
    expect(numbers().map(button => button.textContent)).toEqual(initial);
    for (let match = 0; match < 10; match++) {
        const cube = cubes().find(cube => numbers().some(button => Number(button.textContent) === targetTotal(REVIEW_TARGETS[Number(cube.closest("[data-review-target]")!.getAttribute("data-review-target"))])))!;
        const target = REVIEW_TARGETS[Number(cube.closest("[data-review-target]")!.getAttribute("data-review-target"))];
        click(numbers().find(button => Number(button.textContent) === targetTotal(target))!);
        act(() => cube.focus());
        key(cube, "Enter");
        advance(500);
    }
    expect(complete).toHaveBeenCalledExactlyOnceWith(0);
    expect(document.activeElement?.textContent).toBe("Voltar ao Menu");
    advance(30000);
    expect(complete).toHaveBeenCalledTimes(1);
});

it("updates motion preference during play and cancels animation work", () => {
    reduced = false;
    render(<Class2SummaryView totalFlags={0} onStart={() => true} onComplete={() => true} />);
    start();
    click(numbers().find(button => button.textContent === "12")!);
    act(() => { reduced = true; mediaListeners.forEach(listener => listener()); });
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(numbers().find(button => button.getAttribute("aria-pressed") === "true")?.textContent).toBe("12");
    const frameCalls = vi.mocked(requestAnimationFrame).mock.calls.length;
    advance(30000);
    expect(vi.mocked(requestAnimationFrame).mock.calls).toHaveLength(frameCalls);
    expect(numbers().every(button => button.style.top === "" && button.style.left === "")).toBe(true);
});

it("still suppresses drag clicks while allowing keyboard matching afterward", () => {
    render(<Class2SummaryView totalFlags={0} onStart={() => true} onComplete={() => true} />);
    start();
    click(numbers().find(button => button.textContent === "6")!);
    const cube = cubes()[0];
    cube.setPointerCapture = vi.fn(); cube.hasPointerCapture = () => true; cube.releasePointerCapture = vi.fn();
    const pointer = (type: string, x: number) => act(() => {
        const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: 0, button: 0 });
        Object.defineProperties(event, { pointerId: { value: 1 }, isPrimary: { value: true } });
        cube.dispatchEvent(event);
    });
    pointer("pointerdown", 0); pointer("pointermove", 40); pointer("pointerup", 40);
    act(() => cube.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 })));
    expect(container.textContent).toContain("0 / 10");
    key(cube, "Enter");
    expect(container.textContent).toContain("1 / 10");
});

it.each([0, 2])("reports repeated wrong lesson submissions after all hints at step %s", stepIndex => {
    render(<EntryContext.Provider value={{ isCheckpoint: true, stepIndex }}><Class2FaceArea /></EntryContext.Provider>);
    const buttons = () => [...container.querySelectorAll<HTMLButtonElement>("button")];
    for (let hint = 0; hint < 3; hint++) click(buttons().find(button => button.textContent === (hint ? "Mais uma dica" : "Dica"))!);
    let submit: HTMLButtonElement;
    if (stepIndex === 2) {
        click(buttons().find(button => button.textContent === "3 + 3")!);
        submit = buttons().find(button => button.textContent === "Confirmar")!;
    } else submit = buttons().find(button => button.textContent === "2")!;
    click(submit);
    const status = [...container.querySelectorAll('[role="status"]')].find(node => node.textContent?.includes("Ainda não!"))!;
    const firstMessage = status.firstChild;
    click(submit);
    expect(status.textContent).toBe("Ainda não! Tente outra resposta.");
    expect(status.firstChild).not.toBe(firstMessage);
    expect(buttons().find(button => button.textContent === "Dica completa")?.disabled).toBe(true);
});
