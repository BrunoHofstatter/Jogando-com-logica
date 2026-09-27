import type { HighlightRegion, RubiksCubeProps } from "../../Components/RubiksCube";
import { coloredRows } from "../../Components/educationalCube";
export { rowColors } from "../../Components/educationalCube";

export interface LessonOption { label: string; value: string }
type QuestionKind = "rowSize" | "rowCount" | "addition" | "multiplication" | "total";
export interface LessonStep {
    id: string;
    cubeId: string;
    size: number;
    rows: number;
    kind: QuestionKind;
    question: string;
    options: LessonOption[];
    answer: string;
    striped?: boolean;
}

const options = (values: (string | number)[]): LessonOption[] =>
    values.map(value => ({ label: String(value), value: String(value) }));

export const LESSON_STEPS: readonly LessonStep[] = [
    {
        id: "one-row", cubeId: "three", size: 3, rows: 3, kind: "rowSize",
        question: "Quantos quadradinhos há nesta linha?",
        options: options([2, 6, 3, 9, 4, 1]), answer: "3",
    },
    {
        id: "equal-rows", cubeId: "three", size: 3, rows: 3, kind: "rowCount",
        question: "Quantas linhas há nesta face?",
        options: options([9, 2, 6, 3, 1, 4]), answer: "3",
    },
    {
        id: "repeated-addition", cubeId: "three", size: 3, rows: 3, kind: "addition",
        question: "Qual soma conta todos os quadradinhos desta face?",
        options: options(["3 + 3", "3 + 3 + 3", "3 + 3 + 3 + 3"]), answer: "3 + 3 + 3",
    },
    {
        id: "three-total", cubeId: "three", size: 3, rows: 3, kind: "total",
        question: "Quantos quadradinhos há nesta face?",
        options: options([6, 3, 12, 8, 9, 10]), answer: "9",
    },
    {
        id: "four-expression", cubeId: "four", size: 4, rows: 4, kind: "multiplication",
        question: "Qual multiplicação calcula todos os quadradinhos desta face?",
        options: options(["4 × 2", "3 × 3", "4 × 4", "4 × 6", "5 × 5", "3 × 4"]), answer: "4 × 4",
    },
    {
        id: "four-total", cubeId: "four", size: 4, rows: 4, kind: "total",
        question: "Quantos quadradinhos há nesta face?",
        options: options([12, 24, 8, 16, 4, 20]), answer: "16",
    },
    {
        id: "two-rows-expression", cubeId: "four", size: 4, rows: 2, kind: "multiplication",
        question: "Qual multiplicação conta só os quadradinhos das linhas destacadas?",
        options: options(["4 × 4", "2 × 2", "3 × 4", "2 × 4", "4 × 6", "3 × 3"]), answer: "2 × 4",
    },
    {
        id: "two-rows-total", cubeId: "four", size: 4, rows: 2, kind: "total",
        question: "Quantos quadradinhos há nas linhas destacadas?",
        options: options([4, 16, 12, 6, 8, 10]), answer: "8",
    },
    {
        id: "two-expression", cubeId: "two", size: 2, rows: 2, kind: "multiplication",
        question: "Qual multiplicação calcula todos os quadradinhos desta face?",
        options: options(["2 × 3", "1 × 2", "3 × 3", "2 × 2", "2 × 4", "4 × 4"]), answer: "2 × 2",
    },
    {
        id: "five-expression", cubeId: "five", size: 5, rows: 5, kind: "multiplication",
        question: "Qual multiplicação calcula todos os quadradinhos desta face?",
        options: options(["4 × 5", "5 × 5", "5 × 6", "3 × 5", "4 × 4", "2 × 5"]), answer: "5 × 5",
    },
    {
        id: "four-rows-total", cubeId: "five", size: 5, rows: 4, kind: "total",
        question: "Quantos quadradinhos há nas linhas destacadas?",
        options: options([25, 15, 9, 20, 16, 30]), answer: "20",
    },
    {
        id: "six-expression", cubeId: "six", size: 6, rows: 6, kind: "multiplication", striped: false,
        question: "Qual multiplicação calcula todos os quadradinhos desta face?",
        options: options(["5 × 6", "3 × 6", "6 × 6", "4 × 6", "5 × 5", "6 × 7"]), answer: "6 × 6",
    },
    {
        id: "five-rows-total", cubeId: "six", size: 6, rows: 5, kind: "total",
        question: "Quantos quadradinhos há nas linhas destacadas?",
        options: options([36, 24, 25, 11, 30, 42]), answer: "30",
    },
];

export type Class2Phase = "question" | "reveal" | "transition" | "summary";
export interface Class2State {
    stepIndex: number;
    phase: Class2Phase;
    hintLevel: number;
    incorrectCount: number;
    assistanceCount: number;
    selectedSum: string | null;
    incorrectAnswer: string | null;
}

export const initialLessonState = (review: boolean, stepIndex = 0): Class2State => ({
    stepIndex, phase: review ? "summary" : "question", hintLevel: 0,
    incorrectCount: 0, assistanceCount: 0, selectedSum: null, incorrectAnswer: null,
});

export type Class2Action =
    | { type: "guess"; answer: string }
    | { type: "selectSum"; answer: string }
    | { type: "hint" }
    | { type: "advance" }
    | { type: "continueReveal" };

function nextStep(state: Class2State): Class2State {
    const finished = state.stepIndex + 1 === LESSON_STEPS.length;
    return {
        ...state, stepIndex: finished ? state.stepIndex : state.stepIndex + 1,
        phase: finished ? "summary" : "question", hintLevel: 0, selectedSum: null, incorrectAnswer: null,
    };
}

function addHint(state: Class2State): Class2State {
    if (state.hintLevel >= 3) return state;
    return { ...state, hintLevel: state.hintLevel + 1, assistanceCount: state.assistanceCount + 1 };
}

export function class2Reducer(state: Class2State, action: Class2Action): Class2State {
    if (action.type === "advance") return state.phase === "transition" ? nextStep(state) : state;
    if (action.type === "continueReveal") return state.phase === "reveal" ? nextStep(state) : state;
    if (state.phase !== "question") return state;
    if (action.type === "hint") return addHint(state);
    const step = LESSON_STEPS[state.stepIndex];
    if (action.type === "selectSum") {
        return step.kind === "addition" && step.options.some(option => option.value === action.answer)
            ? { ...state, selectedSum: action.answer, incorrectAnswer: null } : state;
    }
    if (action.type === "guess") {
        if (!step.options.some(option => option.value === action.answer)) return state;
        if (action.answer !== step.answer) {
            return addHint({ ...state, incorrectCount: state.incorrectCount + 1, incorrectAnswer: action.answer });
        }
        return { ...state, incorrectAnswer: null, phase: step.kind === "addition" ? "reveal" : "transition" };
    }
    return state;
}

export const repeatedAddition = (step: LessonStep) => Array.from({ length: step.rows }, () => step.size).join(" + ");
export const multiplication = (step: LessonStep) => `${step.rows} × ${step.size}`;

export const usesRowCountingHint = (step: LessonStep) => step.size === 3 || step.id === "four-expression";

/** Target rows never change when a hint focuses just one of them. */
export function lessonCubeProps(step: LessonStep, state: Class2State): RubiksCubeProps {
    const { hintLevel, phase } = state;
    const reveal = phase === "reveal";
    const striped = step.striped !== false || hintLevel > 0;
    const targetRows = step.kind === "rowSize" ? 1 : step.rows;
    const focusOneRow = !reveal && ((step.kind === "rowSize") ||
        (hintLevel === 1 && usesRowCountingHint(step) && step.kind !== "rowCount"));
    const shownRows = focusOneRow ? 1 : targetRows;
    const regions: HighlightRegion[] = Array.from({ length: shownRows }, (_, index) => ({ type: "row", index }));
    const showLabels = reveal || hintLevel >= (usesRowCountingHint(step) ? 2 : 1);
    return {
        size: step.size, returnToDefault: true, homeRotation: { x: -12, y: 18 },
        focusRequest: `${step.id}-${hintLevel}-${reveal ? 1 : 0}`,
        hintAnimationKey: `${step.id}-${hintLevel}-${reveal ? 1 : 0}`,
        faceAppearances: coloredRows(step.size, targetRows, striped),
        rowGuides: {
            front: striped && (hintLevel > 0 || reveal) ? Array.from({ length: shownRows }, (_, row) => ({
                row, glow: true, label: showLabels ? String(step.kind === "rowCount" ? row + 1 : step.size) : undefined,
            })) : [],
        },
        // Keep the question’s target mask independent of hint focus.
        highlightRegion: focusOneRow ? regions : null,
        dimInactive: false,
        showIndices: (focusOneRow && hintLevel >= 1) || (step.kind === "rowSize" && hintLevel >= 2),
        showCounting: (focusOneRow && hintLevel >= 1) || (step.kind === "rowSize" && hintLevel >= 2),
        animatePattern: step.id === "one-row" && hintLevel === 0,
    };
}

export function lessonHint(step: LessonStep, level: number): string {
    if (level === 0) return "";
    if (step.kind === "rowSize") return level === 1
        ? "Conte os quadradinhos da linha destacada."
        : `Conte: 1, 2, 3. Cada linha tem ${step.size} quadradinhos.`;
    if (step.kind === "rowCount") return level === 1
        ? "Cada faixa iluminada é uma linha. Conte de cima para baixo."
        : "Os números ao lado contam as linhas: 1, 2, 3.";
    if (level === 1 && usesRowCountingHint(step)) return "Comece contando os quadradinhos de uma linha.";
    if (step.kind === "addition") return "Cada linha entra na soma uma vez. Ligue uma parcela a cada linha.";
    if (level >= 3 && step.kind === "multiplication") return `${step.rows} conta as linhas; ${step.size} conta os quadradinhos em cada linha: ${multiplication(step)}.`;
    return `São ${step.rows} linhas com ${step.size} quadradinhos em cada uma.`;
}
