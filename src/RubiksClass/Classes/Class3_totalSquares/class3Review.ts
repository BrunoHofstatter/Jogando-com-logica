import { REVIEW_CONFIG as C } from "./class3ReviewConfig";
import { cubeMatches } from "./class3ReviewGeneration";
import { currentRound, projectCube } from "./class3ReviewGeometry";
import type { ReviewAction, ReviewEffect, ReviewState, Round } from "./class3ReviewTypes";

function copy(state: ReviewState): ReviewState {
    return { ...state, rounds: state.rounds.map(round => ({ ...round })), practice: { ...state.practice }, effects: [...state.effects] };
}
function changed(state: ReviewState) { state.revision++; }
function addEffect(state: ReviewState, effect: Omit<ReviewEffect, "id" | "started">) {
    state.effects.push({ ...effect, id: state.nextEffectId++, started: state.inspectionTime });
    changed(state);
}
function requestNext(state: ReviewState, round: Round) {
    if (!round.requested && round.id < C.rounds) {
        round.requested = true; round.spawnAfter = state.approachTime + C.spawnDelay; changed(state);
    }
}
function fulfillSpawn(state: ReviewState) {
    if (state.phase !== "playing" || state.freezeUntil > state.inspectionTime || state.approachTime - state.lastSpawn < C.spawnInterval) return;
    if (state.rounds.filter(round => round.status === "approaching" || round.status === "resolving").length >= 2) return;
    const next = state.rounds.find(round => round.status === "unspawned");
    if (!next || next.id > 1 && !state.rounds[next.id - 2].requested) return;
    if (next.id > 1 && state.approachTime + 1e-9 < state.rounds[next.id - 2].spawnAfter) return;
    next.status = "approaching";
    state.lastSpawn = state.approachTime;
    changed(state);
}
function advanceRound(state: ReviewState, round: Round, result: "hit" | "escaped") {
    round.status = result;
    round.clock = round.clock === "absent" ? "absent" : "gone";
    requestNext(state, round);
    if (result === "hit") state.hits++;
    else { state.escapes++; state.health = Math.max(0, state.health - C.escapeDamage); }
    const next = currentRound(state);
    if (next?.status === "approaching") next.speed = Math.min(next.speed, (1 - next.progress) / C.activeTimeFloor);
    if (state.health === 0) state.phase = "lost";
    else if (!next) state.finishAt = state.inspectionTime + (result === "hit" ? C.successSeconds : C.dustSeconds);
    changed(state);
    fulfillSpawn(state);
}

function resolveHit(state: ReviewState, round: Round) {
    const cube = round.cubes.find(cube => cube.id === round.hitTarget);
    if (!cube || !round.hitPoint) return;
    addEffect(state, { kind: "success", duration: C.successSeconds, point: round.hitPoint, cube });
    for (const other of round.cubes) if (other.id !== cube.id && !round.removed.includes(other.id) && round.id !== 0)
        addEffect(state, { kind: "dust", duration: C.dustSeconds, point: projectCube(other, round.progress) });
    round.resolveAt = null;
    if (state.phase === "practice") {
        round.removed = [...round.removed, cube.id];
        round.status = "unspawned"; state.practiceHits++;
        state.practiceReadyAt = state.inspectionTime + C.spawnDelay;
        changed(state);
    } else advanceRound(state, round, "hit");
}

function tick(state: ReviewState, seconds: number): ReviewState {
    const next = copy(state);
    const frozen = Math.max(0, Math.min(seconds, state.freezeUntil - state.inspectionTime));
    const travel = seconds - frozen;
    next.inspectionTime += seconds;
    next.approachTime += travel;
    const effects = next.effects.filter(effect => next.inspectionTime < effect.started + effect.duration);
    if (effects.length !== next.effects.length) { next.effects = effects; changed(next); }
    if (state.freezeUntil > state.inspectionTime && next.inspectionTime >= state.freezeUntil) changed(next);

    if (next.phase === "practice") {
        if (next.practice.resolveAt !== null && next.inspectionTime + 1e-9 >= next.practice.resolveAt) resolveHit(next, next.practice);
        if (next.practiceReadyAt !== null && next.inspectionTime >= next.practiceReadyAt) {
            next.practiceReadyAt = null; next.lastShot = -Infinity;
            if (next.practiceHits === next.practice.cubes.length) {
                next.phase = "playing"; next.health = C.health;
                next.approachTime = 0; next.lastSpawn = -Infinity; fulfillSpawn(next);
            } else {
                next.practice.status = "approaching"; next.practice.progress = 0;
                next.practice.hitTarget = null; next.practice.hitPoint = null;
            }
            changed(next);
        } else if (next.practice.status === "approaching") next.practice.progress = Math.min(C.practiceStop, next.practice.progress + travel / C.travelSeconds);
        return next;
    }
    if (next.finishAt !== null) {
        if (next.inspectionTime + 1e-9 >= next.finishAt) { next.phase = "won"; changed(next); }
        return next;
    }
    for (const round of next.rounds) if (round.resolveAt !== null && next.inspectionTime + 1e-9 >= round.resolveAt) resolveHit(next, round);
    const active = currentRound(next);
    let ahead = 1.1;
    for (const round of next.rounds) if (round.status === "approaching" || round.status === "resolving") {
        // Stagger never changes ownership or lets a later group overtake the front group.
        round.progress = Math.max(0, Math.min(ahead - 0.1, round.progress + (round.status === "resolving" ? 0 : travel * round.speed)));
        ahead = round.progress;
        if (round.clock === "available") {
            round.clockProgress += travel * C.clockSpeed / C.travelSeconds;
            if (round.clockProgress >= 1) { round.clock = "gone"; changed(next); }
        }
        if (round.progress >= C.successorAt) requestNext(next, round);
    }
    if (active?.status === "approaching" && active.progress >= 1 - 1e-9) {
        active.progress = 1;
        for (const cube of active.cubes) if (!active.removed.includes(cube.id))
            addEffect(next, { kind: "dust", duration: C.dustSeconds, point: projectCube(cube, 1) });
        advanceRound(next, active, "escaped");
    }
    fulfillSpawn(next);
    return next;
}

export function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
    if (action.type === "start") {
        if (state.phase !== "intro") return state;
        return { ...state, phase: "practice", practice: { ...state.practice, status: "approaching" }, revision: state.revision + 1 };
    }
    if (state.phase !== "practice" && state.phase !== "playing") return state;
    if (action.type === "tick") {
        if (!Number.isFinite(action.seconds) || action.seconds <= 0) return state;
        let next = state, remaining = action.seconds;
        // Boundary events remain ordered even when a foreground frame is delayed.
        while (remaining > 1e-9 && (next.phase === "practice" || next.phase === "playing")) {
            const dt = Math.min(0.05, remaining);
            next = tick(next, dt); remaining -= dt;
        }
        return next;
    }
    if (state.finishAt !== null || state.practiceReadyAt !== null && state.phase === "practice"
        || state.inspectionTime - state.lastShot < C.cooldown) return state;
    const next = copy(state);
    next.lastShot = state.inspectionTime;
    addEffect(next, { kind: "pellet", duration: C.projectileSeconds, from: action.from, point: action.point });
    const live = next.phase === "practice" ? next.practice.status === "approaching" ? [next.practice] : [] : next.rounds.filter(round => round.status === "approaching");
    const clock = live.find(round => `clock-${round.id}` === action.target && round.clock === "available");
    if (clock) {
        clock.clock = "collected"; next.freezeUntil = next.inspectionTime + C.freezeSeconds; changed(next);
        addEffect(next, { kind: "dust", duration: C.dustSeconds, point: action.point });
        return next;
    }
    const round = live.find(round => round.cubes.some(cube => cube.id === action.target));
    const cube = round?.cubes.find(cube => cube.id === action.target);
    if (!round || !cube || round.removed.includes(cube.id) || round.reactions[cube.id] > next.inspectionTime
        || next.phase === "practice" && cube.id !== next.practice.cubes[next.practiceHits]?.id) return next;
    const active = next.phase === "practice" ? next.practice : currentRound(next);
    const correct = round.id === active?.id && (next.phase === "practice" || cubeMatches(cube, round.ammo));
    if (correct) {
        round.status = "resolving"; round.hitTarget = cube.id; round.hitPoint = action.point;
        round.resolveAt = next.inspectionTime + C.resolutionSeconds;
        if (next.phase === "playing") requestNext(next, round);
        changed(next);
    } else {
        if (next.phase === "playing") {
            next.health = Math.max(0, next.health - C.wrongDamage); next.wrongShots++;
            if (!next.health) next.phase = "lost";
        }
        if (round.id === active?.id) {
            round.removed = [...round.removed, cube.id];
            addEffect(next, { kind: "wrong", duration: C.reactionSeconds + C.dustSeconds, point: action.point, cube });
        } else round.reactions = { ...round.reactions, [cube.id]: next.inspectionTime + C.reactionSeconds };
        changed(next);
    }
    return next;
}
