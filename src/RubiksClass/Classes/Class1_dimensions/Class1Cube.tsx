import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import RubiksCube, { type RubiksCubeProps } from "../../Components/RubiksCube";
import type { CubeRotation } from "../../Components/RubiksCubeAnimations";
import { useReducedMotion } from "../../Components/useReducedMotion";
import { CUE_DELAY_MS, CUE_PASS_MS, CUE_GAP_MS, rotationCueFrame } from "../Class3_totalSquares/rotationCue";
import cueStyles from "../Class3_totalSquares/Class3TotalSquares.module.css";
import styles from "./Class1Cube.module.css";

const HOME = { x: -22, y: -32 };
interface Props extends Pick<RubiksCubeProps, "size" | "cubeSize" | "highlightRegion" | "dimInactive" | "showCounting" | "rowGuides" | "hintAnimationKey"> {
    label?: string; demo?: boolean; onRotate?: () => void;
    focusRequest?: number; initialRotation?: CubeRotation;
    onSelect?: () => void; selected?: boolean; disabled?: boolean;
}
/** Class 1 owns its camera: stationary inspection, repeatable help, and drag-versus-click selection. */
export function Class1Cube({ label = "Cubo. Arraste ou use as setas para girar.", demo = false, onRotate,
    focusRequest = 0, initialRotation = HOME, onSelect, selected, disabled = false, ...cube }: Props) {
    const reduced = useReducedMotion();
    const [rotation, setRotation] = useState(initialRotation);
    const current = useRef(initialRotation);
    const [holding, setHolding] = useState(false);
    const [frame, setFrame] = useState({ opacity: 0, travel: 0 });
    const pointer = useRef<{ id: number; x: number; y: number; distance: number } | null>(null);
    const dragged = useRef(false);
    const [practiced, setPracticed] = useState(false);
    const update = (value: CubeRotation) => { current.current = value; setRotation(value); };
    useEffect(() => {
        if (focusRequest > 0) { current.current = HOME; setRotation(HOME); }
    }, [focusRequest]);
    useEffect(() => {
        setFrame({ opacity: 0, travel: 0 });
        if (!demo || holding || practiced || disabled) return;
        let request = 0, previous = 0, elapsed = 0;
        const start = { ...current.current };
        const cycle = CUE_DELAY_MS + 2 * (CUE_PASS_MS + CUE_GAP_MS);
        const tick = (now: number) => {
            if (previous && document.visibilityState === "visible") elapsed += Math.min(now - previous, 50);
            previous = now;
            const sample = rotationCueFrame(elapsed % cycle, reduced);
            const value = { x: start.x, y: start.y - 24 * sample.travel };
            current.current = value; setRotation(value); setFrame(sample);
            request = requestAnimationFrame(tick);
        };
        request = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(request);
    }, [demo, holding, reduced, disabled, practiced]);
    const practice = () => { setPracticed(true); setFrame({ opacity: 0, travel: 0 }); onRotate?.(); };
    const onPointerDown = (event: PointerEvent<HTMLElement>) => {
        if (disabled || event.button !== 0 || pointer.current) return;
        dragged.current = false;
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, distance: 0 };
        event.currentTarget.setPointerCapture(event.pointerId);
        setHolding(true);
    };
    const onPointerMove = (event: PointerEvent<HTMLElement>) => {
        const previous = pointer.current;
        if (!previous || previous.id !== event.pointerId) return;
        const dx = event.clientX - previous.x, dy = event.clientY - previous.y;
        previous.x = event.clientX; previous.y = event.clientY; previous.distance += Math.abs(dx) + Math.abs(dy);
        if (previous.distance <= 6) return;
        if (!dragged.current) { dragged.current = true; practice(); }
        update({ x: current.current.x - dy * 0.3, y: current.current.y + dx * 0.3 });
    };
    const finish = (event: PointerEvent<HTMLElement>, cancelled = false) => {
        if (pointer.current?.id !== event.pointerId) return;
        if (cancelled) dragged.current = true;
        pointer.current = null; setHolding(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };
    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        const directions: Record<string, [number, number]> = { ArrowLeft: [0, -20], ArrowRight: [0, 20], ArrowUp: [-20, 0], ArrowDown: [20, 0] };
        const delta = directions[event.key];
        if (!delta || disabled) return;
        event.preventDefault(); practice();
        update({ x: current.current.x + delta[0], y: current.current.y + delta[1] });
    };
    const content = <>
        <span className={styles.visual} aria-hidden="true">
            <RubiksCube {...cube} autoRotate={false} disableInteraction scriptedRotation={rotation} scriptedMotionIsFrameBased />
        </span>
        {demo && frame.opacity > 0 && <span className={cueStyles.rotationDemo} style={{ opacity: frame.opacity }} aria-hidden="true">
            <span className={cueStyles.rotationTooltip}>Arraste o cubo para girar</span>
            <span className={cueStyles.dragCue} style={{ transform: `translateX(${-frame.travel * 5}vw)` }}>
                <span className={cueStyles.dragContact} />
                <svg viewBox="0 0 34 36" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19V6a3 3 0 0 1 6 0v7a3 3 0 0 1 6 0v2a3 3 0 0 1 6 0v3a2 2 0 0 1 4 0v7c0 6-4 9-10 9h-3c-4 0-6-2-8-5l-7-9a3 3 0 0 1 4-4Z" />
                    <path d="M15 13v8m6-6v7m6-4v5" fill="none" />
                </svg>
            </span>
        </span>}
    </>;
    const props = {
        className: styles.stage, style: { "--stage-size": `${cube.cubeSize ?? 22}vw` } as CSSProperties,
        "aria-label": label, onPointerDown, onPointerMove, onPointerUp: (event: PointerEvent<HTMLElement>) => finish(event),
        onPointerCancel: (event: PointerEvent<HTMLElement>) => finish(event, true),
        onLostPointerCapture: (event: PointerEvent<HTMLElement>) => finish(event, true), onKeyDown,
    };
    return onSelect ? <button {...props} data-cube-select type="button" disabled={disabled} aria-pressed={selected}
        onClick={event => { if (dragged.current && event.detail !== 0) return; onSelect(); }}>{content}</button>
        : <div {...props} role="group" tabIndex={0}>{content}</div>;
}
