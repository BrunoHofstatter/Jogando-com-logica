import type { CubeFace } from "../../Components/RubiksCube";
import type { ReviewColor } from "./class3ReviewConfig";

export interface Ammo { faces: number; squaresPerFace: number }
export type ReviewMotion = "rock" | "sweep" | "spin";
export interface CubeSpec {
    id: string; roundId: number; size: number; faces: CubeFace[];
    slot: number; stagger: number; angle: number; motion: ReviewMotion;
}
export interface Round {
    id: number; ammo: Ammo; cubes: CubeSpec[]; status: "unspawned" | "approaching" | "resolving" | "hit" | "escaped";
    progress: number; speed: number; requested: boolean;
    removed: string[]; reactions: Record<string, number>;
    clock: "absent" | "available" | "collected" | "gone"; clockProgress: number;
    spawnAfter: number; resolveAt: number | null; hitTarget: string | null; hitPoint: Projection | null;
}
export interface Point { x: number; y: number }
/** Normalized x/y/size keep effects stable across viewport changes. */
export interface Projection extends Point { size: number; depth: number }
export interface ReviewEffect {
    id: number; kind: "success" | "wrong" | "dust" | "pellet";
    started: number; duration: number; point: Projection; from?: Point; cube?: CubeSpec;
}
export interface ReviewState {
    phase: "intro" | "practice" | "playing" | "won" | "lost";
    color: ReviewColor; rounds: Round[]; practice: Round;
    health: number; wrongShots: number; escapes: number; hits: number;
    approachTime: number; inspectionTime: number; freezeUntil: number;
    lastSpawn: number; lastShot: number; practiceReadyAt: number | null;
    practiceHits: number; finishAt: number | null;
    effects: ReviewEffect[]; nextEffectId: number; revision: number;
}
export type ReviewAction =
    | { type: "start" }
    | { type: "tick"; seconds: number }
    | { type: "shoot"; target: string | null; point: Projection; from: Point };
