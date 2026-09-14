import { useCallback, useEffect, useRef, useState } from "react";
import type { CubeFace } from "../../Components/RubiksCube";
import type { CubeRotation } from "../../Components/RubiksCubeAnimations";
import { closestFace, faceRotation, faceTour, INITIAL_ROTATION, type Configuration } from "./class3Lesson";

interface Frame { rotation: CubeRotation; duration: number; face?: CubeFace; count?: number }
const MOVE_MS = 1000;
const HOLD_MS = 1150;

export function useFaceMotion(config: Configuration, reducedMotion: boolean) {
    const current = useRef<CubeRotation>(INITIAL_ROTATION);
    const raf = useRef<number | null>(null);
    const manualFrames = useRef<Frame[]>([]);
    const [rotation, setRotation] = useState<CubeRotation | null>(null);
    const [mode, setMode] = useState<"idle" | "demo" | "tour" | "focus">("idle");
    const [face, setFace] = useState<CubeFace | null>(null);
    const [count, setCount] = useState(0);
    const [tourFinished, setTourFinished] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const cancel = useCallback(() => {
        if (raf.current !== null) cancelAnimationFrame(raf.current);
        raf.current = null; manualFrames.current = [];
    }, []);
    const stop = useCallback(() => {
        cancel(); setRotation(null); setMode("idle"); setFace(null); setTourFinished(false);
    }, [cancel]);
    const interact = useCallback(() => { setHasInteracted(true); stop(); }, [stop]);
    const recordRotation = useCallback((value: CubeRotation) => { current.current = value; }, []);
    const play = useCallback((frames: Frame[], nextMode: "demo" | "tour" | "focus") => {
        cancel(); setMode(nextMode); setFace(null); setTourFinished(false);
        if (nextMode === "tour") setCount(0);
        let index = 0;
        let elapsed = 0;
        let previous = 0;
        let from = { ...current.current };
        const tick = (now: number) => {
            const frame = frames[index];
            if (!frame) {
                raf.current = null; setRotation(null); setMode("idle");
                if (nextMode === "tour") setTourFinished(true);
                return;
            }
            if (previous && document.visibilityState === "visible") elapsed += Math.min(now - previous, 50);
            previous = now;
            const progress = Math.min(1, elapsed / frame.duration);
            const ease = progress * progress * (3 - 2 * progress);
            const next = { x: from.x + (frame.rotation.x - from.x) * ease, y: from.y + (frame.rotation.y - from.y) * ease };
            current.current = next; setRotation(next);
            if (progress === 1) {
                if (frame.face) setFace(frame.face);
                if (frame.count !== undefined) setCount(frame.count);
                index++; elapsed = 0; from = next;
                if (frames[index] && (frames[index].rotation.x !== next.x || frames[index].rotation.y !== next.y)) setFace(null);
            }
            raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
    }, [cancel]);
    const tour = useCallback(() => {
        cancel(); setHasInteracted(true); setTourFinished(false); setCount(0); setFace(null);
        const route = faceTour(config.faces, closestFace(current.current), closestFace({ x: 0, y: current.current.y }));
        const counted = new Set<CubeFace>();
        let position = { ...current.current };
        const frames: Frame[] = [];
        const stops: Frame[] = [];
        for (const nextFace of route) {
            const target = faceRotation(nextFace, position);
            const pieces = Math.max(1, Math.ceil(Math.max(Math.abs(target.x - position.x), Math.abs(target.y - position.y)) / 90));
            const start = position;
            for (let piece = 1; piece <= pieces; piece++) {
                frames.push({ rotation: { x: start.x + (target.x - start.x) * piece / pieces, y: start.y + (target.y - start.y) * piece / pieces }, duration: MOVE_MS });
            }
            const isNew = config.faces.includes(nextFace) && !counted.has(nextFace);
            if (isNew) counted.add(nextFace);
            const hold: Frame = { rotation: target, duration: isNew ? HOLD_MS : 150, face: isNew ? nextFace : undefined, count: counted.size };
            frames[frames.length - 1] = { ...frames[frames.length - 1], face: hold.face, count: hold.count };
            frames.push(hold); stops.push(hold); position = target;
        }
        if (reducedMotion) {
            manualFrames.current = stops; setMode("tour");
            const first = manualFrames.current.shift()!;
            current.current = first.rotation; setRotation(first.rotation); setFace(first.face ?? null); setCount(first.count ?? 0);
        } else play(frames, "tour");
    }, [cancel, config, play, reducedMotion]);
    const nextFace = useCallback(() => {
        const next = manualFrames.current.shift();
        if (!next) { stop(); setTourFinished(true); return; }
        current.current = next.rotation; setRotation(next.rotation); setFace(next.face ?? null); setCount(next.count ?? 0);
    }, [stop]);
    const focus = useCallback(() => {
        setHasInteracted(true);
        const target = faceRotation("front", current.current);
        if (reducedMotion) {
            stop(); current.current = target; setRotation(target); setFace("front"); setMode("focus");
        } else play([{ rotation: target, duration: MOVE_MS, face: "front" }, { rotation: target, duration: 100, face: "front" }], "focus");
    }, [play, reducedMotion, stop]);
    const rotateBy = useCallback((x: number, y: number) => {
        setHasInteracted(true);
        const target = { x: current.current.x + x, y: current.current.y + y };
        if (reducedMotion) { stop(); current.current = target; setRotation(target); setMode("focus"); }
        else play([{ rotation: target, duration: 450 }], "focus");
    }, [play, reducedMotion, stop]);
    useEffect(() => {
        if (reducedMotion || hasInteracted) return;
        const start = { ...current.current };
        const shifted = { x: start.x, y: start.y - 22 };
        const secondGesture = config.faces.includes("bottom") ? { x: start.x + 36, y: start.y } : shifted;
        play([
            { rotation: start, duration: 800 }, { rotation: shifted, duration: 1400 },
            { rotation: start, duration: 1100 }, { rotation: start, duration: 5500 },
            { rotation: secondGesture, duration: 1400 }, { rotation: start, duration: 1100 },
        ], "demo");
    }, [cancel, config.faces, hasInteracted, play, reducedMotion]);
    useEffect(() => cancel, [cancel]);
    useEffect(() => { if (reducedMotion) stop(); }, [reducedMotion, stop]);
    const labelRotation = face === "top" ? current.current.y : face === "bottom" ? -current.current.y : 0;
    return { rotation, mode, face, labelRotation, count, tourFinished, hasInteracted, stop, interact, recordRotation, tour, nextFace, focus, rotateBy };
}
