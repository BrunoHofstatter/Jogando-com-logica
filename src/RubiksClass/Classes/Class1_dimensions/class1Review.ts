export const REVIEW_SIZES = [2, 3, 4, 5, 6] as const;
export function shuffleSizes(random = Math.random): number[] {
    const deck: number[] = [...REVIEW_SIZES];
    for (let index = deck.length - 1; index > 0; index--) {
        const other = Math.floor(random() * (index + 1));
        [deck[index], deck[other]] = [deck[other], deck[index]];
    }
    return deck;
}
export interface ReviewState {
    selected: number | null; matched: number[]; phase: "matching" | "complete";
    mistakes: number; hints: number; helpLevel: number;
    focusVersion: number; feedback: string; feedbackVersion: number; wrong: number | null;
}
export const initialReview: ReviewState = { selected: null, matched: [], phase: "matching", mistakes: 0, hints: 0, helpLevel: 0, focusVersion: 0, feedback: "", feedbackVersion: 0, wrong: null };
type ReviewAction = { type: "select"; size: number } | { type: "answer"; size: number } | { type: "hint" };
export function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
    if (state.phase === "complete") return state;
    if (action.type === "select") {
        if (state.matched.includes(action.size)) return state;
        return { ...state, selected: action.size, helpLevel: action.size === state.selected ? state.helpLevel : 0, feedback: "", wrong: null };
    }
    if (action.type === "hint") {
        if (state.selected === null) return { ...state, feedback: "Escolha um cubo para ver a dica.", feedbackVersion: state.feedbackVersion + 1 };
        return { ...state, helpLevel: Math.min(2, state.helpLevel + 1), hints: state.hints + Number(state.helpLevel < 2),
            focusVersion: state.focusVersion + 1, feedback: "", wrong: null };
    }
    if (state.matched.includes(action.size)) return state;
    if (state.selected === null) return { ...state, feedback: "Escolha um cubo e depois o tamanho dele.", feedbackVersion: state.feedbackVersion + 1 };
    if (state.selected !== action.size) return { ...state, mistakes: state.mistakes + 1, wrong: action.size, feedback: "Ainda não. Conte uma linha e tente novamente.", feedbackVersion: state.feedbackVersion + 1 };
    const matched = [...state.matched, state.selected];
    return { ...state, matched, selected: null, phase: matched.length === REVIEW_SIZES.length ? "complete" : "matching",
        helpLevel: 0, wrong: null, feedback: "Combinação correta!", feedbackVersion: state.feedbackVersion + 1 };
}
