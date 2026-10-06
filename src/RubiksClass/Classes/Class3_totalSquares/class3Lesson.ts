import type { CubeFace, RubiksCubeProps, StickerColor } from "../../Components/RubiksCube";
import type { CubeRotation } from "../../Components/RubiksCubeAnimations";

export const FACE_ORDER: CubeFace[] = ["front", "back", "right", "left", "top", "bottom"];
const TRAVEL_ORDER: CubeFace[] = ["front", "right", "back", "left", "top", "bottom"];
const OPPOSITE: Record<CubeFace, CubeFace> = {
    front: "back", back: "front", right: "left", left: "right", top: "bottom", bottom: "top",
};
export const adjacent = (a: CubeFace, b: CubeFace) => a !== b && OPPOSITE[a] !== b;
export const INITIAL_ROTATION = { x: -22, y: -28 };

export const homeRotation = (config: Configuration): CubeRotation => config.size === 3 ? { x: -22, y: 28 } : INITIAL_ROTATION;

export interface Configuration {
    id: string;
    size: number;
    color: Exclude<StickerColor, "white">;
    faces: CubeFace[];
    faceAdjective: string;
    squareAdjective: string;
}
export const CONFIGURATIONS: Configuration[] = [
    { id: "two-blue", size: 2, color: "blue", faces: ["front", "right"], faceAdjective: "azuis", squareAdjective: "azuis" },
    { id: "three-red", size: 3, color: "red", faces: ["front", "right", "top"], faceAdjective: "vermelhas", squareAdjective: "vermelhos" },
    { id: "four-green", size: 4, color: "green", faces: ["front", "right", "back", "left"], faceAdjective: "verdes", squareAdjective: "verdes" },
    { id: "five-orange", size: 5, color: "orange", faces: ["front", "right", "bottom"], faceAdjective: "laranja", squareAdjective: "laranja" },
    { id: "five-all-faces", size: 5, color: "yellow", faces: [...FACE_ORDER], faceAdjective: "amarelas", squareAdjective: "amarelos" },
    { id: "six-blue", size: 6, color: "blue", faces: FACE_ORDER.filter(face => face !== "back"), faceAdjective: "azuis", squareAdjective: "azuis" },
    { id: "six-all-faces", size: 6, color: "red", faces: [...FACE_ORDER], faceAdjective: "vermelhas", squareAdjective: "vermelhos" },
];
export type StepKind = "faces" | "faceExpression" | "expression" | "total" | "calculation";
export interface LessonStep {
    configuration: number;
    kind: StepKind;
    question: string;
    answer: string;
    options: string[];
}
export const expression = (config: Configuration) => `${config.faces.length} × ${config.size ** 2}`;
export const faceExpression = (config: Configuration) => `${config.size} × ${config.size}`;

function makeStep(configuration: number, kind: StepKind): LessonStep {
    const config = CONFIGURATIONS[configuration];
    const { size, faces, faceAdjective, squareAdjective } = config;
    const area = size ** 2;
    const count = faces.length;
    const total = area * count;
    let question: string;
    let answer: string;
    let options: string[];
    if (kind === "faces") {
        question = `Quantas faces ${faceAdjective} há neste cubo?`;
        answer = String(count);
        options = [1, 2, 3, 4, 5, 6].map(String);
    } else if (kind === "faceExpression") {
        question = "Qual multiplicação calcula os quadradinhos de uma face colorida?";
        answer = faceExpression(config);
        options = [answer, `${size} × 6`, `${size} + ${size + 1}`, `${size + 1} × ${size}`, `${area} × ${size}`, `${size + 1} × ${size + 1}`];
    } else if (kind === "expression") {
        question = configuration < 2
            ? "Qual multiplicação calcula o total?"
            : `Qual multiplicação calcula todos os quadradinhos ${squareAdjective}?`;
        answer = expression(config);
        const candidates = [answer, `${count} + ${area}`, `${count} × ${size}`, `${count - 1} × ${area}`, `${count + 1} × ${area}`, `${count} × ${area + size}`, `${area} + ${size}`];
        options = candidates.filter((option, index) => index === 0 || valueOfExpression(option) !== total).slice(0, 6);
    } else {
        question = `Quantos quadradinhos ${squareAdjective} há no cubo?`;
        answer = String(total);
        options = kind === "calculation" ? [] : [...new Set([area, count, area + count, total, total + area, total - area, total + 1, total - 1, total + 2])].slice(0, 6).map(String);
    }
    // Deterministic ordering avoids teaching a fixed button position.
    options = [...new Set(options)];
    const offset = (configuration * 2 + (kind === "expression" ? 3 : 1)) % options.length;
    if (options.length) options = [...options.slice(offset), ...options.slice(0, offset)];
    return { configuration, kind, question, answer, options };
}

export function valueOfExpression(value: string): number {
    const [a, operator, b] = value.split(" ");
    return operator === "×" ? Number(a) * Number(b) : Number(a) + Number(b);
}

export const LESSON_STEPS: LessonStep[] = CONFIGURATIONS.flatMap((_, index) => {
    const kinds: StepKind[] = index < 2 ? ["faces", "faceExpression", "expression", "total"]
        : index === 3 || index === 5 ? ["expression"] : ["expression", "calculation"];
    return kinds.map(kind => makeStep(index, kind));
});

export interface LessonState {
    stepIndex: number;
    phase: "question" | "transition" | "faceResult" | "calculationIntro" | "complete";
    hintLevel: number;
    assistanceCount: number;
    incorrectCount: number;
    lastWrong: string | null;
}
export const initialState: LessonState = { stepIndex: 0, phase: "question", hintLevel: 0, assistanceCount: 0, incorrectCount: 0, lastWrong: null };
export type LessonAction =
    | { type: "guess"; answer: string }
    | { type: "hint" | "calculationMistake" | "continue" }
    | { type: "calculationComplete"; usedHints: number }
    | { type: "advance"; stepIndex: number };

function nextQuestion(state: LessonState): LessonState {
    const next = state.stepIndex + 1;
    return next === LESSON_STEPS.length ? { ...state, phase: "complete" }
        : { ...state, stepIndex: next, hintLevel: 0, lastWrong: null, phase: LESSON_STEPS[next].kind === "calculation" && LESSON_STEPS[next].configuration === 2 ? "calculationIntro" : "question" };
}

export function class3Reducer(state: LessonState, action: LessonAction): LessonState {
    const step = LESSON_STEPS[state.stepIndex];
    if (action.type === "advance") {
        if (state.phase !== "transition" || action.stepIndex !== state.stepIndex) return state;
        return nextQuestion(state);
    }
    if (action.type === "continue") {
        if (state.phase === "faceResult") return nextQuestion(state);
        if (state.phase === "calculationIntro") return { ...state, phase: "question" };
        return state;
    }
    if (state.phase !== "question") return state;
    if (action.type === "calculationMistake") return { ...state, incorrectCount: state.incorrectCount + 1 };
    if (action.type === "calculationComplete") return step.kind === "calculation" ? { ...state, phase: "transition", assistanceCount: state.assistanceCount + action.usedHints } : state;
    if (action.type === "guess" && action.answer === step.answer) {
        return { ...state, lastWrong: null, phase: step.kind === "faceExpression" ? "faceResult" : "transition" };
    }
    const nextHint = Math.min(3, state.hintLevel + 1);
    return {
        ...state, hintLevel: nextHint, lastWrong: action.type === "guess" ? action.answer : null,
        assistanceCount: state.assistanceCount + (nextHint > state.hintLevel ? 1 : 0),
        incorrectCount: state.incorrectCount + (action.type === "guess" ? 1 : 0),
    };
}

export function appearanceFor(config: Configuration): RubiksCubeProps["faceAppearances"] {
    return Object.fromEntries(FACE_ORDER.map(face => [face, { color: config.color, muted: !config.faces.includes(face) }]));
}

// Breadth-first search on only 6 faces × 64 masks. Gray waypoints are allowed,
// but never counted. Stable adjacency order makes the tour predictable.
export function faceTour(selected: readonly CubeFace[], start: CubeFace = "front", heading: CubeFace = start === "top" || start === "bottom" ? "front" : start): CubeFace[] {
    if (!selected.length) return [];
    const bit = (face: CubeFace) => selected.includes(face) ? 1 << FACE_ORDER.indexOf(face) : 0;
    const goal = selected.reduce((mask, face) => mask | bit(face), 0);
    const queue = [{ face: start, heading, mask: bit(start), route: [start] }];
    const visited = new Set([`${start}:${heading}:${bit(start)}`]);
    for (let cursor = 0; cursor < queue.length; cursor++) {
        const current = queue[cursor];
        if (current.mask === goal) return current.route;
        for (const next of TRAVEL_ORDER.filter(face => adjacent(current.face, face))) {
            // At a pole, keep the last side heading so exiting never twists
            // the view halfway around. A neighboring gray side is a waypoint.
            const isSide = next !== "top" && next !== "bottom";
            if (isSide && next === OPPOSITE[current.heading]) continue;
            const nextHeading = isSide ? next : current.heading;
            const mask = current.mask | bit(next);
            const key = `${next}:${nextHeading}:${mask}`;
            if (visited.has(key)) continue;
            visited.add(key);
            queue.push({ face: next, heading: nextHeading, mask, route: [...current.route, next] });
        }
    }
    return [];
}

export const nearestAngle = (target: number, from: number) => from + ((target - from + 540) % 360 + 360) % 360 - 180;
const sideYaw: Partial<Record<CubeFace, number>> = { front: 0, right: -90, back: -180, left: 90 };
export function faceRotation(face: CubeFace, from: CubeRotation): CubeRotation {
    return face === "top" || face === "bottom"
        ? { x: nearestAngle(face === "top" ? -90 : 90, from.x), y: from.y }
        : { x: nearestAngle(0, from.x), y: nearestAngle(sideYaw[face]!, from.y) };
}
export function closestFace(rotation: CubeRotation): CubeFace {
    const x = rotation.x * Math.PI / 180;
    const y = rotation.y * Math.PI / 180;
    const depth: Record<CubeFace, number> = {
        front: Math.cos(x) * Math.cos(y), back: -Math.cos(x) * Math.cos(y),
        right: -Math.cos(x) * Math.sin(y), left: Math.cos(x) * Math.sin(y),
        top: -Math.sin(x), bottom: Math.sin(x),
    };
    return TRAVEL_ORDER.reduce((best, face) => depth[face] > depth[best] ? face : best);
}

export function hintText(step: LessonStep, level: number): string {
    if (!level) return "";
    const config = CONFIGURATIONS[step.configuration];
    const area = config.size ** 2;
    if (step.kind === "faces") return level === 1
        ? "Cada lado inteiro colorido é uma face. Gire o cubo para procurar as outras."
        : "Vamos girar e contar apenas as faces coloridas, uma vez cada.";
    if (step.kind === "faceExpression") return level === 1
        ? "Olhe uma face: conte as linhas e os quadradinhos em cada linha."
        : `São ${config.size} linhas com ${config.size} quadradinhos em cada: ${faceExpression(config)}.`;
    if (level === 1) return `Cada face tem ${config.size} linhas de ${config.size}: ${faceExpression(config)} = ${area} quadradinhos.`;
    if (level === 2) return "Conte as faces coloridas. Cada uma é um grupo com a mesma quantidade de quadradinhos.";
    return `São ${config.faces.length} grupos de ${area}. Podemos trocar a soma por ${expression(config)}.`;
}

/** Keep neighboring faces visible while the counted face remains dominant. */
export function countingRotation(face: CubeFace, from: CubeRotation): CubeRotation {
    if (face === "top" || face === "bottom") return { x: nearestAngle(face === "top" ? -65 : 65, from.x), y: from.y };
    const straight = faceRotation(face, from);
    return { x: nearestAngle(-18, from.x), y: nearestAngle(straight.y - 18, from.y) };
}
