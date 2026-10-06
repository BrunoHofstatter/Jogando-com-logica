import type { CubeFace } from "../../Components/RubiksCube";
import { REVIEW_COLORS, REVIEW_CONFIG } from "./class3ReviewConfig";
import { coloredFaces, inspectableFaces, motionForRound } from "./class3ReviewMotion";
import type { Ammo, CubeSpec, ReviewState, Round } from "./class3ReviewTypes";

export const INSPECTABLE_FACES: CubeFace[] = ["front", "right", "back", "left", "top"];
export const ALL_CUBE_FACES: CubeFace[] = ["front", "back", "right", "left", "top", "bottom"];
export function seededRandom(seed: number) {
    let value = seed >>> 0;
    return () => {
        value += 0x6d2b79f5;
        let t = Math.imul(value ^ value >>> 15, 1 | value);
        t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
function pick<T>(items: readonly T[], random: () => number): T { return items[Math.floor(random() * items.length)]; }
export function shuffled<T>(items: readonly T[], random: () => number): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
export const cubeMatches = (cube: Pick<CubeSpec, "size" | "faces">, ammo: Ammo) =>
    cube.size ** 2 === ammo.squaresPerFace && cube.faces.length === ammo.faces;

export function makeRound(id: number, specs: { size: number; count: number }[], random: () => number, ammo?: Ammo): Round {
    const target = specs[0];
    const motion = motionForRound(id);
    // Shared rocking angle prevents motion/visibility from identifying the target.
    const angle = motion === "rock" ? pick([-30, 30], random) : 0;
    const cubes = shuffled(specs, random).map(({ size, count }, slot): CubeSpec => ({
        id: `r${id}-c${slot}`, roundId: id, size, slot, motion,
        faces: coloredFaces(motion, angle, count, random),
        stagger: (random() - 0.5) * 0.035, angle: motion === "spin" ? random() * 360 : angle,
    }));
    return { id, ammo: ammo ?? { faces: target.count, squaresPerFace: target.size ** 2 },
        cubes, status: "unspawned", progress: 0, speed: 1 / REVIEW_CONFIG.travelSeconds,
        requested: false, removed: [], reactions: {},
        clock: id > 0 && id % 2 === 0 ? "available" : "absent", clockProgress: 0,
        spawnAfter: 0, resolveAt: null, hitTarget: null, hitPoint: null };
}

export function generateDeck(random: () => number): Round[] {
    const first = pick([2, 3], random);
    const sizes = [first, ...shuffled([2, 3, 4, 5, 6].filter(size => size !== first), random)];
    const rounds: Round[] = [];
    for (let index = 0; index < REVIEW_CONFIG.rounds; index++) {
        const size = sizes[index % sizes.length];
        const maxFaces = inspectableFaces(motionForRound(index + 1), -30).length;
        let count = 1 + Math.floor(random() * maxFaces);
        const previous = rounds[index - 1]?.ammo;
        if (previous?.squaresPerFace === size ** 2 && previous.faces === count) count = count % maxFaces + 1;
        // Enumerate a finite pool: generation never relies on repeated lucky rolls.
        const pools = [0, 1, 2].map(strategy => {
            const candidates: { size: number; count: number }[] = [];
            for (let otherSize = 2; otherSize <= 6; otherSize++) for (let otherCount = 1; otherCount <= maxFaces; otherCount++) {
                const category = otherSize === size ? 0 : otherCount === count ? 1 : 2;
                if (otherSize === size && otherCount === count || category !== strategy) continue;
                if (previous && otherSize ** 2 === previous.squaresPerFace && otherCount === previous.faces) continue;
                candidates.push({ size: otherSize, count: otherCount });
            }
            // Prefer an obvious count discrepancy, but keep a finite fallback when
            // e.g. a two-face target in a three-face view only has one-face differences.
            const clearer = candidates.filter(candidate => Math.abs(candidate.count - count) >= 2);
            return clearer.length ? clearer : candidates;
        });
        // At least two rounds discriminate each factor; vary which third strategy occurs.
        const categories = index % 2 === 0 ? [0, 1] : shuffled([0, 1, 2], random).slice(0, 2);
        rounds.push(makeRound(index + 1, [{ size, count }, ...categories.map(category => pick(pools[category], random))], random));
    }
    return rounds;
}

export function createReviewState(seed = Math.floor(Math.random() * 0xffffffff)): ReviewState {
    const random = seededRandom(seed);
    return {
        phase: "intro" as const, color: pick(REVIEW_COLORS, random), rounds: generateDeck(random),
        practice: { ...makeRound(0, [{ size: 3, count: 1 }, { size: 4, count: 2 }], random),
            cubes: [3, 4].map((size, index) => ({ id: `practice-${index}`, roundId: 0, size,
                faces: coloredFaces("rock", -30, index + 1, random), slot: 1, stagger: 0, angle: -30, motion: "rock" as const })) },
        health: REVIEW_CONFIG.health, wrongShots: 0, escapes: 0, hits: 0,
        approachTime: 0, inspectionTime: 0, freezeUntil: 0, lastSpawn: -Infinity,
        lastShot: -Infinity, practiceReadyAt: null, practiceHits: 0, finishAt: null,
        effects: [], nextEffectId: 0, revision: 0,
    };
}
