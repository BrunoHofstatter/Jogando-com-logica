// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BombPanel, ConfirmOverlay, ManualPanel, NumericEquation, OperatorEquation } from "./BombGamePage";
import { createLevel1State } from "../Logic/level1";
import { projectBombLevel } from "../Logic/levelViews";
import type { BombViewState, ManualViewState, SharedViewState } from "../Logic/multiplayer/protocol";

let container: HTMLDivElement, root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.useFakeTimers();
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.useRealTimers(); vi.unstubAllGlobals(); });
function render(node: ReactNode) { act(() => root.render(node)); }
function click(button: Element) { act(() => (button as HTMLElement).click()); }
function advance(ms: number) { act(() => vi.advanceTimersByTime(ms)); }
function type(value: string) {
  act(() => {
    const input = container.querySelector("input")!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const shared: SharedViewState = { roundId: "test", phase: "playing", lives: 3, hintsEnabled: true, countdownEndsAt: null, timerEndsAt: 180000, replayCountdownEndsAt: null, replayVotes: [], completedSections: [], eventId: 0, mistake: null, resultReason: null };

it("automatically submits two seconds after the last digit, including zero", () => {
  const submit = vi.fn();
  render(<NumericEquation row={0} target="A + B" answer={null} eventId={0} mistakeRow={null} disabled={false} submit={submit} />);
  type("1"); advance(1500); type("12"); advance(1999); expect(submit).not.toHaveBeenCalled();
  advance(1); expect(submit).toHaveBeenLastCalledWith({ type: "submit_numeric_answer", row: 0, value: 12 });
  type("0"); advance(2000); expect(submit).toHaveBeenLastCalledWith({ type: "submit_numeric_answer", row: 0, value: 0 });
});

it.each(["disconnect", "solved", "unmount"])("cancels a numeric pending submission on %s", (reason) => {
  const submit = vi.fn();
  const props = { row: 0 as const, target: "A + B", answer: null, eventId: 0, mistakeRow: null, disabled: false, submit };
  render(<NumericEquation {...props} />); type("12"); advance(1000);
  if (reason === "unmount") render(null);
  else render(<NumericEquation {...props} disabled={reason === "disconnect"} answer={reason === "solved" ? 12 : null} />);
  advance(3000); expect(submit).not.toHaveBeenCalled();
});

it("only clears the mistaken numeric row and exposes its feedback", () => {
  const props = { row: 0 as const, target: "A + B", answer: null, eventId: 0, mistakeRow: null, disabled: false, submit: vi.fn() };
  render(<NumericEquation {...props} />); type("12");
  render(<NumericEquation {...props} eventId={1} mistakeRow={1} />);
  expect(container.querySelector("input")!.value).toBe("12");
  render(<NumericEquation {...props} eventId={2} mistakeRow={0} />);
  expect(container.querySelector("input")!.value).toBe("");
  expect(container.querySelector("input")!.getAttribute("aria-invalid")).toBe("true");
  expect(container.querySelector('[role="status"]')!.textContent).toContain("Resposta incorreta");
  advance(3000); expect(props.submit).not.toHaveBeenCalled();
});

it("pauses operator submission while reopened, then restarts for the new choice", () => {
  const submit = vi.fn();
  render(<OperatorEquation row={0} equation={{ left: "A", right: "2", result: 5 }} answer={null} eventId={0} mistakeRow={null} disabled={false} submit={submit} />);
  const trigger = container.querySelector("button")!;
  click(trigger); click(container.querySelectorAll("button")[1]);
  expect(document.activeElement).toBe(trigger);
  advance(1500); click(trigger); advance(4000); expect(submit).not.toHaveBeenCalled();
  click(container.querySelectorAll("button")[2]); advance(1999); expect(submit).not.toHaveBeenCalled();
  advance(1); expect(submit).toHaveBeenCalledExactlyOnceWith({ type: "select_operator", row: 0, value: "-" });
});

it("cancels operator timers and closes the menu when controls disconnect", () => {
  const props = { row: 0 as const, equation: { left: "A", right: "2", result: 5 }, answer: null, eventId: 0, mistakeRow: null, disabled: false, submit: vi.fn() };
  render(<OperatorEquation {...props} />);
  click(container.querySelector("button")!); click(container.querySelectorAll("button")[1]);
  render(<OperatorEquation {...props} disabled />); advance(3000);
  expect(props.submit).not.toHaveBeenCalled(); expect(container.querySelector("button")!.disabled).toBe(true);
  expect(container.querySelectorAll("button")).toHaveLength(1);
});

it("disables all bomb controls on disconnect and ordering controls while awaiting a reply", () => {
  const state = projectBombLevel({ id: 1, state: createLevel1State() }, "bomb", shared) as BombViewState;
  render(<BombPanel state={state} seconds={100} submit={vi.fn()} disconnected />);
  expect([...container.querySelectorAll<HTMLInputElement | HTMLButtonElement>("input, button")].every((control) => control.disabled)).toBe(true);
  render(<BombPanel state={state} seconds={100} submit={vi.fn()} orderingPending />);
  expect([...container.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')].every((control) => control.disabled)).toBe(true);
  expect(container.querySelector("input")!.disabled).toBe(false);
});

it("does not highlight calculations or show educational hints with hints disabled", () => {
  const state = projectBombLevel({ id: 1, state: createLevel1State() }, "manual", { ...shared, mistake: { section: 2, row: 0, value: null } }) as ManualViewState;
  render(<ManualPanel state={state} />);
  expect([...container.querySelectorAll("article")].filter((a) => a.className)).toHaveLength(2);
  render(<ManualPanel state={{ ...state, hintsEnabled: false }} />);
  expect([...container.querySelectorAll("article")].filter((a) => a.className)).toHaveLength(0);
  expect(container.querySelector('[role="status"]')).toBeNull();
});

it("focuses the dialog, wraps Tab, handles Escape, and restores the trigger", () => {
  const outside = document.createElement("button"); document.body.append(outside); outside.focus();
  const cancel = vi.fn();
  render(<ConfirmOverlay title="Sair?" text="A sala será encerrada." confirm="Sair" onCancel={cancel} onConfirm={vi.fn()} />);
  const dialog = container.querySelector('[role="dialog"]')!;
  const buttons = dialog.querySelectorAll("button");
  expect(document.activeElement).toBe(buttons[0]);
  act(() => buttons[0].dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true })));
  expect(document.activeElement).toBe(buttons[2]);
  act(() => buttons[2].dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true })));
  expect(document.activeElement).toBe(buttons[0]);
  act(() => buttons[0].dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(cancel).toHaveBeenCalledOnce();
  render(null); expect(document.activeElement).toBe(outside); outside.remove();
});
