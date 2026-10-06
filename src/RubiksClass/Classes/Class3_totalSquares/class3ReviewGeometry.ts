import { REVIEW_CONFIG } from "./class3ReviewConfig";
import type { CubeSpec, Point, Projection, ReviewState, Round } from "./class3ReviewTypes";

export function projectCube(cube: Pick<CubeSpec, "slot" | "stagger">, progress: number): Projection {
    const p = Math.max(0, Math.min(1, progress));
    const lane = cube.slot - 1;
    const halfWidth = 0.39 * (1 - p) ** 1.65 + 0.15 * p;
    return { x: 0.5 + lane * halfWidth, y: 0.2 + 0.58 * p + cube.stagger,
        size: 0.056 + 0.025 * p + 0.039 * p * p, depth: p };
}
export function projectClock(round: Round): Projection {
    const p = Math.min(1, round.clockProgress);
    return { x: 0.68 - 0.10 * p, y: 0.14 + 0.61 * p, size: 0.039 + p * 0.033, depth: p };
}
export function currentRound(state: ReviewState): Round | undefined {
    return state.rounds.find(round => round.status === "unspawned" || round.status === "approaching" || round.status === "resolving");
}
export function visibleCubes(round: Round, state: ReviewState) {
    return round.cubes.filter((cube, index) => !round.removed.includes(cube.id)
        && (round.id !== 0 || index === state.practiceHits));
}
export function sceneTargets(state: ReviewState): { id: string; point: Projection }[] {
    const rounds = state.phase === "practice" ? state.practice.status === "approaching" ? [state.practice] : [] : state.rounds.filter(round => round.status === "approaching");
    const result = rounds.flatMap(round => visibleCubes(round, state)
        .filter(cube => !round.removed.includes(cube.id) && !(round.reactions[cube.id] > state.inspectionTime))
        .map(cube => ({ id: cube.id, point: projectCube(cube, round.progress) })));
    for (const round of rounds) if (round.clock === "available" && round.id !== 0)
        result.push({ id: `clock-${round.id}`, point: projectClock(round) });
    return result;
}
/** Use aspect-correct distances: one normalized cube size means a fraction of width. */
export function resolveAim(targets: { id: string; point: Projection }[], pointer: Point, aspect: number): string | null {
    const candidates = targets.map(target => {
        const dx = (pointer.x - target.point.x) / target.point.size;
        const dy = (pointer.y - target.point.y) / (target.point.size * aspect);
        const distance = Math.hypot(dx, dy);
        const direct = Math.abs(dx) <= 0.7 && Math.abs(dy) <= 0.8;
        // Visible cube first, then a small margin. Do not use huge rectangular regions.
        const radius = Math.min(1.15, Math.max(0.9, 0.012 / target.point.size));
        return { ...target, distance, direct, eligible: direct || distance < radius };
    }).filter(target => target.eligible);
    candidates.sort((a, b) => Number(b.direct) - Number(a.direct)
        || (a.direct && b.direct ? b.point.depth - a.point.depth : a.distance - b.distance)
        || b.point.depth - a.point.depth);
    return candidates[0]?.id ?? null;
}
export function cannonAim(pointer: Point, aspect: number) {
    // Match the SVG's 50,70 pivot and 50,19 muzzle in its 100×110 artboard.
    const pivotY = 1 - 0.30 + 0.30 * 70 / 110;
    const reach = 0.30 * 51 / 110;
    const angle = Math.max(-70, Math.min(70, Math.atan2((pointer.x - 0.5) * aspect, pivotY - pointer.y) * 180 / Math.PI));
    const radians = angle * Math.PI / 180;
    return { angle, muzzle: { x: 0.5 + Math.sin(radians) * reach / aspect, y: pivotY - Math.cos(radians) * reach } };
}
export function yaw(cube: Pick<CubeSpec, "angle" | "motion">, time: number) {
    if (cube.motion === "rock") return cube.angle + Math.sin(time * 2 * Math.PI / REVIEW_CONFIG.rockSeconds) * REVIEW_CONFIG.rockDegrees;
    if (cube.motion === "sweep") return Math.sin(time * 2 * Math.PI / REVIEW_CONFIG.sweepSeconds) * REVIEW_CONFIG.sweepDegrees;
    return cube.angle + time * 360 / REVIEW_CONFIG.turnSeconds;
}
