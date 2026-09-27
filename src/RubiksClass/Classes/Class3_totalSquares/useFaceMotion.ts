import { useCallback, useEffect, useRef, useState } from "react";
import type { CubeFace } from "../../Components/RubiksCube";
import type { CubeRotation } from "../../Components/RubiksCubeAnimations";
import { closestFace, faceRotation, faceTour, homeRotation, countingRotation, type Configuration } from "./class3Lesson";
import { rotationCueFrame, type RotationCue } from "./rotationCue";

interface Frame { rotation: CubeRotation; duration: number; face?: CubeFace; count?: number }
const MOVE_MS = 1000;
const HOLD_MS = 1150;

export function useFaceMotion(config: Configuration, reducedMotion: boolean, cue: RotationCue | null, questionKey: number) {
    const current = useRef<CubeRotation>(homeRotation(config));
    const raf = useRef<number | null>(null);
    const [rotation, setRotation] = useState<CubeRotation | null>(null);
    const [mode, setMode] = useState<"idle" | "demo" | "tour" | "focus">("idle");
    const [face, setFace] = useState<CubeFace | null>(null);
    const [count, setCount] = useState(0);
    const [tourFinished, setTourFinished] = useState(false);
    const [dismissedQuestion, setDismissedQuestion] = useState<number | null>(null);
    const [cueFrame, setCueFrame] = useState({ opacity: 0, travel: 0 });
    const generation = useRef(0);
    const cancel = useCallback(() => {
        generation.current++;
        if (raf.current !== null) cancelAnimationFrame(raf.current);
        raf.current = null;
    }, []);
    const stop = useCallback(() => {
        cancel(); setRotation(null); setMode("idle"); setFace(null); setTourFinished(false); setCueFrame({ opacity: 0, travel: 0 });
    }, [cancel]);
    const stopIfCurrent = useCallback((ticket: number) => {
        if (generation.current === ticket) stop();
    }, [stop]);
    const interact = useCallback(() => { setDismissedQuestion(questionKey); stop(); }, [questionKey, stop]);
    const recordRotation = useCallback((value: CubeRotation) => { current.current = value; }, []);
    const play = useCallback((frames: Frame[], nextMode: "demo" | "tour" | "focus") => {
        cancel(); setMode(nextMode); setFace(null); setTourFinished(false); setCueFrame({ opacity: 0, travel: 0 });
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
        cancel(); setDismissedQuestion(questionKey); setTourFinished(false); setCount(0); setFace(null);
        const route = faceTour(config.faces, closestFace(current.current), closestFace({ x: 0, y: current.current.y }));
        const counted = new Set<CubeFace>();
        let position = { ...current.current };
        const frames: Frame[] = [];
        for (const nextFace of route) {
            const target = countingRotation(nextFace, position);
            const pieces = Math.max(1, Math.ceil(Math.max(Math.abs(target.x - position.x), Math.abs(target.y - position.y)) / 90));
            const start = position;
            for (let piece = 1; piece <= pieces; piece++) {
                frames.push({ rotation: { x: start.x + (target.x - start.x) * piece / pieces, y: start.y + (target.y - start.y) * piece / pieces }, duration: reducedMotion ? MOVE_MS * 1.5 : MOVE_MS });
            }
            const isNew = config.faces.includes(nextFace) && !counted.has(nextFace);
            if (isNew) counted.add(nextFace);
            const hold: Frame = { rotation: target, duration: isNew ? HOLD_MS : 150, face: isNew ? nextFace : undefined, count: counted.size };
            frames[frames.length - 1] = { ...frames[frames.length - 1], face: hold.face, count: hold.count };
            frames.push(hold); position = target;
        }
        play(frames, "tour");
    }, [cancel, config, play, questionKey, reducedMotion]);
    const focus = useCallback((flat = false) => {
        setDismissedQuestion(questionKey);
        const target = flat ? faceRotation("front", current.current) : countingRotation("front", current.current);
        if (reducedMotion) {
            stop(); current.current = target; setRotation(target); setFace("front"); setMode("focus");
        } else play([{ rotation: target, duration: MOVE_MS, face: "front" }, { rotation: target, duration: 100, face: "front" }], "focus");
    }, [play, questionKey, reducedMotion, stop]);
    const rotateBy = useCallback((x: number, y: number) => {
        setDismissedQuestion(questionKey);
        const target = { x: current.current.x + x, y: current.current.y + y };
        if (reducedMotion) { stop(); current.current = target; setRotation(target); setMode("focus"); }
        else play([{ rotation: target, duration: 450 }], "focus");
    }, [play, questionKey, reducedMotion, stop]);
    useEffect(() => {
        if (!cue || dismissedQuestion === questionKey) return;
        cancel();
        const ticket = generation.current;
        const start = { ...current.current };
        setMode("demo");
        let previous = 0;
        let elapsed = 0;
        const tick = (now: number) => {
            if (generation.current !== ticket) return;
            if (previous && document.visibilityState === "visible") elapsed += Math.min(now - previous, 50);
            previous = now;
            const sample = rotationCueFrame(elapsed, reducedMotion);
            if (sample.done) { setDismissedQuestion(questionKey); stop(); return; }
            const next = { x: start.x + (cue === "vertical" ? 40 * sample.travel : 0), y: start.y - (cue === "horizontal" ? 24 * sample.travel : 0) };
            current.current = next; setRotation(next); setCueFrame(sample);
            raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => stopIfCurrent(ticket);
    }, [cancel, cue, dismissedQuestion, questionKey, reducedMotion, stop, stopIfCurrent]);
    useEffect(() => cancel, [cancel]);
    const labelRotation = face === "top" ? current.current.y : face === "bottom" ? -current.current.y : 0;
    return { rotation, mode, face, labelRotation, count, tourFinished, cueFrame, stop, interact, recordRotation, tour, focus, rotateBy };
}
