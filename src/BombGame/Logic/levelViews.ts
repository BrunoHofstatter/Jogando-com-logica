import type { BombRole } from "./level1";
import type { BombLevelState } from "./levels";
import type { BombGameViewState, BombViewState, SharedViewState } from "./multiplayer/protocol";

// Whitelist role-visible fields. Never spread authoritative puzzle state into a payload.
export function projectBombLevel(level: BombLevelState, role: BombRole, shared: SharedViewState): BombGameViewState {
  if (level.id === 3) {
    const state = level.state;
    if (role === "manual") return {
      ...shared, levelId: 3, role, exitRow: state.exitRow, maps: state.maps,
      equations: state.equations, solvedValues: state.solvedValues,
      equationRevision: state.equationRevision, wrongEquation: state.wrongEquation,
    };
    return {
      ...shared, levelId: 3, role, exitRow: state.exitRow, markers: state.maps[state.correctMap].markers,
      gridPosition: state.gridPosition, gridVisited: state.gridVisited, gridRevision: state.gridRevision,
      routes: state.routes, initialEnergy: state.initialEnergy, energy: state.energy,
      activeRoute: state.activeRoute, energyStep: state.energyStep, energyRevision: state.energyRevision,
    };
  }
  const state = level.state;
  if (role === "manual") return { ...shared, levelId: 1, role, calculations: state.manualCalculations };
  return {
    ...shared, levelId: 1, role,
    orderingNumbers: state.orderingNumbers, orderingProgress: state.orderingProgress,
    orderingRevision: state.orderingRevision,
    numericAnswers: state.numericAnswers, operatorAnswers: state.operatorAnswers,
    numericTargets: ["A + B", "B − C", "C + A"],
    operatorEquations: (["A", "C", "D"] as const).map((letter, row) => ({
      left: letter,
      right: String(state.operatorNumbers[row]),
      result: state.operatorSolutions[row] === "+"
        ? state.values[letter] + state.operatorNumbers[row]
        : state.values[letter] - state.operatorNumbers[row],
    })) as BombViewState["operatorEquations"],
  };
}
