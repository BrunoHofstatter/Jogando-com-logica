import { describe, expect, it } from "vitest";
import { REVIEW_CONFIG as C } from "./class3ReviewConfig";
import { createReviewState, cubeMatches, INSPECTABLE_FACES } from "./class3ReviewGeneration";
import { reviewReducer } from "./class3Review";
import { currentRound, projectCube, resolveAim, sceneTargets, yaw } from "./class3ReviewGeometry";
import { faceTexture } from "./class3ReviewTextures";
import { coloredFaces, inspectableFaces, motionForRound } from "./class3ReviewMotion";
import type { ReviewState } from "./class3ReviewTypes";

const tick = (state: ReviewState, seconds: number) => reviewReducer(state, { type: "tick", seconds });
function shoot(state: ReviewState, id: string | null) {
    const point = sceneTargets(state).find(target => target.id === id)?.point ?? { x: 0.5, y: 0.5, size: 0.08, depth: 0.5 };
    return reviewReducer(state, { type: "shoot", target: id, point, from: { x: 0.5, y: 0.85 } });
}
function main(seed = 1) {
    let state = reviewReducer(createReviewState(seed), { type: "start" });
    for (const cube of state.practice.cubes) {
        state = shoot(state, cube.id);
        state = tick(state, C.resolutionSeconds + C.spawnDelay + 0.05);
    }
    return state;
}
const correctId = (state: ReviewState) => {
    const round = currentRound(state)!;
    return round.cubes.find(cube => cubeMatches(cube, round.ammo))!.id;
};

describe("Class 3 review content", () => {
    it("guarantees meaningful targets and no contradictory next-trio match across seeds", () => {
        for (let seed = 0; seed < 200; seed++) {
            const state = createReviewState(seed);
            expect(state.color).not.toBe("white");
            expect(state.rounds).toHaveLength(10);
            expect(state.rounds.filter(round => round.clock === "available").map(round => round.id)).toEqual([2, 4, 6, 8, 10]);
            expect(new Set(state.rounds.map(round => Math.sqrt(round.ammo.squaresPerFace)))).toEqual(new Set([2, 3, 4, 5, 6]));
            state.rounds.forEach((round, index) => {
                const motion = index < 4 ? "rock" : index < 8 ? "sweep" : "spin";
                const maxFaces = index < 4 ? 3 : index < 8 ? 4 : 5;
                expect(round.cubes).toHaveLength(3);
                expect(round.ammo.faces).toBeLessThanOrEqual(maxFaces);
                expect(round.cubes.filter(cube => cubeMatches(cube, round.ammo))).toHaveLength(1);
                expect(new Set(round.cubes.map(cube => `${cube.size}/${cube.faces.length}`)).size).toBe(3);
                for (const cube of round.cubes) {
                    expect(cube.motion).toBe(motion);
                    expect(cube.faces[0]).toBe("top");
                    expect(cube.faces.length).toBeLessThanOrEqual(maxFaces);
                    expect(cube.faces.every(face => inspectableFaces(cube.motion, cube.angle).includes(face))).toBe(true);
                    expect(cube.faces.every(face => INSPECTABLE_FACES.includes(face))).toBe(true);
                    expect(new Set(cube.faces).size).toBe(cube.faces.length);
                    if (index) expect(cubeMatches(cube, state.rounds[index - 1].ammo)).toBe(false);
                }
                if (motion !== "spin") expect(new Set(round.cubes.map(cube => cube.angle)).size).toBe(1);
                const targetSize = Math.sqrt(round.ammo.squaresPerFace);
                const ring = ["front", "right", "back", "left"];
                for (const cube of round.cubes) {
                    const sides = cube.faces.slice(1);
                    for (let i = 1; i < sides.length; i++) {
                        const distance = Math.abs(ring.indexOf(sides[i]) - ring.indexOf(sides[i - 1]));
                        expect(distance === 1 || distance === 3).toBe(true);
                    }
                    if (cube.faces.length !== round.ammo.faces) {
                        const clearerAvailable = Array.from({ length: maxFaces }, (_, i) => i + 1).some(count =>
                            Math.abs(count - round.ammo.faces) >= 2 && !(index && cube.size ** 2 === state.rounds[index - 1].ammo.squaresPerFace
                                && count === state.rounds[index - 1].ammo.faces));
                        if (clearerAvailable) expect(Math.abs(cube.faces.length - round.ammo.faces)).toBeGreaterThanOrEqual(2);
                    }
                    if (cube.size !== targetSize && cube.faces.length === round.ammo.faces) expect(cubeMatches(cube, round.ammo)).toBe(false);
                }
            });
        }
    });
    it("bounds face masks to their movement and keeps the top plus adjacent sides", () => {
        for (const [id, angle] of [[1, -30], [4, 30], [5, 0], [8, 0], [9, 0], [10, 0]]) {
            const motion = motionForRound(id);
            const allowed = inspectableFaces(motion, angle);
            for (let count = 1; count <= allowed.length; count++) for (const random of [0, 0.3, 0.7, 0.999]) {
                const mask = coloredFaces(motion, angle, count, () => random);
                expect(mask[0]).toBe("top"); expect(mask).toHaveLength(count);
                expect(mask.every(face => allowed.includes(face))).toBe(true);
                expect(mask).not.toContain("bottom");
            }
            expect(() => coloredFaces(motion, angle, allowed.length + 1, () => 0)).toThrow();
        }
    });
    it("preserves exact grids with six reusable texture faces instead of sticker elements", () => {
        for (const size of [2, 3, 4, 5, 6]) {
            const url = faceTexture(size, "orange", false);
            expect(faceTexture(size, "orange", false)).toBe(url);
            const svg = decodeURIComponent(url.split(",")[1]);
            expect(svg.match(/<rect /g)).toHaveLength(size * size + 1);
            expect(svg).toContain("#f18826");
            expect(decodeURIComponent(faceTexture(size, "orange", true).split(",")[1])).toContain("#aeb4bc");
        }
    });
});

describe("Class 3 review rounds", () => {
    it("requires two different centered practice cubes sequentially, with no penalty or deadline", () => {
        let state = reviewReducer(createReviewState(2), { type: "start" });
        const [first, second] = state.practice.cubes;
        expect(first.size).not.toBe(second.size);
        expect(sceneTargets(state).map(target => target.id)).toEqual([first.id]);
        expect(sceneTargets(state)[0].point.x).toBe(0.5);
        state = shoot(state, null);
        state = tick(state, 60);
        expect(state.practice.progress).toBe(C.practiceStop);
        expect(state.health).toBe(9); expect(state.wrongShots).toBe(0); expect(state.escapes).toBe(0);
        state = shoot(state, first.id);
        expect(state.practice.status).toBe("resolving");
        expect(sceneTargets(state)).toHaveLength(0);
        state = tick(state, C.resolutionSeconds + 0.05);
        expect(state.practiceHits).toBe(1); expect(state.phase).toBe("practice");
        expect(sceneTargets(state)).toHaveLength(0);
        state = tick(state, C.spawnDelay);
        expect(sceneTargets(state).map(target => target.id)).toEqual([second.id]);
        expect(state.practice.progress).toBeLessThan(0.01);
        state = shoot(state, second.id);
        state = tick(state, C.resolutionSeconds + C.spawnDelay + 0.05);
        expect(state.phase).toBe("playing"); expect(state.health).toBe(9);
        expect(state.rounds[0].status).toBe("approaching");
        expect(state.rounds.slice(1).every(round => round.status === "unspawned")).toBe(true);
    });
    it("charges one wrong hit once, removes only the current distractor, and keeps current ammo", () => {
        let state = main();
        const round = currentRound(state)!;
        const wrong = round.cubes.find(cube => !cubeMatches(cube, round.ammo))!;
        state = shoot(state, wrong.id);
        expect(state.health).toBe(8); expect(state.wrongShots).toBe(1);
        expect(state.rounds[0].removed).toContain(wrong.id);
        expect(currentRound(state)?.ammo).toEqual(round.ammo);
        expect(shoot(state, wrong.id)).toBe(state);
        state = tick(state, C.cooldown);
        state = shoot(state, wrong.id);
        expect(state.health).toBe(8); expect(state.wrongShots).toBe(1);
        state = shoot(tick(state, C.cooldown), null);
        expect(state.health).toBe(8);
    });
    it("allows two shootable trios but preserves every later cube and the oldest ammo", () => {
        let state = tick(main(), 17);
        expect(state.rounds.filter(round => round.status === "approaching")).toHaveLength(2);
        const oldAmmo = currentRound(state)!.ammo;
        const laterTarget = state.rounds[1].cubes.find(cube => cubeMatches(cube, state.rounds[1].ammo))!;
        state = shoot(state, laterTarget.id);
        expect(state.health).toBe(8); expect(state.rounds[1].removed).not.toContain(laterTarget.id);
        expect(state.rounds[1].status).toBe("approaching"); expect(currentRound(state)?.ammo).toEqual(oldAmmo);
        state = shoot(tick(state, C.cooldown), correctId(state));
        expect(state.rounds[0].status).toBe("resolving");
        expect(currentRound(state)?.ammo).toEqual(oldAmmo);
        state = tick(state, C.resolutionSeconds);
        expect(state.rounds[0].status).toBe("hit"); expect(currentRound(state)?.id).toBe(2);
        expect(currentRound(state)?.ammo).toEqual(state.rounds[1].ammo);
        state = tick(shoot(tick(state, C.cooldown), laterTarget.id), C.resolutionSeconds);
        expect(state.rounds[1].status).toBe("hit"); expect(state.hits).toBe(2);
    });
    it("requests one successor at the threshold and never duplicates it on a hit", () => {
        let state = tick(main(), 17);
        state = shoot(state, correctId(state));
        expect(state.rounds[1].status).toBe("approaching");
        expect(state.rounds[2].status).toBe("unspawned");
        state = tick(state, 2);
        expect(state.rounds.filter(round => round.status === "approaching").length).toBeLessThanOrEqual(2);
        expect(state.rounds.map(round => round.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
    it("honors spawn spacing when a target is hit immediately", () => {
        let state = shoot(main(), correctId(main()));
        expect(currentRound(state)?.status).toBe("resolving");
        expect(state.effects.some(effect => effect.kind === "success" || effect.kind === "dust")).toBe(false);
        state = tick(state, 0.5);
        expect(currentRound(state)?.status).toBe("resolving");
        state = tick(state, 0.1);
        expect(currentRound(state)?.status).toBe("unspawned");
        expect(state.effects.filter(effect => effect.kind === "dust")).toHaveLength(2);
        state = tick(state, 1);
        expect(currentRound(state)?.status).toBe("approaching");
    });
    it("escapes once, advances ammo, and loses after three full-heart leaks", () => {
        let state = main();
        state = tick(state, 28);
        expect(state.escapes).toBe(1); expect(state.health).toBe(6); expect(currentRound(state)?.id).toBe(2);
        state = tick(state, 100);
        expect(state.phase).toBe("lost"); expect(state.health).toBe(0); expect(state.escapes).toBe(3);
        expect(tick(state, 50)).toBe(state); expect(shoot(state, "clock-4")).toBe(state);
    });
    it("finishes ten rounds only after the last green cube has been shown", () => {
        let state = main();
        for (let i = 0; i < 10; i++) {
            state = tick(state, 2);
            state = shoot(state, correctId(state));
            state = tick(state, C.resolutionSeconds);
        }
        expect(state.phase).toBe("playing"); expect(state.hits).toBe(10);
        expect(state.effects.some(effect => effect.kind === "success")).toBe(true);
        state = tick(state, C.successSeconds);
        expect(state.phase).toBe("won"); expect(state.health).toBe(9);
        expect(currentRound(state)).toBeUndefined();
        expect(state.rounds).toHaveLength(10);
    });
    it("prioritizes zero health over resolving the last round", () => {
        let state = main();
        for (let i = 0; i < 9; i++) { state = tick(state, 2); state = tick(shoot(state, correctId(state)), C.resolutionSeconds); }
        state = tick({ ...state, health: 3 }, 40);
        expect(state.phase).toBe("lost"); expect(state.rounds[9].status).toBe("escaped");
    });
});

describe("Class 3 clocks and geometry", () => {
    it("freezes travel and spawning for five seconds while inspection continues", () => {
        let state = tick(main(), 17);
        state = shoot(state, "clock-2");
        const progress = state.rounds.map(round => round.progress), time = state.inspectionTime;
        expect(state.health).toBe(9); expect(state.rounds[1].clock).toBe("collected");
        state = tick(state, 4.9);
        expect(state.inspectionTime - time).toBeCloseTo(4.9);
        expect(state.rounds.map(round => round.progress)).toEqual(progress);
        expect(yaw(state.rounds[0].cubes[0], state.inspectionTime)).not.toBeCloseTo(yaw(state.rounds[0].cubes[0], time));
        state = tick(state, 0.2);
        expect(state.rounds[0].progress).toBeGreaterThan(progress[0]);
    });
    it("permits hits during a freeze but defers a new trio until it ends", () => {
        let state = shoot(tick(main(), 17), "clock-2");
        state = shoot(tick(state, 0.5), correctId(state));
        state = tick(state, C.resolutionSeconds);
        state = tick(shoot(state, correctId(state)), C.resolutionSeconds);
        expect(state.rounds[2].status).toBe("unspawned");
        state = tick(state, 5);
        expect(state.rounds[2].status).toBe("approaching");
    });
    it("keeps paths ordered and allows repeated inspection cycles in every movement style", () => {
        for (const p of [0, 0.2, 0.5, 0.8, 1]) {
            const points = [0, 1, 2].map(slot => projectCube({ slot, stagger: 0 }, p));
            expect(points[0].x).toBeLessThan(points[1].x); expect(points[1].x).toBeLessThan(points[2].x);
            expect(points.every(point => point.y < 0.8 && point.size >= 0.056)).toBe(true);
        }
        expect((1 - C.readableAt) * C.travelSeconds / C.turnSeconds).toBeGreaterThan(2);
        expect((1 - C.readableAt) * C.travelSeconds / C.sweepSeconds).toBeGreaterThan(2);
        expect((1 - C.readableAt) * C.travelSeconds / C.rockSeconds).toBeGreaterThan(2);
    });
    it("rocks within three faces, sweeps through four without showing the back, and spins only at the end", () => {
        const examples = [
            { motion: "rock" as const, angle: -30, faces: ["top", "front", "right"] },
            { motion: "rock" as const, angle: 30, faces: ["top", "front", "left"] },
            { motion: "sweep" as const, angle: 0, faces: ["top", "front", "left", "right"] },
            { motion: "spin" as const, angle: 24, faces: ["top", "front", "right", "back", "left"] },
        ];
        for (const cube of examples) {
            const seen = new Set(["top"]);
            for (let time = 0; time <= 30; time += 0.1) {
                const angle = yaw(cube, time), radians = angle * Math.PI / 180;
                const normals = { front: Math.cos(radians), back: -Math.cos(radians), right: -Math.sin(radians), left: Math.sin(radians) };
                for (const [face, normal] of Object.entries(normals)) if (normal > 0.01) seen.add(face);
                if (cube.motion === "rock") expect(Math.abs(angle - cube.angle)).toBeLessThanOrEqual(C.rockDegrees + 1e-9);
                if (cube.motion === "sweep") expect(Math.abs(angle)).toBeLessThanOrEqual(C.sweepDegrees + 1e-9);
            }
            expect(seen).toEqual(new Set(cube.faces));
        }
        const rock = examples[0], sweep = examples[2], spin = examples[3];
        expect(yaw(rock, 0)).toBeCloseTo(yaw(rock, C.rockSeconds));
        expect(yaw(sweep, 0)).toBeCloseTo(yaw(sweep, C.sweepSeconds));
        expect(yaw(sweep, 1)).toBeGreaterThan(yaw(sweep, 0));
        expect(yaw(sweep, 4)).toBeLessThan(yaw(sweep, 3));
        expect(yaw(spin, C.turnSeconds) - yaw(spin, 0)).toBeCloseTo(360);
    });
    it("prioritizes an actual visible front cube over overlapping assistance", () => {
        const front = { id: "front", point: { x: 0.5, y: 0.5, size: 0.1, depth: 0.8 } };
        const back = { id: "back", point: { x: 0.5, y: 0.5, size: 0.1, depth: 0.2 } };
        expect(resolveAim([back, front], { x: 0.5, y: 0.5 }, 1.5)).toBe("front");
        expect(resolveAim([front], { x: 0.58, y: 0.5 }, 1.5)).toBe("front");
        expect(resolveAim([front], { x: 0.9, y: 0.9 }, 1.5)).toBeNull();
    });
});
