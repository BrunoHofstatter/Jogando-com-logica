import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { reviewReducer } from "./class3Review";
import { createReviewState } from "./class3ReviewGeneration";
import { cannonAim, resolveAim, sceneTargets } from "./class3ReviewGeometry";
import type { Point, ReviewAction, ReviewState } from "./class3ReviewTypes";
import { paintScene } from "./class3ReviewPaint";

/** One foreground clock; visibility changes reset its baseline, including quick tab switches. */
export function useForegroundAnimation(enabled: boolean, onFrame: (seconds: number) => void) {
    const callback = useRef(onFrame);
    useEffect(() => { callback.current = onFrame; }, [onFrame]);
    useEffect(() => {
        if (!enabled) return;
        let frame = 0, previous: number | null = null;
        const reset = () => { previous = null; };
        const animate = (now: number) => {
            if (document.visibilityState === "visible") {
                if (previous !== null) callback.current(Math.max(0, (now - previous) / 1000));
                previous = now;
            } else previous = null;
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        document.addEventListener("visibilitychange", reset);
        return () => { cancelAnimationFrame(frame); document.removeEventListener("visibilitychange", reset); };
    }, [enabled]);
}

export function useClass3Review(surface: RefObject<HTMLDivElement | null>) {
    const [state, setState] = useState<ReviewState>(createReviewState);
    const live = useRef(state);
    const pointer = useRef<Point | null>(null);
    const dispatch = useCallback((action: ReviewAction) => {
        const old = live.current;
        const next = reviewReducer(old, action);
        live.current = next;
        if (next.revision !== old.revision) setState(next);
    }, []);
    useForegroundAnimation(state.phase === "practice" || state.phase === "playing", seconds => {
        dispatch({ type: "tick", seconds });
        if (surface.current) paintScene(surface.current, live.current, pointer.current);
    });
    const aim = useCallback((event: { clientX: number; clientY: number }) => {
        const box = surface.current?.getBoundingClientRect();
        if (!box?.width || !box.height) return;
        pointer.current = { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height };
        if (surface.current) paintScene(surface.current, live.current, pointer.current);
    }, [surface]);
    const shoot = useCallback((event: { clientX: number; clientY: number }) => {
        if (document.visibilityState !== "visible") return;
        aim(event);
        const root = surface.current, point = pointer.current;
        if (!root || !point) return;
        const aspect = root.clientWidth / root.clientHeight;
        const targets = sceneTargets(live.current);
        const target = resolveAim(targets, point, aspect);
        const projection = targets.find(candidate => candidate.id === target)?.point ?? { ...point, size: 0.03, depth: 1 };
        dispatch({ type: "shoot", target, point: projection, from: cannonAim(point, aspect).muzzle });
    }, [aim, dispatch, surface]);
    return { state, live, dispatch, pointer, aim, shoot };
}
