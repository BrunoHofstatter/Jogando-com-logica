export interface ReviewTarget { id: number; size: number; rows: number }
export interface ReviewBox { id: number; value: number; top: number; left: number }
export const MATCH_COUNT = 10;
export const MAX_BOXES = 4;
export const BOX_SPEED = 4.8; // Percentage of the lane per second; 60% of the previous speed.
export const BOX_START = -12;
export const BOX_END = 112;
// Three naturally spaced moving cards, with room for one held card.
export const SPAWN_INTERVAL_MS = (BOX_END - BOX_START) / BOX_SPEED / 3 * 1000;
export const REVIEW_TARGETS: readonly ReviewTarget[] = [
    [3, 2], [4, 3], [5, 4], [3, 3], [2, 2],
    [4, 2], [3, 1], [6, 3], [4, 4], [2, 1],
].map(([size, rows], id) => ({ id, size, rows }));
// Each initial slot has one successor. In particular, only the 5×5 unlocks the 6×6.
const DISTRACTORS = [7, 11, 14, 17, 22, 27, 35];
export const targetTotal = (target: ReviewTarget) => target.size * target.rows;

export interface ReviewState {
    phase: "intro" | "playing" | "complete";
    targets: (ReviewTarget | null)[];
    boxes: ReviewBox[];
    nextBoxId: number;
    selected: number | null;
    matches: number;
    mistakes: number;
    feedback: string | null;
    feedbackId: number;
}
export const initialReviewState = (): ReviewState => ({
    phase: "intro", targets: REVIEW_TARGETS.slice(0, 5),
    boxes: [], nextBoxId: 0, selected: null, matches: 0, mistakes: 0, feedback: null, feedbackId: 0,
});
export type ReviewAction =
    | { type: "start"; mobile?: boolean }
    | { type: "spawn"; random: number; position: number; mobile: boolean }
    | { type: "tick"; seconds: number; mobile: boolean }
    | { type: "select"; id: number }
    | { type: "clearFeedback"; id: number }
    | { type: "match"; targetId: number };

export function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
    if (action.type === "start") return state.phase === "intro" ? {
        ...state, phase: "playing", nextBoxId: 3,
        boxes: [targetTotal(REVIEW_TARGETS[0]), targetTotal(REVIEW_TARGETS[1]), 7].map((value, id) => {
            const progress = BOX_START + id * (BOX_END - BOX_START) / 3;
            const lane = 25 + id * 25;
            return { id, value, top: action.mobile ? lane : progress, left: action.mobile ? progress : lane };
        }),
    } : state;
    if (state.phase !== "playing") return state;
    if (action.type === "clearFeedback") return state.feedbackId === action.id ? { ...state, feedback: null } : state;
    if (action.type === "spawn") {
        if (state.boxes.length >= MAX_BOXES) return state;
        const totals = state.targets.filter((target): target is ReviewTarget => target !== null).map(targetTotal);
        const hasTarget = state.boxes.some(box => totals.includes(box.value));
        const pool = !hasTarget || action.random < 0.65 ? totals : DISTRACTORS;
        const value = pool[Math.min(pool.length - 1, Math.floor(action.position * pool.length))];
        const box = { id: state.nextBoxId, value, top: action.mobile ? 20 + action.random * 50 : BOX_START, left: action.mobile ? BOX_START : 15 + action.random * 70 };
        return { ...state, boxes: [...state.boxes, box], nextBoxId: state.nextBoxId + 1 };
    }
    if (action.type === "tick") {
        const distance = Math.min(action.seconds, 0.05) * BOX_SPEED;
        return { ...state, boxes: state.boxes.map(box => box.id === state.selected ? box : {
            ...box, top: box.top + (action.mobile ? 0 : distance), left: box.left + (action.mobile ? distance : 0),
        }).filter(box => box.id === state.selected || (action.mobile ? box.left : box.top) < BOX_END) };
    }
    if (action.type === "select") return state.boxes.some(box => box.id === action.id)
        ? { ...state, selected: state.selected === action.id ? null : action.id, feedback: null } : state;
    const target = state.targets.find(target => target?.id === action.targetId);
    if (!target) return state;
    const box = state.boxes.find(box => box.id === state.selected);
    if (!box) return { ...state, feedback: "Escolha um número primeiro!", feedbackId: state.feedbackId + 1 };
    if (box.value !== targetTotal(target)) return {
        ...state, mistakes: state.mistakes + 1, selected: null,
        feedback: "Ainda não combina. Conte só os quadradinhos coloridos!",
        feedbackId: state.feedbackId + 1,
    };
    const matches = state.matches + 1;
    return {
        ...state, matches, phase: matches === MATCH_COUNT ? "complete" : "playing",
        targets: state.targets.map(item => item?.id === target.id ? REVIEW_TARGETS[target.id + 5] ?? null : item),
        boxes: state.boxes.filter(item => item.id !== box.id), selected: null,
        feedback: `${target.rows} linhas × ${target.size} quadradinhos = ${targetTotal(target)}. Muito bem!`,
        feedbackId: state.feedbackId + 1,
    };
}

