import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, MouseEvent } from "react";
import type { CubeRotation } from "./RubiksCubeAnimations";

const HOME: CubeRotation = { x: -22, y: -32 };
export const nearestAngle = (from: number, to: number) => from + ((to - from + 180) % 360 + 360) % 360 - 180;

/** Optional lesson motion: drag freely, then return without starting auto-spin. */
export function useCubeReturnRotation(enabled: boolean, focusRequest?: string | number, home: CubeRotation = HOME) {
    const { x: homeX, y: homeY } = home;
    const [rotation, setRotation] = useState(() => ({ x: homeX, y: homeY }));
    const current = useRef({ x: homeX, y: homeY });
    const pointer = useRef<{ id: number; x: number; y: number; distance: number } | null>(null);
    const dragged = useRef(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const frame = useRef<number | null>(null);

    const cancelMotion = useCallback(() => {
        if (timer.current !== null) clearTimeout(timer.current);
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        timer.current = null;
        frame.current = null;
    }, []);
    const update = useCallback((next: CubeRotation) => {
        current.current = next;
        setRotation(next);
    }, []);
    const returnHome = useCallback(() => {
        cancelMotion();
        if (pointer.current) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            update({ x: homeX, y: homeY });
            return;
        }
        const from = current.current;
        const to = { x: nearestAngle(from.x, homeX), y: nearestAngle(from.y, homeY) };
        let start: number | undefined;
        const animate = (now: number) => {
            start ??= now;
            const progress = Math.min((now - start) / 750, 1);
            const eased = 1 - (1 - progress) ** 3;
            update({ x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased });
            frame.current = progress < 1 ? requestAnimationFrame(animate) : null;
        };
        frame.current = requestAnimationFrame(animate);
    }, [cancelMotion, update, homeX, homeY]);
    const scheduleReturn = useCallback(() => {
        cancelMotion();
        timer.current = setTimeout(returnHome, 5000);
    }, [cancelMotion, returnHome]);

    useEffect(() => {
        if (enabled) returnHome();
        return cancelMotion;
    }, [enabled, focusRequest, returnHome, cancelMotion]);

    return {
        rotation,
        onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
            if (pointer.current || !event.isPrimary || event.button !== 0) return;
            cancelMotion();
            dragged.current = false;
            pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, distance: 0 };
            event.currentTarget.setPointerCapture(event.pointerId);
        },
        onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
            const previous = pointer.current;
            if (!previous || previous.id !== event.pointerId) return;
            const dx = event.clientX - previous.x;
            const dy = event.clientY - previous.y;
            previous.distance += Math.abs(dx) + Math.abs(dy);
            dragged.current = previous.distance > 6;
            previous.x = event.clientX;
            previous.y = event.clientY;
            update({ x: current.current.x - dy * 0.3, y: current.current.y + dx * 0.3 });
        },
        onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
            if (pointer.current?.id !== event.pointerId) return;
            pointer.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            scheduleReturn();
        },
        onPointerCancel: (event: PointerEvent<HTMLDivElement>) => {
            if (pointer.current?.id !== event.pointerId) return;
            dragged.current = true;
            pointer.current = null;
            scheduleReturn();
        },
        onClickCapture: (event: MouseEvent<HTMLDivElement>) => {
            if (dragged.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); }
        },
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
            if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
            event.preventDefault();
            cancelMotion();
            update({
                x: current.current.x + (event.key === "ArrowUp" ? 15 : event.key === "ArrowDown" ? -15 : 0),
                y: current.current.y + (event.key === "ArrowLeft" ? -15 : event.key === "ArrowRight" ? 15 : 0),
            });
            scheduleReturn();
        },
    };
}

