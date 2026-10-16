// @vitest-environment jsdom
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import TutorialGate from "./TutorialGate";
import TutorialPage from "../Pages/tutorialPage";
import Board from "../Components/board-component";
import { firstFixture } from "./lesson";
import { ROUTES } from "../../routes";
import { allowedDifficulty, menuReturn, readReturn, saveReturn, validateReturn } from "./navigation";

const flags = vi.hoisted(() => ({ online: false, unseen: true, mounted: vi.fn() }));
vi.mock("../Hooks/useMathWarMultiplayer", () => ({ hasActiveMathWarMultiplayerSession: () => flags.online }));
vi.mock("../../Shared/Tutorial/tutorialHistory", async importOriginal => {
  const original = await importOriginal<typeof import("../../Shared/Tutorial/tutorialHistory")>();
  return { ...original, unseenLessons: (ids: unknown[]) => flags.unseen ? ids : [], recordTutorialHistory: () => { flags.unseen = false; } };
});
let container: HTMLDivElement, root: Root;
beforeEach(() => {
  flags.online = false; flags.unseen = true; flags.mounted.mockClear();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.useFakeTimers(); localStorage.clear(); sessionStorage.clear();
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const button = (text: string) => [...container.querySelectorAll<HTMLButtonElement>("button")].find(node => node.textContent === text)!;
const click = (node: HTMLElement) => { expect(node).toBeTruthy(); act(() => node.click()); };
const cell = (r: number, c: number) => container.querySelector<HTMLElement>(`[data-square="${String.fromCharCode(97 + c)}${r + 1}"]`)!;
const advance = () => act(() => vi.runAllTimers());
const next = () => { click(button("Continuar")); advance(); };
function NormalDestination() { const location = useLocation(); flags.mounted(); return <div data-normal>{location.pathname}:{location.state?.difficulty ?? ""}</div>; }
function renderEntry(path = ROUTES.MATH_WAR_TUTORIAL as string, state?: object) {
  act(() => root.render(<StrictMode><MemoryRouter initialEntries={[{ pathname: path, state }]}><Routes>
    <Route path={ROUTES.MATH_WAR_TUTORIAL} element={<TutorialPage />} />
    {[ROUTES.MATH_WAR_GAME, ROUTES.MATH_WAR_AI, ROUTES.MATH_WAR_MP_LOBBY].map(route => <Route key={route} path={route} element={<TutorialGate><NormalDestination /></TutorialGate>} />)}
    <Route path={ROUTES.MATH_WAR_RULES} element={<NormalDestination />} />
  </Routes></MemoryRouter></StrictMode>));
}
function reachCapture() {
  click(cell(3, 4)); advance(); click(cell(3, 5)); advance(); next();
  click(cell(2, 2)); advance(); next();
}

it.each([ROUTES.MATH_WAR_GAME, ROUTES.MATH_WAR_AI, ROUTES.MATH_WAR_MP_LOBBY])("gates %s before normal pages mount, and skipping retains the destination", path => {
  localStorage.setItem("game_progress_mathwar", "3"); renderEntry(path, { difficulty: 3 });
  expect(flags.mounted).not.toHaveBeenCalled(); expect(cell(3, 3).getAttribute("aria-pressed")).toBe("true");
  click(button("Pular")); advance();
  expect(container.querySelector("[data-normal]")?.textContent).toBe(`${path}:${path === ROUTES.MATH_WAR_AI ? 3 : ""}`);
  expect(vi.getTimerCount()).toBe(0);
});

it("bypasses onboarding for an active online room and preserves normal entry for seen history", () => {
  flags.online = true; renderEntry(); expect(container.textContent).toContain(ROUTES.MATH_WAR_MP_LOBBY);
  flags.online = false; flags.unseen = false;
  act(() => root.unmount()); root = createRoot(container); renderEntry(ROUTES.MATH_WAR_GAME);
  expect(container.textContent).toContain(ROUTES.MATH_WAR_GAME); expect(button("Pular")).toBeUndefined();
});

it("hides values and directions at first, then shows cost labels with both affordability states", () => {
  renderEntry(); expect(container.querySelectorAll("[data-piece]")).toHaveLength(1);
  expect(container.querySelectorAll("[data-piece-value]")).toHaveLength(0);
  expect(cell(3, 3).getAttribute("aria-label")).not.toContain("valor");
  expect(container.querySelector('[data-practice-board]')?.className).toContain("boardWrapper");
  click(cell(3, 4)); advance();
  expect(container.querySelector("[data-piece-value]")?.textContent).toBe("+2");
  expect(cell(3, 7).dataset.cost).toBe("6"); expect(cell(3, 0).dataset.affordable).toBe("false");
  click(cell(3, 5)); advance(); expect(container.textContent).toContain("Gastou 2 ⚡");
  advance(); expect(container.querySelector("[data-stage]")?.getAttribute("data-stage")).toBe("2");
});

it("runs the complete lesson in StrictMode, with a hidden Captain reveal and no real win side effects", () => {
  renderEntry(ROUTES.MATH_WAR_AI, { difficulty: 1 }); reachCapture();
  expect(cell(0, 3).dataset.cost).toBe("8"); expect(cell(3, 5).dataset.cost).toBe("6");
  click(cell(3, 5)); advance(); next();
  expect(container.textContent).toContain("A energia mudou!");
  expect(container.querySelector('[data-pointer="dice-term"]')?.textContent).toBe("3");
  click(button("Continuar"));
  expect(container.querySelectorAll("[data-piece]")).toHaveLength(10);
  expect(container.querySelectorAll("[data-captain]")).toHaveLength(0);
  expect(container.textContent).not.toContain("Se capturarem");
  act(() => vi.advanceTimersByTime(2400)); expect(container.querySelectorAll("[data-captain]")).toHaveLength(1);
  advance(); expect(container.querySelectorAll("[data-captain]")).toHaveLength(2);
  expect(container.textContent).toContain("Se capturarem seu Capitão, você perde");
  click(cell(3, 3)); advance(); expect(container.textContent).toContain("Você venceu!");
  expect(flags.mounted).not.toHaveBeenCalled(); expect(localStorage.getItem("game_progress_mathwar")).toBeNull();
  next(); click(cell(2, 3)); advance(); expect(container.textContent).toContain("Gastou 4 ⚡");
  next(); expect(container.querySelectorAll("[data-piece]")).toHaveLength(2); expect(cell(2, 4).dataset.cost).toBe("8");
  click(cell(2, 4)); advance(); expect(container.textContent).toContain("Gastou 8 ⚡"); next();
  expect(container.querySelectorAll("[data-piece]")).toHaveLength(20); expect(button("Repetir tutorial")).toBeTruthy();
  click(button("Repetir tutorial")); expect(container.querySelectorAll("[data-piece]")).toHaveLength(1);
  click(button("Pular")); advance(); expect(container.textContent).toContain(ROUTES.MATH_WAR_AI);
});

it("restores legal non-captures, provides numeric feedback, and escalates hints", () => {
  renderEntry(); reachCapture();
  click(cell(4, 3)); expect(container.textContent).toContain("Capture a peça vermelha."); advance();
  expect(cell(3, 3).getAttribute("aria-pressed")).toBe("true"); expect(cell(3, 5).dataset.piece).toBe("red-sum");
  click(cell(0, 3)); expect(container.textContent).toContain("Precisa de 8 ⚡. Você tem 6."); advance();
  expect(cell(3, 5).getAttribute("aria-label")).toContain("objetivo marcado");
  click(button("Dica")); expect(container.textContent).toContain("Vá até a casa marcada");
  click(button("Pular")); advance(); expect(vi.getTimerCount()).toBe(0);
});

it("supports keyboard input and local interaction locking without changing normal move execution", () => {
  renderEntry(); act(() => cell(3, 4).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))); advance();
  expect(cell(3, 4).getAttribute("aria-pressed")).toBe("true");
  act(() => root.unmount()); root = createRoot(container);
  const changed = vi.fn(); const state = firstFixture();
  act(() => root.render(<Board gameState={state} onGameStateChange={changed} interactionLocked />));
  click(cell(3, 3)); click(cell(3, 4)); expect(changed).not.toHaveBeenCalled();
  act(() => root.render(<Board gameState={state} onGameStateChange={changed} />));
  click(cell(3, 3)); click(cell(3, 4)); expect(changed).toHaveBeenCalledOnce();
  expect(changed.mock.calls[0][0].currentPlayer).toBe(0);
});

it("validates return routes, refresh context, difficulty locks, and blocked storage", () => {
  expect(validateReturn({ destination: "https://example.com" })).toEqual(menuReturn);
  expect(allowedDifficulty(4)).toBe(1); localStorage.setItem("game_progress_mathwar", "3"); expect(allowedDifficulty(3)).toBe(3);
  const context = { destination: ROUTES.MATH_WAR_AI, difficulty: 3 }; saveReturn(context, "entry-one");
  expect(readReturn(null, "entry-one")).toEqual(context); expect(readReturn(null, "entry-two")).toEqual(menuReturn);
  expect(readReturn({ tutorialReturn: context }, "refresh")).toEqual(context);
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  expect(readReturn(null, "entry-one")).toEqual(menuReturn); expect(() => saveReturn(context, "entry-one")).not.toThrow();
  renderEntry(); expect(container.textContent).toContain("Peça redonda");
});
