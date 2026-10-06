// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Class3TotalSquares from "./Class3TotalSquares";
import Class3SummaryView from "./Class3SummaryView";
import { createReviewState, cubeMatches } from "./class3ReviewGeneration";
import { EntryContext } from "../../Testing/entryContext";
import { ROUTES } from "../../../routes";

const analytics = vi.hoisted(() => ({ startAttempt: vi.fn(() => true), completeAttempt: vi.fn(() => true) }));
const contexts = vi.hoisted(() => vi.fn());
vi.mock("../../../analytics/useGameAttemptAnalytics", () => ({ useGameAttemptAnalytics: (context: unknown) => { contexts(context); return analytics; } }));
let container: HTMLDivElement, root: Root, callbacks: Map<number, FrameRequestCallback>, frameId: number, now: number;
let visible = true;
const seed = Math.floor(0.2 * 0xffffffff);

beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.spyOn(Math, "random").mockReturnValue(0.2);
    callbacks = new Map(); frameId = 0; now = 0; visible = true;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callbacks.set(++frameId, callback); return frameId; });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => callbacks.delete(id));
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query === "(any-pointer: fine)", addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visible ? "visible" : "hidden");
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1200);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(800);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ x: 0, y: 0, left: 0, top: 0, width: 1200, height: 800, right: 1200, bottom: 800, toJSON: () => ({}) });
    analytics.startAttempt.mockClear(); analytics.completeAttempt.mockClear(); contexts.mockClear();
    container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(() => {
    act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});
async function render(path = `${ROUTES.CLASS_3}?mode=game`, checkpoint = false) {
    await act(async () => root.render(<MemoryRouter initialEntries={[path]}><EntryContext.Provider value={{ isCheckpoint: checkpoint, stepIndex: 0 }}>
        <Routes><Route path={ROUTES.CLASS_3} element={<Class3TotalSquares />} /><Route path={ROUTES.CLASS_MENU} element={<p>Menu de aulas</p>} /></Routes>
    </EntryContext.Provider></MemoryRouter>));
}
function click(text: string) {
    const button = [...container.querySelectorAll("button")].find(button => button.textContent === text);
    expect(button).toBeDefined(); act(() => button!.click());
}
function advance(seconds: number) {
    const count = Math.ceil(seconds / 0.05);
    for (let i = 0; i < count; i++) act(() => {
        now += 50;
        const pending = [...callbacks.entries()];
        pending.forEach(([id, callback]) => { callbacks.delete(id); callback(now); });
    });
}
function fire(id: string) {
    const target = container.querySelector<HTMLElement>(`[data-motion="${id}"]`);
    expect(target).not.toBeNull();
    const x = parseFloat(target!.style.left) / 100 * 1200;
    const y = parseFloat(target!.style.top) / 100 * 800;
    const surface = container.querySelector('[role="application"]')!;
    act(() => surface.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0, clientX: x, clientY: y })));
}
async function startMain() {
    await render(); click("Jogar"); advance(0.1);
    for (const cube of createReviewState(seed).practice.cubes) { fire(cube.id); advance(1.65); }
}

it("direct review opens its introduction without starting a lesson or game attempt", async () => {
    await render();
    expect(container.textContent).toContain("Acerte o cubo que combina com sua munição!");
    expect(analytics.startAttempt).not.toHaveBeenCalled();
    expect(contexts.mock.calls.every(([context]) => context?.activityVariant === "review")).toBe(true);
    click("Jogar"); expect(analytics.startAttempt).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("Mire no cubo e clique para atirar!");
    expect(container.querySelectorAll('[data-motion]')).toHaveLength(1);
    expect(container.textContent).not.toContain("3×3");
    expect(container.querySelector('[role="status"]')?.textContent).toBe("Mire no cubo e clique para atirar!");
    expect(container.textContent).not.toContain("1 de 2");
    expect(container.textContent).not.toContain("2 de 2");
});

it("checkpoint entry takes precedence over direct game mode", async () => {
    await render(`${ROUTES.CLASS_3}?mode=game`, true);
    expect(container.textContent).toContain("Quantas faces");
    expect(container.textContent).not.toContain("Acerte o cubo que combina");
    expect(contexts.mock.calls.every(([context]) => context === null)).toBe(true);
});

it("renders only six mathematical face nodes per cube and routes Aulas without a shot", async () => {
    await startMain();
    expect(container.querySelectorAll('[data-motion] [data-face]')).toHaveLength(18);
    expect(container.querySelector('[aria-label="9 de 9 pontos de vida"]')).not.toBeNull();
    click("Aulas");
    expect(container.textContent).toContain("Menu de aulas");
    expect(analytics.completeAttempt).not.toHaveBeenCalled();
});

it("finishes a ten-round pointer game once, shows remaining hearts, and replays a fresh introduction", async () => {
    await startMain();
    const deck = createReviewState(seed).rounds;
    for (const round of deck) {
        advance(1.4);
        fire(round.cubes.find(cube => cubeMatches(cube, round.ammo))!.id);
        advance(0.6);
    }
    expect(analytics.completeAttempt).not.toHaveBeenCalled();
    advance(0.85);
    expect(container.textContent).toContain("Você chegou ao fim das 10 rodadas!");
    expect(container.querySelector('[aria-label="9 de 9 pontos de vida restantes"]')).not.toBeNull();
    expect(analytics.completeAttempt).toHaveBeenCalledTimes(1);
    expect(analytics.completeAttempt).toHaveBeenCalledWith(expect.objectContaining({ outcome: "passed", success: true, correctCount: 10, incorrectCount: 0 }));
    expect(document.activeElement?.textContent).toBe("Jogar novamente");
    click("Jogar novamente");
    expect(container.textContent).toContain("Acerte o cubo que combina com sua munição!");
    expect(analytics.startAttempt).toHaveBeenCalledTimes(1);
    click("Jogar"); expect(analytics.startAttempt).toHaveBeenCalledTimes(2);
    expect(container.querySelector('[aria-label="9 de 9 pontos de vida"]')).not.toBeNull();
});

it("excludes hidden time from movement and resets the frame baseline on return", async () => {
    await startMain(); advance(1);
    const target = container.querySelector<HTMLElement>('[data-motion]')!;
    const before = target.style.top;
    act(() => { visible = false; document.dispatchEvent(new Event("visibilitychange")); });
    advance(35);
    expect(target.style.top).toBe(before);
    act(() => { visible = true; document.dispatchEvent(new Event("visibilitychange")); });
    advance(0.05);
    expect(target.style.top).toBe(before);
    advance(1);
    expect(parseFloat(target.style.top)).toBeGreaterThan(parseFloat(before));
    expect(analytics.completeAttempt).not.toHaveBeenCalled();
});

it("shows a local mouse notice on coarse-pointer devices without starting an attempt", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query === "(pointer: coarse)", addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    act(() => root.render(<MemoryRouter><Class3SummaryView /></MemoryRouter>));
    expect(container.textContent).toContain("Jogue com um mouse");
    expect(container.querySelector('[role="application"]')).toBeNull();
    expect(analytics.startAttempt).not.toHaveBeenCalled();
});

it("counts a slow foreground frame accurately instead of extending the game clock", async () => {
    await startMain(); advance(0.1);
    const target = container.querySelector<HTMLElement>('[data-motion]')!;
    const before = parseFloat(target.style.top);
    act(() => {
        now += 2000;
        const pending = [...callbacks.entries()];
        pending.forEach(([id, callback]) => { callbacks.delete(id); callback(now); });
    });
    expect(parseFloat(target.style.top) - before).toBeCloseTo(2 / 28 * 58);
});
