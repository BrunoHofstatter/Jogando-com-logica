import { describe, expect, it } from "vitest";
import { applyNavigationIntent, createNavigationState, findSafePath, gridNeighbors, type ComponentId, type NavigationState } from "./navigation";
import { applyBombLevelIntent, createBombLevel } from "./levels";
import { projectBombLevel } from "./levelViews";
import { getBombLevel } from "./levelCatalog";
import type { SharedViewState } from "./multiplayer/protocol";

function rng(seed: number) { let state = seed; return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; }; }
function moveGrid(state: NavigationState, to: number) { return applyNavigationIntent(state, "bomb", { type: "move_probe", to, revision: state.gridRevision }); }
function moveEnergy(state: NavigationState, route: number) { return applyNavigationIntent(state, "bomb", { type: "move_energy", route, step: state.energyStep + 1, revision: state.energyRevision }); }
function totals(state: NavigationState) { return state.routes.map((route) => route.reduce<number>((sum, id) => sum + state.componentValues[id], 0)); }
function finishGrid(state: NavigationState) { const path = findSafePath(state.maps[state.correctMap].dangers, state.exitRow)!; for (const to of path.slice(1)) moveGrid(state, to); }
function finishEnergy(state: NavigationState) { const route = totals(state).indexOf(state.initialEnergy); for (let step = 0; step <= state.routes[route].length; step += 1) moveEnergy(state, route); }

describe("Navigation generation", () => {
  it("generates fair maps and uniquely affordable cables across 600 seeds", () => {
    const exits = new Set<number>(), correctMaps = new Set<number>(), routeLengths = new Set<number>(), solutions = new Set<number>();
    for (let seed = 1; seed <= 600; seed += 1) {
      const state = createNavigationState(rng(seed * 997));
      exits.add(state.exitRow); correctMaps.add(state.correctMap);
      expect(state.maps).toHaveLength(3);
      expect(new Set(state.maps.map((map) => map.markers.join())).size).toBe(3);
      expect(new Set(state.maps.map((map) => map.dangers.join())).size).toBe(3);
      for (const map of state.maps) {
        expect(new Set(map.markers).size).toBe(3);
        expect(map.markers.every((slot) => slot >= 0 && slot < 6)).toBe(true);
        expect(map.dangers).toHaveLength(3);
        const path = findSafePath(map.dangers, state.exitRow)!;
        expect(path).not.toBeNull();
        expect(path.length).toBeGreaterThanOrEqual(6);
        expect(path.length).toBeLessThanOrEqual(8);
      }
      expect(findSafePath(state.maps.flatMap((map) => map.dangers), state.exitRow)).toBeNull();
      expect(state.componentValues.every((value) => value >= 1 && value <= 9)).toBe(true);
      expect(new Set(state.componentValues).size).toBe(3);
      expect(state.equations.filter((eq) => eq.operator === "-")).toHaveLength(1);
      state.equations.forEach((eq, index) => {
        const left = eq.left === "previous" ? state.componentValues[index - 1] : eq.left;
        expect(eq.operator === "+" ? left + eq.right : left - eq.right).toBe(state.componentValues[index]);
        expect(eq.right).toBeGreaterThanOrEqual(1); expect(eq.right).toBeLessThanOrEqual(4);
      });
      const costs = totals(state);
      solutions.add(costs.indexOf(state.initialEnergy));
      expect(new Set(costs).size).toBe(3);
      expect(costs.filter((cost) => cost <= state.initialEnergy)).toHaveLength(1);
      expect(Math.max(...costs) - Math.min(...costs)).toBeLessThanOrEqual(3);
      state.routes.forEach((route) => {
        routeLengths.add(route.length);
        expect(route.length).toBeGreaterThanOrEqual(2); expect(route.length).toBeLessThanOrEqual(4);
        const prefix = route.slice(0, -1).reduce<number>((sum, id) => sum + state.componentValues[id], 0);
        expect(prefix).toBeLessThanOrEqual(state.initialEnergy);
      });
    }
    expect([...exits].sort()).toEqual([0, 1, 2]);
    expect(correctMaps.size).toBe(3); expect(solutions.size).toBe(3);
    expect([...routeLengths].sort()).toEqual([2, 3, 4]);
  });

  it("terminates and stays valid even with degenerate random sources", () => {
    for (const value of [0, .5, .999999]) {
      const state = createNavigationState(() => value);
      expect(totals(state).filter((total) => total <= state.initialEnergy)).toHaveLength(1);
      expect(findSafePath(state.maps[state.correctMap].dangers, state.exitRow)).not.toBeNull();
    }
  });
});

describe("Navigation actions", () => {
  it("supports both completion orders and locks completed modules", () => {
    for (const energyFirst of [true, false]) {
      const state = createNavigationState(rng(42));
      (energyFirst ? finishEnergy : finishGrid)(state);
      expect(state.completedSections).toHaveLength(1);
      (energyFirst ? finishGrid : finishEnergy)(state);
      expect([...state.completedSections].sort()).toEqual([1, 2]);
      expect(moveGrid(state, 3).accepted).toBe(false);
      expect(moveEnergy(state, 0).accepted).toBe(false);
    }
  });

  it("resets a dangerous grid move without losing the other module's progress", () => {
    const state = createNavigationState(rng(8));
    finishEnergy(state);
    const hazards = state.maps[state.correctMap].dangers;
    let target: number | undefined;
    // A reachable safe cell bordering a danger must exist.
    for (let cell = 0; cell < 9; cell += 1) {
      if (hazards.includes(cell)) continue;
      const queue = [[-1]], visited = new Set([-1]);
      for (const path of queue) {
        const last = path[path.length - 1];
        if (last === cell) {
          target = gridNeighbors(cell, state.exitRow).find((next) => hazards.includes(next));
          if (target !== undefined) for (const to of path.slice(1)) moveGrid(state, to);
          break;
        }
        for (const next of gridNeighbors(last, state.exitRow)) if (next !== 9 && !hazards.includes(next) && !visited.has(next)) { visited.add(next); queue.push([...path, next]); }
      }
      if (target !== undefined) break;
    }
    expect(target).toBeDefined();
    const revision = state.gridRevision;
    expect(moveGrid(state, target!).mistake).toBe(true);
    expect(state.gridPosition).toBe(-1); expect(state.gridVisited).toEqual([]);
    expect(state.completedSections).toEqual([2]);
    expect(applyNavigationIntent(state, "bomb", { type: "move_probe", to: 3, revision }).accepted).toBe(false);
  });

  it("commits a cable, rejects skips, fails at its last component, and restores energy", () => {
    const state = createNavigationState(rng(20));
    finishGrid(state);
    const expensive = totals(state).findIndex((cost) => cost > state.initialEnergy);
    expect(applyNavigationIntent(state, "bomb", { type: "move_energy", route: expensive, step: 1, revision: 0 }).accepted).toBe(false);
    expect(moveEnergy(state, expensive).mistake).toBe(false);
    expect(moveEnergy(state, (expensive + 1) % 3).accepted).toBe(false);
    for (let step = 1; step < state.routes[expensive].length - 1; step += 1) expect(moveEnergy(state, expensive).mistake).toBe(false);
    expect(moveEnergy(state, expensive).mistake).toBe(true);
    expect(state.energy).toBe(state.initialEnergy); expect(state.activeRoute).toBeNull(); expect(state.energyStep).toBe(-1);
    expect(state.completedSections).toEqual([1]);
  });

  it("accepts leftover energy at the terminal", () => {
    const state = createNavigationState(rng(23));
    state.energy += 1;
    finishEnergy(state);
    expect(state.completedSections).toEqual([2]); expect(state.energy).toBe(1);
  });

  it("validates manual chains without heart penalties or bomb movement gates", () => {
    const state = createNavigationState(rng(70));
    expect(applyNavigationIntent(state, "manual", { type: "solve_component", component: 1, value: 5, revision: 0 }).accepted).toBe(false);
    const wrong = applyNavigationIntent(state, "manual", { type: "solve_component", component: 0, value: 99, revision: 0 });
    expect(wrong).toEqual({ accepted: true, mistake: false, completed: false });
    expect(state.wrongEquation).toBe(0); expect(state.lastMistake).toBeNull();
    expect(moveGrid(state, 3).accepted).toBe(true);
    for (const component of [0, 1, 2] as ComponentId[]) {
      const result = applyNavigationIntent(state, "manual", { type: "solve_component", component, value: state.componentValues[component], revision: state.equationRevision });
      expect(result.mistake).toBe(false);
      expect(state.solvedValues[component]).toBe(state.componentValues[component]);
    }
  });

  it("rejects malformed and wrong-role actions without mutation", () => {
    const state = createNavigationState(rng(90)), before = JSON.stringify(state);
    for (const intent of [null, {}, { type: "move_probe", to: 8, revision: 0 }, { type: "move_probe", to: 3.1, revision: 0 }, { type: "move_energy", route: 7, step: 0, revision: 0 }]) expect(applyNavigationIntent(state, "bomb", intent).accepted).toBe(false);
    expect(applyNavigationIntent(state, "manual", { type: "move_probe", to: 3, revision: 0 }).accepted).toBe(false);
    expect(applyNavigationIntent(state, "bomb", { type: "solve_component", component: 0, value: 4, revision: 0 }).accepted).toBe(false);
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe("Multi-level boundary", () => {
  it("keeps secret puzzle fields out of both role payloads", () => {
    const level = createBombLevel(3, rng(10));
    const shared: SharedViewState = { roundId: "test", phase: "playing", lives: 3, hintsEnabled: true, countdownEndsAt: null, timerEndsAt: 252000, replayCountdownEndsAt: null, replayVotes: [], completedSections: [], eventId: 0, mistake: null, resultReason: null };
    const bomb = projectBombLevel(level, "bomb", shared), manual = projectBombLevel(level, "manual", shared);
    for (const key of ["correctMap", "componentValues", "equations", "maps", "solvedValues"]) expect(bomb).not.toHaveProperty(key);
    for (const key of ["correctMap", "componentValues", "routes", "energy", "gridPosition", "markers"]) expect(manual).not.toHaveProperty(key);
    expect(getBombLevel(3).durationSeconds).toBe(252);
  });
  it("retains Level 1 and rejects navigation intents there", () => {
    const level = createBombLevel(1, rng(1));
    expect(applyBombLevelIntent(level, "bomb", { type: "move_probe", to: 3, revision: 0 }).accepted).toBe(false);
    expect(applyBombLevelIntent(level, "bomb", { type: "select_operator", row: 0, value: "+" }).accepted).toBe(true);
    expect(applyBombLevelIntent(level, "manual", { type: "select_operator", row: 1, value: "-" }).accepted).toBe(false);
  });
});
