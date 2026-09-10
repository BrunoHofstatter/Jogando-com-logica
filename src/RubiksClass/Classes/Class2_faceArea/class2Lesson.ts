import type { HighlightRegion, RubiksCubeProps, StickerColor } from "../../Components/RubiksCube";

export interface LessonOption { label: string; value: string }
type QuestionKind = "rowSize" | "rowCount" | "addition" | "multiplication" | "total";
export interface LessonStep {
    id: string;
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
        id: "one-row", size: 3, rows: 3, kind: "rowSize",
        question: "Quantos quadradinhos há nesta linha?",
        options: options([2, 6, 3, 9, 4, 1]), answer: "3",
    },
    {
        id: "equal-rows", size: 3, rows: 3, kind: "rowCount",
        question: "Quantas linhas há nesta face?",
        options: options([9, 2, 6, 3, 1, 4]), answer: "3",
    },
    {
        id: "repeated-addition", size: 3, rows: 3, kind: "addition",
        question: "Qual soma conta todos os quadradinhos desta face?",
        options: options(["3 + 3", "3 + 3 + 3", "3 + 3 + 3 + 3"]), answer: "3 + 3 + 3",
    },
    {
        id: "three-total", size: 3, rows: 3, kind: "total",
        question: "Quantos quadradinhos há nesta face?",
        options: options([6, 3, 12, 8, 9, 10]), answer: "9",
    },
    {
        id: "four-expression", size: 4, rows: 4, kind: "multiplication",
        question: "Qual multiplicação calcula todos os quadradinhos desta face?",
        options: options(["4 × 2", "3 × 3", "4 × 4", "4 × 6", "5 × 5", "3 × 4"]), answer: "4 × 4",
    },
    {
        id: "four-total", size: 4, rows: 4, kind: "total",
        question: "Quantos quadradinhos há nesta face?",
        options: options([12, 24, 8, 16, 4, 20]), answer: "16",
    },
    {
        id: "two-rows-expression", size: 4, rows: 2, kind: "multiplication",
        question: "Qual multiplicação conta só os quadradinhos das linhas destacadas?",
        options: options(["4 × 4", "2 × 2", "3 × 4", "2 × 4", "4 × 6", "3 × 3"]), answer: "2 × 4",
    },
    {
        id: "two-rows-total", size: 4, rows: 2, kind: "total",
        question: "Quantos quadradinhos há nas linhas destacadas?",
        options: options([4, 16, 12, 6, 8, 10]), answer: "8",
    },
    {
        id: "two-expression", size: 2, rows: 2, kind: "multiplication",
        question: "Qual multiplicação calcula todos os quadradinhos desta face?",
        options: options(["2 × 3", "1 × 2", "3 × 3", "2 × 2", "2 × 4", "4 × 4"]), answer: "2 × 2",
    },
    {
        id: "five-expression", size: 5, rows: 5, kind: "multiplication",
        question: "Qual multiplicação calcula todos os quadradinhos desta face?",
        options: options(["4 × 5", "5 × 5", "5 × 6", "3 × 5", "4 × 4", "2 × 5"]), answer: "5 × 5",
    },
    {
        id: "four-rows-total", size: 5, rows: 4, kind: "total",
        question: "Quantos quadradinhos há nas linhas destacadas?",
        options: options([25, 15, 9, 20, 16, 30]), answer: "20",
    },
    {
        id: "six-expression", size: 6, rows: 6, kind: "multiplication", striped: false,
        question: "Qual multiplicação calcula todos os quadradinhos desta face?",
        options: options(["5 × 6", "3 × 6", "6 × 6", "4 × 6", "5 × 5", "6 × 7"]), answer: "6 × 6",
    },
    {
        id: "five-rows-total", size: 6, rows: 5, kind: "total",
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
    replayKey: number;
}

export const initialLessonState = (review: boolean): Class2State => ({
    stepIndex: 0, phase: review ? "summary" : "question", hintLevel: 0,
    incorrectCount: 0, assistanceCount: 0, selectedSum: null, replayKey: 0,
});

export type Class2Action =
    | { type: "guess"; answer: string }
    | { type: "selectSum"; answer: string }
    | { type: "hint" }
    | { type: "advance" }
    | { type: "continueReveal" }
    | { type: "replay" };

function nextStep(state: Class2State): Class2State {
    const finished = state.stepIndex + 1 === LESSON_STEPS.length;
    return {
        ...state, stepIndex: finished ? state.stepIndex : state.stepIndex + 1,
        phase: finished ? "summary" : "question", hintLevel: 0, selectedSum: null,
    };
}

function addHint(state: Class2State): Class2State {
    if (state.hintLevel >= 3) return state;
    return { ...state, hintLevel: state.hintLevel + 1, assistanceCount: state.assistanceCount + 1 };
}

export function class2Reducer(state: Class2State, action: Class2Action): Class2State {
    if (action.type === "advance") return state.phase === "transition" ? nextStep(state) : state;
    if (action.type === "continueReveal") return state.phase === "reveal" ? nextStep(state) : state;
    if (action.type === "replay") return state.phase === "reveal" ? { ...state, replayKey: state.replayKey + 1 } : state;
    if (state.phase !== "question") return state;
    if (action.type === "hint") return addHint(state);
    const step = LESSON_STEPS[state.stepIndex];
    if (action.type === "selectSum") {
        return step.kind === "addition" && step.options.some(option => option.value === action.answer)
            ? { ...state, selectedSum: action.answer } : state;
    }
    if (action.type === "guess") {
        if (!step.options.some(option => option.value === action.answer)) return state;
        if (action.answer !== step.answer) {
            return addHint({ ...state, incorrectCount: state.incorrectCount + 1 });
        }
        return { ...state, phase: step.kind === "addition" ? "reveal" : "transition" };
    }
    return state;
}

export const rowColors: readonly StickerColor[] = ["blue", "yellow", "red", "green", "orange", "white"];
export const repeatedAddition = (step: LessonStep) => Array.from({ length: step.rows }, () => step.size).join(" + ");
export const multiplication = (step: LessonStep) => `${step.rows} × ${step.size}`;

/** Target rows never change when a hint focuses just one of them. */
export function lessonCubeProps(step: LessonStep, state: Class2State): RubiksCubeProps {
    const { hintLevel, phase } = state;
    const reveal = phase === "reveal";
    const striped = step.striped !== false || hintLevel > 0;
    const focusOneRow = !reveal && ((step.kind === "rowSize" && hintLevel < 3) ||
        (hintLevel === 1 && step.kind !== "rowCount"));
    const shownRows = focusOneRow ? 1 : step.rows;
    const outlinedRows = step.rows < step.size ? step.rows : shownRows;
    const regions: HighlightRegion[] = Array.from({ length: shownRows }, (_, index) => ({ type: "row", index }));
    const showLabels = reveal || hintLevel >= 2;
    return {
        size: step.size, resetToFront: true, scriptedRotation: { x: -8, y: -10 }, disableInteraction: true,
        faceAppearances: {
            front: {
                stickers: Array.from({ length: step.size * step.size }, (_, index) => {
                    const row = Math.floor(index / step.size);
                    return { color: striped ? rowColors[row] : undefined, muted: row >= step.rows };
                }),
            },
            back: { muted: true }, right: { muted: true }, left: { muted: true },
            top: { muted: true }, bottom: { muted: true },
        },
        rowGuides: {
            front: striped ? Array.from({ length: outlinedRows }, (_, row) => ({
                row, label: showLabels ? String(step.kind === "rowCount" ? row + 1 : step.size) : undefined,
            })) : [],
        },
        // Outlines and colors carry the grouping; reserve glowing highlights for help.
        highlightRegion: focusOneRow || hintLevel > 0 ? regions : null,
        dimInactive: focusOneRow,
        showIndices: step.kind === "rowSize" && hintLevel >= 2,
        showCounting: step.kind === "rowSize" && hintLevel >= 2,
        animatePattern: step.id === "one-row" && hintLevel === 0,
    };
}

export function lessonHint(step: LessonStep, level: number): string {
    if (level === 0) return "";
    if (step.kind === "rowSize") return level === 1
        ? "Conte os quadradinhos da linha destacada."
        : `Conte: 1, 2, 3. Cada linha tem ${step.size} quadradinhos.`;
    if (step.kind === "rowCount") return level === 1
        ? "Cada faixa contornada é uma linha. Conte de cima para baixo."
        : "Os números ao lado contam as linhas: 1, 2, 3.";
    if (level === 1) return "Comece contando os quadradinhos de uma linha.";
    if (step.kind === "addition") return "Cada linha entra na soma uma vez. Ligue uma parcela a cada linha.";
    return `São ${step.rows} linhas com ${step.size} quadradinhos em cada uma.`;
}
