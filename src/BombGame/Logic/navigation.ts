import type { BombRole, IntentResult, MistakeTarget, SectionId } from "./level1";

export type ComponentId = 0 | 1 | 2;
export type MarkerPositions = [number, number, number];
export interface NavigationMap { markers: MarkerPositions; dangers: number[] }
export interface ComponentEquation { left: number | "previous"; operator: "+" | "-"; right: number }
export interface NavigationState {
  exitRow: number;
  maps: NavigationMap[];
  correctMap: number;
  gridPosition: number;
  gridVisited: number[];
  gridRevision: number;
  componentValues: [number, number, number];
  equations: ComponentEquation[];
  solvedValues: [number | null, number | null, number | null];
  equationRevision: number;
  wrongEquation: ComponentId | null;
  routes: ComponentId[][];
  initialEnergy: number;
  energy: number;
  activeRoute: number | null;
  energyStep: number;
  energyRevision: number;
  completedSections: SectionId[];
  lastEventId: number;
  lastMistake: MistakeTarget | null;
}

export type NavigationIntent =
  | { type: "move_probe"; to: number; revision: number }
  | { type: "move_energy"; route: number; step: number; revision: number }
  | { type: "solve_component"; component: ComponentId; value: number; revision: number };

// Internal cells are row-major 0..8; the two external ports are -1 and 9.
export function gridNeighbors(position: number, exitRow: number): number[] {
  if (position === -1) return [3];
  if (position === 9) return [];
  if (!Number.isInteger(position) || position < 0 || position > 8) return [];
  const row = Math.floor(position / 3), column = position % 3;
  const result: number[] = [];
  if (row > 0) result.push(position - 3);
  if (row < 2) result.push(position + 3);
  if (column > 0) result.push(position - 1);
  if (column < 2) result.push(position + 1);
  if (position === 3) result.push(-1);
  if (row === exitRow && column === 2) result.push(9);
  return result;
}

export function findSafePath(dangers: readonly number[], exitRow: number): number[] | null {
  const queue: number[][] = [[-1]];
  const visited = new Set([-1]);
  for (let head = 0; head < queue.length; head += 1) {
    const path = queue[head];
    for (const next of gridNeighbors(path[path.length - 1], exitRow)) {
      if (dangers.includes(next) || visited.has(next)) continue;
      if (next === 9) return [...path, next];
      visited.add(next);
      queue.push([...path, next]);
    }
  }
  return null;
}

function dangerLayouts(exitRow: number): number[][] {
  const layouts: number[][] = [];
  for (let a = 0; a < 7; a += 1) for (let b = a + 1; b < 8; b += 1) for (let c = b + 1; c < 9; c += 1) {
    const dangers = [a, b, c];
    const path = findSafePath(dangers, exitRow);
    // Four to six internal plates, with an actual detour for the middle exit.
    if (path && path.length >= 6 && path.length <= 8) layouts.push(dangers);
  }
  return layouts;
}

function createMaps(exitRow: number, random: () => number): NavigationMap[] {
  const markers = shuffled([0, 1, 2, 3, 4, 5], random).slice(0, 3) as MarkerPositions;
  const swapped = [...markers] as MarkerPositions;
  const [first, second] = shuffled([0, 1, 2], random);
  [swapped[first], swapped[second]] = [swapped[second], swapped[first]];
  // Adjacent positions around the outside frame, never a corner shared by cells.
  const perimeter = [0, 1, 2, 5, 4, 3];
  const moves = markers.flatMap((slot, index) => {
    const at = perimeter.indexOf(slot);
    return [perimeter[(at + 1) % 6], perimeter[(at + 5) % 6]]
      .filter((next) => !markers.includes(next)).map((next) => ({ index, next }));
  });
  const moved = [...markers] as MarkerPositions;
  const move = choose(moves, random);
  moved[move.index] = move.next;
  const arrangements = shuffled([markers, swapped, moved], random);
  const layouts = shuffled(dangerLayouts(exitRow), random);
  // Prefer candidates with no universal safe route, so matching the marks matters.
  let selected = layouts.slice(0, 3);
  outer: for (let a = 0; a < layouts.length - 2; a += 1) {
    for (let b = a + 1; b < layouts.length - 1; b += 1) {
      for (let c = b + 1; c < layouts.length; c += 1) {
        if (!findSafePath([...layouts[a], ...layouts[b], ...layouts[c]], exitRow)) {
          selected = [layouts[a], layouts[b], layouts[c]];
          break outer;
        }
      }
    }
  }
  return arrangements.map((positions, index) => ({ markers: positions, dangers: selected[index] }));
}

type Counts = [number, number, number];
function routeOptions(values: readonly number[]) {
  const options: { counts: Counts; total: number }[] = [];
  for (let a = 0; a <= 4; a += 1) for (let b = 0; b <= 4; b += 1) for (let c = 0; c <= 4; c += 1) {
    if (a + b + c < 2 || a + b + c > 4) continue;
    options.push({ counts: [a, b, c], total: a * values[0] + b * values[1] + c * values[2] });
  }
  return options;
}

function createRoutes(values: readonly number[], random: () => number): { routes: ComponentId[][]; budget: number } | null {
  const options = shuffled(routeOptions(values), random);
  const comparable = (a: Counts, b: Counts) => a.every((count, index) => count <= b[index]) || b.every((count, index) => count <= a[index]);
  for (const cheapest of options) {
    const higher = options.filter((candidate) => candidate.total > cheapest.total && candidate.total <= cheapest.total + 3 && !comparable(cheapest.counts, candidate.counts));
    for (let a = 0; a < higher.length; a += 1) for (let b = a + 1; b < higher.length; b += 1) {
      if (higher[a].total === higher[b].total || comparable(higher[a].counts, higher[b].counts)) continue;
      const choices = [cheapest, higher[a], higher[b]];
      if (!values.every((_, index) => choices.some((option) => option.counts[index] > 0))) continue;
      const routes = choices.map(({ counts, total }) => {
        const route = shuffled(counts.flatMap((count, index) => Array<ComponentId>(count).fill(index as ComponentId)), random);
        if (total > cheapest.total) {
          // Put a large enough component last when possible: run out on the final tile.
          const last = route.findIndex((component) => values[component] >= total - cheapest.total);
          if (last >= 0) route.push(route.splice(last, 1)[0]);
        }
        return route;
      });
      return { routes: shuffled(routes, random), budget: cheapest.total };
    }
  }
  return null;
}

function createEnergyPuzzle(random: () => number) {
  // Bounded attempts; even a constant RNG must produce a complete puzzle.
  for (let attempt = 0; attempt < 64; attempt += 1) {
    const left = integer(1, 4, random), right = integer(1, 4, random);
    const subtractSecond = random() < .5;
    const secondConstant = integer(1, 4, random), thirdConstant = integer(1, 4, random);
    const first = left + right;
    const second = first + (subtractSecond ? -secondConstant : secondConstant);
    const third = second + (subtractSecond ? thirdConstant : -thirdConstant);
    const values: [number, number, number] = [first, second, third];
    if (new Set(values).size !== 3 || values.some((value) => value < 1 || value > 9)) continue;
    const paths = createRoutes(values, random);
    if (!paths) continue;
    const equations: ComponentEquation[] = [
      { left, operator: "+", right },
      { left: "previous", operator: subtractSecond ? "-" : "+", right: secondConstant },
      { left: "previous", operator: subtractSecond ? "+" : "-", right: thirdConstant },
    ];
    return { values, equations, ...paths };
  }
  const values: [number, number, number] = [4, 3, 5];
  const equations: ComponentEquation[] = [
    { left: 2, operator: "+", right: 2 },
    { left: "previous", operator: "-", right: 1 },
    { left: "previous", operator: "+", right: 2 },
  ];
  return { values, equations, routes: shuffled<ComponentId[]>([[0, 2], [1, 1, 0], [1, 1, 2]], random), budget: 9 };
}

export function createNavigationState(random: () => number = Math.random): NavigationState {
  const exitRow = integer(0, 2, random);
  const maps = createMaps(exitRow, random);
  // Choose truth AFTER constructing all candidates, avoiding an "original map" tell.
  const correctMap = integer(0, 2, random);
  const energy = createEnergyPuzzle(random);
  return {
    exitRow, maps, correctMap, gridPosition: -1, gridVisited: [], gridRevision: 0,
    componentValues: energy.values, equations: energy.equations, solvedValues: [null, null, null],
    equationRevision: 0, wrongEquation: null, routes: energy.routes, initialEnergy: energy.budget,
    energy: energy.budget, activeRoute: null, energyStep: -1, energyRevision: 0,
    completedSections: [], lastEventId: 0, lastMistake: null,
  };
}

export function applyNavigationIntent(state: NavigationState, role: BombRole, raw: unknown): IntentResult {
  const rejected = { accepted: false, mistake: false, completed: false };
  if (!raw || typeof raw !== "object") return rejected;
  const intent = raw as Record<string, unknown>;
  if (!Number.isInteger(intent.revision)) return rejected;

  if (intent.type === "solve_component") {
    if (role !== "manual" || intent.revision !== state.equationRevision || state.completedSections.includes(2)) return rejected;
    const component = intent.component;
    if (component !== 0 && component !== 1 && component !== 2) return rejected;
    if (!Number.isInteger(intent.value) || (intent.value as number) < 0 || (intent.value as number) > 99) return rejected;
    if (state.solvedValues[component] !== null || (component > 0 && state.solvedValues[component - 1] === null)) return rejected;
    state.equationRevision += 1;
    state.lastEventId += 1;
    state.wrongEquation = intent.value === state.componentValues[component] ? null : component;
    if (state.wrongEquation === null) state.solvedValues[component] = state.componentValues[component];
    return { accepted: true, mistake: false, completed: false };
  }
  if (role !== "bomb") return rejected;
  if (intent.type === "move_probe") {
    if (state.completedSections.includes(1) || intent.revision !== state.gridRevision || !Number.isInteger(intent.to)) return rejected;
    const to = intent.to as number;
    if (!gridNeighbors(state.gridPosition, state.exitRow).includes(to)) return rejected;
    state.gridRevision += 1;
    if (state.maps[state.correctMap].dangers.includes(to)) {
      state.gridPosition = -1;
      state.gridVisited = [];
      return mistake(state, 1);
    }
    state.gridPosition = to;
    if (to >= 0 && to < 9 && !state.gridVisited.includes(to)) state.gridVisited.push(to);
    if (to === 9) state.completedSections.push(1);
    return accepted(state);
  }
  if (intent.type === "move_energy") {
    if (state.completedSections.includes(2) || intent.revision !== state.energyRevision) return rejected;
    const route = intent.route, step = intent.step;
    if (route !== 0 && route !== 1 && route !== 2) return rejected;
    if (!Number.isInteger(step) || (step as number) < 0 || (step as number) > state.routes[route].length) return rejected;
    if (state.activeRoute !== null && state.activeRoute !== route) return rejected;
    if (step !== state.energyStep + 1) return rejected;
    state.energyRevision += 1;
    if (step === state.routes[route].length) {
      // Arrival accepts any nonnegative remaining energy, not an exact-zero condition.
      state.energyStep = step;
      state.completedSections.push(2);
      return accepted(state);
    }
    const cost = state.componentValues[state.routes[route][step as number]];
    if (cost > state.energy) {
      state.energy = state.initialEnergy;
      state.activeRoute = null;
      state.energyStep = -1;
      return mistake(state, 2);
    }
    state.activeRoute = route;
    state.energyStep = step as number;
    state.energy -= cost;
    return accepted(state);
  }
  return rejected;
}

function accepted(state: NavigationState): IntentResult {
  state.lastEventId += 1;
  state.lastMistake = null;
  return { accepted: true, mistake: false, completed: state.completedSections.length === 2 };
}
function mistake(state: NavigationState, section: 1 | 2): IntentResult {
  state.lastEventId += 1;
  state.lastMistake = { section, row: null, value: null };
  return { accepted: true, mistake: true, completed: false };
}
function integer(min: number, max: number, random: () => number) { return min + Math.floor(random() * (max - min + 1)); }
function choose<T>(items: readonly T[], random: () => number): T { return items[integer(0, items.length - 1, random)]; }
function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = integer(0, index, random);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
