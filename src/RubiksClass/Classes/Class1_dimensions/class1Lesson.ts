export interface Class1Step {
    id: string; cubeId: string; size: number;
    kind: "row" | "rows" | "size";
    question: string; options: readonly string[]; answer: string;
}
const sizes = ["2×2", "3×3", "4×4", "5×5", "6×6"];
export const CLASS1_STEPS: readonly Class1Step[] = [
    { id: "two-row", cubeId: "two", size: 2, kind: "row", question: "Quantos quadradinhos há em uma linha desta face?", options: ["1", "2", "3", "4"], answer: "2" },
    { id: "two-rows", cubeId: "two", size: 2, kind: "rows", question: "Quantas linhas há nesta face?", options: ["1", "2", "3", "4"], answer: "2" },
    { id: "three-size", cubeId: "three", size: 3, kind: "size", question: "Qual é o tamanho deste cubo?", options: sizes.slice(0, 4), answer: "3×3" },
    { id: "five-size", cubeId: "five", size: 5, kind: "size", question: "Qual é o tamanho deste cubo?", options: sizes.slice(1), answer: "5×5" },
    { id: "four-size", cubeId: "four", size: 4, kind: "size", question: "Qual é o tamanho deste cubo?", options: sizes.slice(0, 4), answer: "4×4" },
    { id: "six-size", cubeId: "six", size: 6, kind: "size", question: "Qual é o tamanho deste cubo?", options: sizes.slice(1), answer: "6×6" },
];
export const CLASS1_CUBES = CLASS1_STEPS.map(step => ({ id: step.cubeId, size: step.size }));
export interface LessonState {
    stepIndex: number; phase: "question" | "reveal" | "transition" | "summary";
    hintLevel: number; assistanceCount: number; incorrectCount: number;
    lastWrong: string | null; feedbackVersion: number; focusVersion: number; practicedRotation: boolean;
}
export function initialClass1(stepIndex = 0, review = false): LessonState {
    return { stepIndex, phase: review ? "summary" : "question", hintLevel: 0, assistanceCount: 0, incorrectCount: 0, lastWrong: null, feedbackVersion: 0, focusVersion: 0, practicedRotation: false };
}
type Action = { type: "guess"; answer: string } | { type: "hint" } | { type: "advance"; stepIndex: number } | { type: "continue" } | { type: "rotate" };
export function class1Reducer(state: LessonState, action: Action): LessonState {
    if (action.type === "rotate") return state.practicedRotation ? state : { ...state, practicedRotation: true };
    if (action.type === "continue") return state.phase === "reveal" ? { ...state, phase: "question", stepIndex: state.stepIndex + 1, hintLevel: 0, lastWrong: null } : state;
    if (action.type === "advance") {
        if (state.phase !== "transition" || state.stepIndex !== action.stepIndex) return state;
        return { ...state, phase: state.stepIndex === 1 ? "reveal" : state.stepIndex === CLASS1_STEPS.length - 1 ? "summary" : "question",
            stepIndex: state.stepIndex === 1 || state.stepIndex === CLASS1_STEPS.length - 1 ? state.stepIndex : state.stepIndex + 1,
            hintLevel: 0, lastWrong: null };
    }
    if (state.phase !== "question") return state;
    if (action.type === "guess" && action.answer === CLASS1_STEPS[state.stepIndex].answer) return { ...state, phase: "transition", lastWrong: null };
    const nextHint = Math.min(2, state.hintLevel + 1);
    return { ...state, hintLevel: nextHint, assistanceCount: state.assistanceCount + Number(nextHint > state.hintLevel),
        incorrectCount: state.incorrectCount + Number(action.type === "guess"), lastWrong: action.type === "guess" ? action.answer : null,
        feedbackVersion: state.feedbackVersion + 1, focusVersion: state.focusVersion + 1 };
}
export function class1Hint(step: Class1Step, level: number): string {
    if (step.kind === "rows") return level === 1 ? "Cada faixa horizontal é uma linha. Conte as linhas desta face." : "Veja as linhas marcadas: 1 e 2.";
    return level === 1 ? "Conte os quadradinhos de uma linha desta face." : "Acompanhe os números da linha e escolha sua resposta.";
}
