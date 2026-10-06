import type { CubeFace } from "../../Components/RubiksCube";
import type { ReviewMotion } from "./class3ReviewTypes";

/** Practice and the first four rounds keep the same three faces in view. */
export function motionForRound(id: number): ReviewMotion {
    return id <= 4 ? "rock" : id <= 8 ? "sweep" : "spin";
}

/** The top is always inspectable; the bottom is never part of the game masks. */
export function inspectableFaces(motion: ReviewMotion, angle: number): CubeFace[] {
    if (motion === "rock") return ["top", "front", angle < 0 ? "right" : "left"];
    if (motion === "sweep") return ["top", "left", "front", "right"];
    return ["top", "front", "right", "back", "left"];
}

/** Top-first masks with a contiguous run of lateral faces, never scattered sides. */
export function coloredFaces(motion: ReviewMotion, angle: number, count: number, random: () => number): CubeFace[] {
    const sides = inspectableFaces(motion, angle).slice(1);
    if (!Number.isInteger(count) || count < 1 || count > sides.length + 1) throw new Error("Face count exceeds the movement's inspectable faces");
    const sideCount = count - 1;
    if (!sideCount) return ["top"];
    const start = Math.floor(random() * (motion === "spin" ? sides.length : sides.length - sideCount + 1));
    return ["top", ...Array.from({ length: sideCount }, (_, index) => sides[(start + index) % sides.length])];
}
