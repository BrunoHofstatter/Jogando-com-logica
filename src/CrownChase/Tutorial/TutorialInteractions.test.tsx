// @vitest-environment jsdom
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import TutorialGate from "./TutorialGate";
import TutorialPage from "../Pages/tutorialPage";
import Board from "../Components/board-component";
import { createInitialState } from "../Logic/v2";
import { ROUTES } from "../../routes";
import { allowedDifficulty, menuReturn, readReturn, saveReturn, validateReturn } from "./navigation";

const flags = vi.hoisted(() => ({ online: false, unseen: true, mounted: vi.fn() }));
vi.mock("../Hooks/useCrownChaseMultiplayer", () => ({ hasActiveCrownChaseMultiplayerSession: () => flags.online }));
vi.mock("../../Shared/Tutorial/tutorialHistory", async importOriginal => {
  const original = await importOriginal<typeof import("../../Shared/Tutorial/tutorialHistory")>();
  return { ...original, unseenLessons: (ids: unknown[]) => flags.unseen ? ids : [], recordTutorialHistory: () => { flags.unseen = false; } };
});

let container: HTMLDivElement, root: Root;
beforeEach(() => {
  flags.online = false; flags.unseen = true; flags.mounted.mockClear();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.useFakeTimers(); localStorage.clear(); sessionStorage.clear();
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const button = (text: string) => [...container.querySelectorAll<HTMLButtonElement>("button")].find(node => node.textContent === text)!;
const click = (node: HTMLElement) => { expect(node).toBeTruthy(); act(() => node.click()); };
const cell = (r: number, c: number) => container.querySelector<HTMLElement>(`[data-square="${String.fromCharCode(97 + c)}${r + 1}"]`)!;
const advance = () => act(() => vi.runAllTimers());
function NormalDestination() {
  const location = useLocation();
  flags.mounted();
  return <div data-testid="normal">{location.pathname}:{location.state?.difficulty ?? ""}</div>;
}
function renderEntry(path = ROUTES.CROWN_CHASE_TUTORIAL as string, state?: object) {
  act(() => root.render(<StrictMode><MemoryRouter initialEntries={[{ pathname: path, state }]}>
    <Routes>
      <Route path={ROUTES.CROWN_CHASE_TUTORIAL} element={<TutorialPage />} />
      {[ROUTES.CROWN_CHASE_GAME, ROUTES.CROWN_CHASE_AI, ROUTES.CROWN_CHASE_MP_LOBBY].map(route => <Route key={route} path={route} element={<TutorialGate><NormalDestination /></TutorialGate>} />)}
      <Route path={ROUTES.CROWN_CHASE_RULES} element={<NormalDestination />} />
    </Routes>
  </MemoryRouter></StrictMode>));
}
const move = (r: number, c: number, r2: number, c2: number) => { click(cell(r, c)); click(cell(r2, c2)); };

it.each([ROUTES.CROWN_CHASE_GAME, ROUTES.CROWN_CHASE_AI, ROUTES.CROWN_CHASE_MP_LOBBY])("gates %s before normal components mount and skip returns to that mode", path => {
  localStorage.setItem("game_progress_crownchase", "3");
  renderEntry(path, { difficulty: 3 });
  expect(flags.mounted).not.toHaveBeenCalled();
  expect(button("Começar")).toBeUndefined();
  expect(cell(2, 2).getAttribute("aria-pressed")).toBe("true");
  click(button("Pular"));
  expect(container.querySelector('[data-testid="normal"]')?.textContent).toBe(`${path}:${path === ROUTES.CROWN_CHASE_AI ? 3 : ""}`);
  advance(); // Drain jsdom/React work as well as any stale lesson callbacks.
  expect(vi.getTimerCount()).toBe(0);
});

it("bypasses onboarding for an existing online session, including direct practice entry", () => {
  flags.online = true;
  renderEntry();
  expect(container.querySelector('[data-testid="normal"]')?.textContent).toContain(ROUTES.CROWN_CHASE_MP_LOBBY);
  expect(button("Começar")).toBeUndefined();
});

it("completed history enters the normal game directly", () => {
  flags.unseen = false;
  renderEntry(ROUTES.CROWN_CHASE_GAME);
  expect(flags.mounted).toHaveBeenCalled();
  expect(button("Começar")).toBeUndefined();
});

function reachKingExercise() {
  click(cell(1, 1)); advance();
  click(cell(0, 2)); advance();
  click(cell(3, 2)); advance();
  click(cell(3, 4)); advance();
  expect(container.textContent).toContain("O rei");
  click(button("Continuar"));
}

it("starts without confirmation, highlights movement words, and uses the normal outer frame", () => {
  renderEntry();
  expect(button("Começar")).toBeUndefined();
  expect(cell(2, 2).getAttribute("aria-pressed")).toBe("true");
  expect(container.querySelector('[data-tutorial-popup="instruction"] strong')?.textContent).toBe("qualquer direção.");
  expect(container.querySelector('[data-practice-board]')?.className).toContain("boardWrapper");
  expect(container.querySelectorAll('[data-piece]')).toHaveLength(1);
});

it("completes all exercises in StrictMode, shows the normal starting board, and returns to the requested mode", () => {
  renderEntry(ROUTES.CROWN_CHASE_AI, { difficulty: 1 });
  reachKingExercise();
  expect(container.querySelector('[data-tutorial-popup="consequence"]')?.textContent).toContain("você perde");
  click(cell(0, 4)); advance();
  expect(container.textContent).toContain("Agora é sua vez de jogar");
  expect(container.querySelectorAll('[data-piece]')).toHaveLength(12);
  expect(flags.mounted).not.toHaveBeenCalled();
  expect(localStorage.getItem("game_progress_crownchase")).toBeNull();
  click(button("Jogar"));
  expect(container.textContent).toContain(ROUTES.CROWN_CHASE_AI);
});

it("keeps the jumped piece for three seconds and counts only foreground reading time", () => {
  renderEntry();
  click(cell(1, 1)); advance(); click(cell(0, 2)); advance(); click(cell(3, 2)); advance();
  click(cell(3, 4)); act(() => vi.advanceTimersByTime(350));
  expect(cell(3, 3).dataset.piece).toBe("red-jumper");
  expect(container.textContent).toContain("fica no tabuleiro");
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  act(() => vi.advanceTimersByTime(10000));
  expect(container.textContent).toContain("fica no tabuleiro");
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  act(() => vi.advanceTimersByTime(3000));
  expect(button("Continuar")).toBeTruthy();
  expect(container.querySelectorAll('[data-piece]')).toHaveLength(2);
});

it("shows final-exercise retry feedback over the board, then removes it and returns the piece automatically", () => {
  renderEntry(); reachKingExercise();
  click(cell(1, 2));
  const popup = container.querySelector('[data-tutorial-popup="feedback"]')!;
  expect(popup.textContent).toBe("Tente capturar o rei vermelho.");
  expect(container.querySelector('[data-practice-board]')?.contains(popup)).toBe(true);
  expect(cell(1, 2).dataset.piece).toBe("blue-jumper");
  expect(button("Tentar de novo")).toBeUndefined();
  act(() => vi.advanceTimersByTime(2000));
  expect(container.querySelector('[data-tutorial-popup="feedback"]')).toBeNull();
  expect(cell(0, 2).dataset.piece).toBe("blue-jumper");
  act(() => vi.advanceTimersByTime(350));
  expect(cell(0, 2).getAttribute("aria-pressed")).toBe("true");
  expect(document.activeElement).toBe(cell(0, 2));
});

it("escalates gold destinations on attempt two and extra instructions on attempt three", () => {
  renderEntry(); reachKingExercise();
  for (let i = 1; i <= 3; i++) {
    click(cell(0, 3));
    expect(container.textContent).toContain("só captura o rei");
    advance();
    expect(cell(0, 3).dataset.piece).toBe("red-killer");
    if (i === 1) expect(cell(0, 4).getAttribute("aria-label")).not.toContain("objetivo marcado");
    else expect(cell(0, 4).getAttribute("aria-label")).toContain("objetivo marcado");
  }
  expect(container.textContent).toContain("Vá até a casa dourada");
  click(cell(0, 4)); advance();
  expect(button("Repetir tutorial")).toBeTruthy();
  click(button("Repetir tutorial"));
  expect(container.querySelectorAll('[data-piece]')).toHaveLength(1);
  expect(cell(2, 2).getAttribute("aria-pressed")).toBe("true");
});

it("accepts keyboard destinations and restores preselection after brief illegal feedback", () => {
  renderEntry();
  const key = (node: HTMLElement) => act(() => node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  key(cell(0, 0));
  expect(container.textContent).toContain("só uma casa");
  advance();
  expect(cell(2, 2).getAttribute("aria-pressed")).toBe("true");
  key(cell(1, 1)); advance();
  expect(cell(0, 2).dataset.piece).toBe("red-killer");
});

it("skipping during feedback cancels the restoration", () => {
  renderEntry(); reachKingExercise(); click(cell(1, 2));
  click(button("Pular")); advance();
  expect(container.textContent).toContain(ROUTES.CROWN_CHASE_RULES);
  expect(vi.getTimerCount()).toBe(0);
});

it("ordinary board interaction still commits a move and local interactionLocked prevents it", () => {
  const changed = vi.fn();
  const state = createInitialState();
  act(() => root.render(<Board gameState={state} onGameStateChange={changed} interactionLocked />));
  move(3, 0, 2, 1); expect(changed).not.toHaveBeenCalled();
  act(() => root.render(<Board gameState={state} onGameStateChange={changed} />));
  move(3, 0, 2, 1);
  expect(changed).toHaveBeenCalledOnce();
  expect(changed.mock.calls[0][0].currentPlayer).toBe(0);
});

it("validates destinations, preserves refresh context only for its own entry, and tolerates storage failures", () => {
  expect(validateReturn({ destination: "https://example.com" })).toEqual(menuReturn);
  expect(allowedDifficulty(4)).toBe(1);
  localStorage.setItem("game_progress_crownchase", "3");
  expect(allowedDifficulty(3)).toBe(3);
  const context = { destination: ROUTES.CROWN_CHASE_AI, difficulty: 3 };
  saveReturn(context, "entry-one");
  expect(readReturn(null, "entry-one")).toEqual(context);
  expect(readReturn(null, "entry-two")).toEqual(menuReturn);
  expect(readReturn({ tutorialReturn: context }, "refreshed")).toEqual(context);
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  expect(readReturn(null, "entry-one")).toEqual(menuReturn);
  expect(() => saveReturn(context, "entry-one")).not.toThrow();
});
