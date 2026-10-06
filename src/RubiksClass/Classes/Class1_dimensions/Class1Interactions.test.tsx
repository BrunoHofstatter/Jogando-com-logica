// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Class1Dimensions from "./Class1Dimensions";
import SummaryView from "./SummaryView";
import { Class1Cube } from "./Class1Cube";
import { EntryContext } from "../../Testing/entryContext";

const analytics = vi.hoisted(() => ({ startAttempt: vi.fn(() => true), completeAttempt: vi.fn(() => true) }));
vi.mock("../../../analytics/useGameAttemptAnalytics", () => ({ useGameAttemptAnalytics: () => analytics }));
let container: HTMLDivElement, root: Root;
let portrait: boolean, visible: boolean, reduced: boolean;
let listeners: Set<() => void>;
let frames: Map<number, FrameRequestCallback>, frameId: number;
beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.useFakeTimers();
    portrait = false; visible = true; reduced = false; listeners = new Set(); frames = new Map(); frameId = 0;
    vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visible ? "visible" : "hidden");
    vi.stubGlobal("matchMedia", (query: string) => ({
        get matches() { return query.includes("portrait") ? portrait : reduced; },
        addEventListener: (_: string, callback: () => void) => { listeners.add(callback); },
        removeEventListener: (_: string, callback: () => void) => { listeners.delete(callback); },
    }));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId; });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
    HTMLElement.prototype.releasePointerCapture = vi.fn();
    container = document.createElement("div"); document.body.append(container); root = createRoot(container);
    analytics.startAttempt.mockClear(); analytics.completeAttempt.mockClear();
});
afterEach(() => {
    act(() => root.unmount()); container.remove(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});
const render = (node: ReactNode) => act(() => root.render(<MemoryRouter>{node}</MemoryRouter>));
const click = (element: HTMLElement) => act(() => element.click());
const button = (text: string) => [...container.querySelectorAll<HTMLButtonElement>("button")].find(node => node.textContent === text)!;
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const arrow = (element: HTMLElement) => act(() => element.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
function pointer(element: HTMLElement, type: string, x: number, y = 0) {
    act(() => {
        const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 });
        Object.defineProperty(event, "pointerId", { value: 1 }); element.dispatchEvent(event);
    });
}
function tick(now: number) {
    act(() => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(now)); });
}
it("offers help only after foreground waiting, never records waiting as an error, and reports repeated rejection", () => {
    render(<Class1Dimensions />);
    visible = false; advance(40000);
    expect(button("Dica").className).not.toContain("offeredHelp");
    visible = true; advance(30000);
    expect(button("Dica").className).toContain("offeredHelp");
    click(button("Dica")); click(button("Mais uma dica"));
    click(button("4")); click(button("4"));
    expect(container.textContent).toContain("Ainda não.");
    advance(3000);
    expect(container.textContent).not.toContain("Ainda não.");
    expect(button("4").className).toContain("wrongOption");
    click(button("2")); advance(1200);
    click(button("2")); advance(1200);
    expect(container.textContent).toContain("De onde vem o nome 2×2?");
    advance(50000);
    expect(button("Continuar")).toBeDefined();
    click(button("Continuar"));
    for (const answer of ["3×3", "5×5", "4×4", "6×6"]) {
        click(button(answer)); advance(1200);
    }
    expect(container.textContent).toContain("Combine os tamanhos");
    expect(analytics.completeAttempt).not.toHaveBeenCalled();
    for (const size of [2, 3, 4, 5, 6]) {
        click(container.querySelector<HTMLButtonElement>(`[data-review-cube="${size}"] button`)!);
        click(button(`${size}×${size}`));
    }

    expect(analytics.completeAttempt).toHaveBeenCalledExactlyOnceWith({ assistanceCount: 2, incorrectCount: 2, outcome: "completed", success: true });
    click(button("Jogar novamente"));
    expect(analytics.startAttempt).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain("Combine os tamanhos!");
    expect(container.textContent).not.toContain("combinações");
    expect(container.querySelector('button[aria-pressed="true"]')).toBeNull();
});
it("completes five matches, retains retry selection, and focuses completion", () => {
    const complete = vi.fn(() => true);
    render(<SummaryView lessonHints={0} onComplete={complete} onReplay={() => {}} />);
    for (const size of [2, 3, 4, 5, 6]) {
        const cube = container.querySelector<HTMLButtonElement>(`[data-review-cube="${size}"] button`)!;
        expect(cube.tagName).toBe("BUTTON");
        act(() => cube.focus()); click(cube);
        if (size === 2) {
            click(button("3×3"));
            expect(cube.getAttribute("aria-pressed")).toBe("true");
            click(button("Dica"));
        }
        click(button(`${size}×${size}`));
        if (size < 6) {
            expect(document.activeElement?.hasAttribute("data-cube-select")).toBe(true);
            expect(button(`${size}×${size}`).className).toContain("correctAnswer");
            expect(button(`${size}×${size}`).querySelector("svg")).not.toBeNull();
            advance(3000);
            expect(container.textContent).not.toContain("Combinação correta!");
        }
    }
    expect(container.textContent).not.toContain("Mais dois desafios");

    expect(complete).toHaveBeenCalledExactlyOnceWith(1, 1);
    expect(document.activeElement?.textContent).toBe("Jogar novamente");
    const dialog = container.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(container.querySelectorAll("[data-review-cube]")).toHaveLength(5);
    expect(container.querySelector("[inert]")?.contains(dialog)).toBe(false);
    expect(container.querySelector("[inert] [data-review-cube]")).not.toBeNull();
    act(() => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true })));
    expect(document.activeElement?.textContent).toBe("Aulas");
    act(() => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true })));
    expect(document.activeElement?.textContent).toBe("Jogar novamente");
    expect(container.textContent).not.toContain("Erros nas lições");
});
it("loops the demonstration beyond two passes, ignores taps, stops on actual rotation, and cleans up", () => {
    const rotate = vi.fn();
    render(<Class1Cube size={3} cubeSize={22} demo onRotate={rotate} />);
    for (let time = 50; time <= 20500; time += 50) tick(time);
    expect(container.textContent).toContain("Arraste o cubo para girar");
    const cube = container.querySelector<HTMLElement>('[role="group"]')!;
    pointer(cube, "pointerdown", 0); pointer(cube, "pointerup", 0);
    expect(rotate).not.toHaveBeenCalled();
    for (let time = 20600; time <= 22500; time += 50) tick(time);
    expect(container.textContent).toContain("Arraste o cubo para girar");
    pointer(cube, "pointerdown", 0); pointer(cube, "pointermove", 30); pointer(cube, "pointerup", 30);
    expect(rotate).toHaveBeenCalledTimes(1);
    expect(container.textContent).not.toContain("Arraste o cubo para girar");
    expect(frames.size).toBe(0);
});
it("suppresses matching clicks after dragging and allows keyboard selection", () => {
    const select = vi.fn();
    render(<Class1Cube size={3} onSelect={select} />);
    const cube = container.querySelector<HTMLButtonElement>("button")!;
    pointer(cube, "pointerdown", 0); pointer(cube, "pointermove", 25); pointer(cube, "pointerup", 25);
    act(() => cube.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 })));
    expect(select).not.toHaveBeenCalled();
    click(cube); // Native keyboard activation produces a detail-zero click.
    expect(select).toHaveBeenCalledTimes(1);
});
it("keeps the lesson-wide demonstration dismissed and refocuses each hint without ambient spinning", () => {
    render(<Class1Dimensions />);
    arrow(container.querySelector<HTMLElement>('[role="group"]')!);
    click(button("2")); advance(1200);
    for (let time = 50; time <= 3000; time += 50) tick(time);
    expect(container.textContent).not.toContain("Arraste o cubo para girar");
    click(button("Dica"));
    const cube = container.querySelector<HTMLElement>('[role="group"]')!;
    arrow(cube);
    click(button("Mais uma dica"));
    expect(container.querySelector('[style*="rotateX(-22deg) rotateY(-32deg)"]')).not.toBeNull();
    expect(container.querySelector('[class*="autoRotate"]')).toBeNull();
});
it("responds to portrait changes without answer input and cleans up a pending transition", () => {
    render(<EntryContext.Provider value={{ isCheckpoint: true, stepIndex: 5 }}><Class1Dimensions /></EntryContext.Provider>);
    expect(container.querySelector('[style*="--cube-size: 22vw"]')).not.toBeNull();
    act(() => { portrait = true; listeners.forEach(callback => callback()); });
    expect(container.querySelector('[style*="--cube-size: 33vw"]')).not.toBeNull();
    click(button("6×6"));
    render(<p>Outra página</p>);
    advance(5000);
    expect(container.textContent).toBe("Outra página");
});

it("offers the cue on question three but never question four and reduces its travel", () => {
    const mount = (stepIndex: number) => render(<EntryContext.Provider key={stepIndex} value={{ isCheckpoint: true, stepIndex }}><Class1Dimensions /></EntryContext.Provider>);
    mount(2);
    for (let time = 50; time <= 3400; time += 50) tick(time);
    expect(container.textContent).toContain("Arraste o cubo para girar");
    act(() => { reduced = true; listeners.forEach(callback => callback()); });
    for (let time = 3450; time <= 6800; time += 50) tick(time);
    expect(container.querySelector('[style*="translateX(-2vw)"]')).not.toBeNull();
    mount(3);
    for (let time = 6850; time <= 10000; time += 50) tick(time);
    expect(container.textContent).not.toContain("Arraste o cubo para girar");
    expect(frames.size).toBe(0);
});
