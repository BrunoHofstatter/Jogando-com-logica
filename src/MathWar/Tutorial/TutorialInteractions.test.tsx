// @vitest-environment jsdom
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import TutorialGate from "./TutorialGate";
import TutorialPage from "../Pages/tutorialPage";
import Board from "../Components/board-component";
import { DiceAnimation } from "../Components/DiceAnimation";
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
function NormalDestination() { const location = useLocation(); flags.mounted(); return <div data-normal>{location.pathname}:{location.state?.difficulty ?? ""}</div>; }
function renderEntry(path = ROUTES.MATH_WAR_TUTORIAL as string, state?: object) {
  act(() => root.render(<StrictMode><MemoryRouter initialEntries={[{ pathname: path, state }]}><Routes>
    <Route path={ROUTES.MATH_WAR_TUTORIAL} element={<TutorialPage />} />
    {[ROUTES.MATH_WAR_GAME, ROUTES.MATH_WAR_AI, ROUTES.MATH_WAR_MP_LOBBY].map(route => <Route key={route} path={route} element={<TutorialGate><NormalDestination /></TutorialGate>} />)}
    <Route path={ROUTES.MATH_WAR_RULES} element={<NormalDestination />} />
  </Routes></MemoryRouter></StrictMode>));
}
function reachCapture() {
  click(cell(3, 4)); advance(); click(cell(3, 5)); advance();
  click(cell(2, 2)); advance();
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
  expect(cell(3, 7).className).toContain("squareHighlighted");
  click(cell(3, 4)); advance();
  expect(container.querySelector("[data-piece-value]")?.textContent).toBe("+2");
  expect(cell(3, 7).dataset.cost).toBe("6"); expect(cell(3, 0).dataset.affordable).toBe("false");
  expect(container.querySelector('[data-pointer="dice-term"] small')?.textContent).toBe("Dados");
  expect(container.querySelector('[data-pointer="piece-term"] small')?.textContent).toBe("Valor da peça");
  expect(container.querySelector('[class*="directionHintsLayer"]')).toBeNull();
  click(cell(3, 5)); act(() => vi.advanceTimersByTime(350)); expect(container.textContent).toContain("Gastou 2 ⚡");
  expect(button("Continuar")).toBeUndefined();
  act(() => vi.advanceTimersByTime(2999)); expect(container.querySelector("[data-stage]")?.getAttribute("data-stage")).toBe("2");
  act(() => vi.advanceTimersByTime(1)); expect(container.querySelector("[data-stage]")?.getAttribute("data-stage")).toBe("3");
  expect(container.querySelector('[aria-label="Rolando dados"]')).toBeNull();
  expect(cell(2, 2).dataset.cost).toBe("2");
});

it("runs the complete lesson in StrictMode, with a hidden Captain reveal and no real win side effects", () => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 100, 100));
  renderEntry(ROUTES.MATH_WAR_AI, { difficulty: 1 }); reachCapture();
  expect(cell(0, 3).dataset.cost).toBe("8"); expect(cell(3, 5).dataset.cost).toBe("6");
  click(cell(3, 5)); act(() => vi.advanceTimersByTime(12600));
  expect(container.textContent).toContain("A energia mudou!");
  expect(container.querySelector('[data-pointer="dice-term"] > span')?.textContent).toBe("3");
  act(() => vi.advanceTimersByTime(3000));
  expect(container.querySelectorAll("[data-piece]")).toHaveLength(10);
  expect(container.querySelectorAll("[data-captain]")).toHaveLength(0);
  expect(container.querySelectorAll("svg line")).toHaveLength(0);
  expect(container.textContent).not.toContain("Se capturarem");
  act(() => vi.advanceTimersByTime(3999)); expect(container.querySelectorAll("[data-captain]")).toHaveLength(0);
  act(() => vi.advanceTimersByTime(1)); expect(container.querySelectorAll("[data-captain]")).toHaveLength(1);
  expect(container.querySelectorAll("svg line")).toHaveLength(1);
  advance(); expect(container.querySelectorAll("[data-captain]")).toHaveLength(2);
  expect(container.textContent).toContain("Se capturarem seu Capitão, você perde");
  click(cell(3, 3)); act(() => vi.advanceTimersByTime(350)); expect(container.textContent).toContain("Você venceu!");
  expect(flags.mounted).not.toHaveBeenCalled(); expect(localStorage.getItem("game_progress_mathwar")).toBeNull();
  act(() => vi.advanceTimersByTime(3000));
  expect(container.querySelectorAll("[data-piece]")).toHaveLength(2); expect(cell(3, 4).dataset.cost).toBe("8");
  expect(container.textContent).not.toContain("Ande uma casa");
  click(cell(3, 4)); act(() => vi.advanceTimersByTime(350)); expect(container.textContent).toContain("Gastou 8 ⚡");
  act(() => vi.advanceTimersByTime(3000));
  expect(container.querySelectorAll("[data-piece]")).toHaveLength(20); expect(button("Repetir tutorial")).toBeTruthy();
  click(button("Repetir tutorial")); expect(container.querySelectorAll("[data-piece]")).toHaveLength(1);
  click(button("Pular")); advance(); expect(container.textContent).toContain(ROUTES.MATH_WAR_AI);
});

it("restores legal non-captures, provides numeric feedback, and escalates hints", () => {
  renderEntry(); reachCapture();
  click(cell(4, 3)); expect(container.textContent).toContain("Capture a peça vermelha."); advance();
  expect(cell(3, 3).getAttribute("aria-pressed")).toBe("true"); expect(cell(3, 5).dataset.piece).toBe("red-sum");
  click(cell(0, 3)); expect(container.querySelector('[role="status"]')?.textContent).toBe("Precisa de 8 ⚡.Você tem 6 ⚡.");
  expect(container.querySelector('[role="status"] strong')?.className).toContain("wrongNumber");
  expect(container.querySelector('[role="status"] strong:last-child')?.className).toContain("rightNumber"); advance();
  expect(cell(3, 5).getAttribute("aria-label")).toContain("objetivo marcado");
  click(button("Dica")); expect(container.textContent).toContain("Vá até a casa marcada");
  expect(container.querySelector('svg line[stroke="#d97706"]')).toBeNull();
  click(button("Pular")); advance(); expect(vi.getTimerCount()).toBe(0);
});

it("uses the shared centered dice presentation and keeps selection, turns, and countdown aligned", () => {
  renderEntry(); click(cell(3, 4)); act(() => vi.advanceTimersByTime(350));
  expect(container.querySelector('[aria-label="Rolando dados"]')).not.toBeNull();
  act(() => vi.advanceTimersByTime(800)); expect(container.querySelector('[aria-label="Resultado dos dados"]')?.textContent).toContain("4");
  advance(); click(cell(3, 5)); advance(); click(cell(2, 2)); advance(); click(cell(3, 5));
  act(() => vi.advanceTimersByTime(3350));
  expect(container.querySelector("[data-roll-countdown]")?.textContent).toBe("3");
  expect(container.querySelector('[aria-label="Rolando dados"]')).not.toBeNull();
  act(() => vi.advanceTimersByTime(3400));
  expect(container.querySelector("[data-turn-player]")?.textContent).toBe("Turno 1 · Vermelho");
  expect(cell(3, 5).getAttribute("aria-pressed")).toBe("true");
  act(() => vi.advanceTimersByTime(350));
  expect(container.querySelector("[data-turn-player]")?.textContent).toBe("Turno 2 · Azul");
  expect(container.querySelector("[data-roll-countdown]")?.textContent).toBe("2");
  expect(cell(5, 2).getAttribute("aria-pressed")).toBe("true");
  act(() => vi.advanceTimersByTime(1650));
  expect(container.querySelector("[data-turn-player]")?.textContent).toBe("Turno 3 · Vermelho");
  expect(container.querySelector("[data-roll-countdown]")?.textContent).toBe("1");
  act(() => vi.advanceTimersByTime(1650));
  expect(container.querySelector('[aria-label="Rolando dados"]')).not.toBeNull();
  expect(container.querySelector("[data-roll-countdown]")?.textContent).toBe("0");
  act(() => vi.advanceTimersByTime(2200));
  expect(container.querySelector('[data-pointer="dice-term"] > span')?.textContent).toBe("3");
  expect(container.querySelector("[data-turn-player]")?.textContent).toBe("Turno 4 · Azul");
  expect(container.querySelector("[data-roll-countdown]")?.textContent).toBe("3");
});

it("preserves the normal game's dice result and completion timing", () => {
  const complete = vi.fn();
  act(() => root.render(<DiceAnimation targetValue={[2, 4]} onComplete={complete} />));
  act(() => vi.advanceTimersByTime(799)); expect(container.querySelector('[aria-label="Rolando dados"]')).not.toBeNull();
  act(() => vi.advanceTimersByTime(1)); expect(container.querySelector('[aria-label="Resultado dos dados"]')?.textContent).toContain("6");
  act(() => vi.advanceTimersByTime(1399)); expect(complete).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1)); expect(complete).toHaveBeenCalledOnce();
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
