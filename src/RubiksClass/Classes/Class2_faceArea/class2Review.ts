export interface ReviewTarget { id: number; size: number; rows: number }
export interface ReviewBox { id: number; value: number; top: number; left: number }
// Store travel in top and lane position in left, independent of viewport orientation.
export const reviewBoxPosition = (box: ReviewBox, mobile: boolean) =>
    mobile ? { top: box.left, left: box.top } : { top: box.top, left: box.left };
export const MATCH_COUNT = 10;
export const MAX_BOXES = 4;
export const BOX_SPEED = 4.8; // Percentage of the lane per second; 60% of the previous speed.
export const BOX_START = -12;
export const BOX_END = 112;
// Three naturally spaced moving cards, with room for one held card.
export const SPAWN_INTERVAL_MS = 4500;
export const REPLENISH_DELAY_MS = 300;
export const REVIEW_TARGETS: readonly ReviewTarget[] = [
    [3, 2], [4, 3], [5, 4], [3, 3], [2, 2],
    [4, 2], [3, 1], [6, 3], [4, 4], [2, 1],
].map(([size, rows], id) => ({ id, size, rows }));
// Each initial slot has one successor. In particular, only the 5×5 unlocks the 6×6.
const DISTRACTORS = [7, 11, 14, 17, 22, 27, 35];
export const targetTotal = (target: ReviewTarget) => target.size * target.rows;

const availableTotals = (state: ReviewState) => state.targets
    .filter((target): target is ReviewTarget => target !== null)
    .map(targetTotal);

export function needsImmediateSpawn(state: ReviewState): boolean {
    if (state.phase !== "playing" || state.reducedMotion || state.boxes.length >= MAX_BOXES) return false;
    const totals = availableTotals(state);
    if (totals.length === 0) return false;
    const hasTarget = state.boxes.some(box => totals.includes(box.value));
    const hasDistractor = state.boxes.some(box => !totals.includes(box.value));
    return state.boxes.length < 2 || !hasTarget || (state.boxes.length < 3 && !hasDistractor);
}

export interface ReviewState {
    phase: "intro" | "playing" | "complete";
    targets: (ReviewTarget | null)[];
    boxes: ReviewBox[];
    nextBoxId: number;
    selected: number | null;
    focused: number | null;
    reducedMotion: boolean;
    matches: number;
    mistakes: number;
    feedback: string | null;
    feedbackId: number;
    pendingReplacement: { slot: number; target: ReviewTarget | null } | null;
}
export const initialReviewState = (): ReviewState => ({
    phase: "intro", targets: REVIEW_TARGETS.slice(0, 5),
    boxes: [], nextBoxId: 0, selected: null, matches: 0, mistakes: 0, feedback: null, feedbackId: 0,
    pendingReplacement: null, focused: null, reducedMotion: false,
});
export type ReviewAction =
    | { type: "start"; reducedMotion?: boolean }
    | { type: "motion"; reducedMotion: boolean }
    | { type: "focus"; id: number | null }
    | { type: "spawn"; random: number; position: number }
    | { type: "tick"; seconds: number }
    | { type: "select"; id: number }
    | { type: "clearFeedback"; id: number }
    | { type: "showReplacement"; slot: number }
    | { type: "match"; targetId: number };

/** Stationary choices must refresh without relying on cards eventually expiring. */
function refreshStationaryChoices(state: ReviewState): ReviewState {
    if (!state.reducedMotion || state.phase !== "playing") return state;
    const totals = [...new Set(availableTotals(state))];
    if (!totals.length) return state; // Wait for the pending replacement.
    const values = [totals[0], DISTRACTORS[0], totals[1] ?? DISTRACTORS[1]];
    const offset = state.matches % values.length;
    const ordered = [...values.slice(offset), ...values.slice(0, offset)];
    const held = state.boxes.find(box => box.id === state.selected);
    if (held && !ordered.includes(held.value)) ordered.push(held.value);
    let nextBoxId = state.nextBoxId;
    const boxes = ordered.map((value, index) =>
        state.boxes.find(box => box.value === value && box.id === state.selected) ??
        state.boxes.find(box => box.value === value) ??
        { id: nextBoxId++, value, top: 20 + index * 20, left: 25 + index * 15 });
    return { ...state, boxes, nextBoxId,
        focused: boxes.some(box => box.id === state.focused) ? state.focused : null };
}

export function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
    if (action.type === "start") return state.phase === "intro" ? refreshStationaryChoices({
        ...state, phase: "playing", nextBoxId: 3, reducedMotion: action.reducedMotion ?? false,
        boxes: [targetTotal(REVIEW_TARGETS[0]), targetTotal(REVIEW_TARGETS[1]), 7].map((value, id) => {
            const progress = BOX_START + id * (BOX_END - BOX_START) / 3;
            const lane = 25 + id * 25;
            return { id, value, top: progress, left: lane };
        }),
    }) : state;
    if (action.type === "motion") {
        if (state.reducedMotion === action.reducedMotion) return state;
        return refreshStationaryChoices({ ...state, reducedMotion: action.reducedMotion,
            boxes: state.boxes.map((box, index) => ({ ...box, top: 20 + index * 20, left: 25 + index * 15 })) });
    }
    if (action.type === "showReplacement") {
        if (!state.pendingReplacement || state.pendingReplacement.slot !== action.slot) return state;
        return refreshStationaryChoices({
            ...state,
            targets: state.targets.map((target, index) => index === action.slot ? state.pendingReplacement!.target : target),
            pendingReplacement: null,
        });
    }
    if (state.phase !== "playing") return state;
    if (action.type === "focus") return { ...state, focused: action.id,
        boxes: state.boxes.map(box => box.id === action.id ? { ...box, top: Math.max(8, Math.min(85, box.top)) } : box) };
    if (action.type === "clearFeedback") return state.feedbackId === action.id ? { ...state, feedback: null } : state;
    if (action.type === "spawn") {
        if (state.reducedMotion || state.boxes.length >= MAX_BOXES) return state;
        const totals = availableTotals(state);
        if (totals.length === 0) return state;
        const hasTarget = state.boxes.some(box => totals.includes(box.value));
        const hasDistractor = state.boxes.some(box => !totals.includes(box.value));
        const pool = !hasTarget ? totals : !hasDistractor ? DISTRACTORS : action.random < 0.65 ? totals : DISTRACTORS;
        const value = pool[Math.min(pool.length - 1, Math.floor(action.position * pool.length))];
        const box = { id: state.nextBoxId, value, top: BOX_START, left: 20 + action.random * 50 };
        return { ...state, boxes: [...state.boxes, box], nextBoxId: state.nextBoxId + 1 };
    }
    if (action.type === "tick") {
        if (state.reducedMotion) return state;
        const distance = Math.min(action.seconds, 0.05) * BOX_SPEED;
        return { ...state, boxes: state.boxes.map(box => box.id === state.selected || box.id === state.focused ? box : {
            ...box, top: box.top + distance,
        }).filter(box => box.id === state.selected || box.id === state.focused || box.top < BOX_END) };
    }
    if (action.type === "select") return state.boxes.some(box => box.id === action.id)
        ? { ...state, selected: state.selected === action.id ? null : action.id, feedback: null } : state;
    if (state.pendingReplacement) return state;
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
    const slot = state.targets.findIndex(item => item?.id === target.id);
    return refreshStationaryChoices({
        ...state, matches, phase: matches === MATCH_COUNT ? "complete" : "playing",
        targets: state.targets.map(item => item?.id === target.id ? null : item),
        pendingReplacement: { slot, target: REVIEW_TARGETS[target.id + 5] ?? null },
        boxes: state.boxes.filter(item => item.id !== box.id), selected: null,
        feedback: `${target.rows} linhas × ${target.size} quadradinhos = ${targetTotal(target)}. Muito bem!`,
        feedbackId: state.feedbackId + 1,
    });
}
