import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { COLOR_DETAILS, REVIEW_CONFIG as C, type ReviewColor } from "./class3ReviewConfig";
import { createReviewState, ALL_CUBE_FACES } from "./class3ReviewGeneration";
import { projectCube, cannonAim } from "./class3ReviewGeometry";
import { ReviewScene } from "./ReviewScene";
import { paintScene } from "./class3ReviewPaint";
import { SummaryCube } from "./SummaryCube";
import { useForegroundAnimation } from "./useClass3Review";
import type { Point, ReviewState } from "./class3ReviewTypes";
import styles from "./Class3SummaryView.module.css";

function initialDemo(color: ReviewColor): ReviewState {
    const state = createReviewState(7);
    state.color = color; state.phase = "playing";
    state.rounds = state.rounds.map(round => ({ ...round, ammo: { faces: 1, squaresPerFace: 9 }, clock: "absent" }));
    state.rounds[0] = { ...state.rounds[0], status: "approaching", cubes: [
        { id: "demo-correct", roundId: 1, size: 3, faces: ["top"], slot: 0, stagger: -0.02, angle: -30, motion: "rock" },
        { id: "demo-all", roundId: 1, size: 3, faces: ALL_CUBE_FACES, slot: 1, stagger: 0.015, angle: -30, motion: "rock" },
        { id: "demo-large", roundId: 1, size: 4, faces: ["top", "front", "right"], slot: 2, stagger: 0, angle: -30, motion: "rock" },
    ] };
    return state;
}

/** Demonstration is independent of real damage, spawning, and analytics. */
function demoFrame(base: ReviewState, age: number): { state: ReviewState; pointer: Point } {
    const progress = 0.2 + Math.min(age, 6) / 6 * 0.48;
    const first = { ...base.rounds[0], progress };
    const target = projectCube(first.cubes[0], progress);
    const shotPoint = projectCube(first.cubes[0], 0.68);
    const pointer = age < 4 ? { x: 0.48 + Math.sin(age * 2) * 0.12, y: 0.43 + Math.cos(age * 1.5) * 0.07 }
        : { x: target.x + Math.sin(age * 4) * Math.max(0, 6 - age) * 0.007, y: target.y };
    const state = { ...base, rounds: [first, ...base.rounds.slice(1)], inspectionTime: age, lastShot: age >= 6 ? 6 : -Infinity };
    if (age >= 6 && age < 6.15) state.effects = [{ id: 0, kind: "pellet", started: 6, duration: 0.15, point: shotPoint, from: cannonAim(pointer, 1.5).muzzle }];
    const resolvedAt = 6 + C.resolutionSeconds;
    if (age >= 6 && age < resolvedAt) { first.status = "resolving"; first.hitTarget = first.cubes[0].id; }
    if (age >= resolvedAt) {
        first.status = "hit";
        state.effects = age < 8.9 ? [{ id: 1, kind: "success", started: resolvedAt, duration: 8.9 - resolvedAt, point: shotPoint, cube: first.cubes[0] }] : [];
        if (age < resolvedAt + C.dustSeconds) state.effects.push(...first.cubes.slice(1).map((cube, index) => ({ id: index + 2, kind: "dust" as const, started: resolvedAt, duration: C.dustSeconds, point: projectCube(cube, 0.68) })));
    }
    return { state, pointer };
}

function stage(age: number) { return age < 6 ? 0 : age < 6.15 ? 1 : age < 6 + C.resolutionSeconds ? 2 : age < 6 + C.resolutionSeconds + C.dustSeconds ? 3 : age < 8.9 ? 4 : 5; }

export function Class3ReviewIntro({ color, onPlay }: { color: ReviewColor; onPlay: () => void }) {
    const base = useMemo(() => initialDemo(color), [color]);
    const [rendered, setRendered] = useState(() => demoFrame(base, 0).state);
    const frame = useRef(demoFrame(base, 0));
    const elapsed = useRef(0), lastStage = useRef(0);
    const surface = useRef<HTMLDivElement>(null), play = useRef<HTMLButtonElement>(null);
    useLayoutEffect(() => { play.current?.focus(); }, []);
    useForegroundAnimation(true, seconds => {
        elapsed.current = (elapsed.current + seconds) % 10;
        frame.current = demoFrame(base, elapsed.current);
        const nextStage = stage(elapsed.current);
        if (nextStage !== lastStage.current) { lastStage.current = nextStage; setRendered(frame.current.state); }
        if (surface.current) paintScene(surface.current, frame.current.state, frame.current.pointer);
    });
    return <div className={styles.backdrop}>
        <section className={styles.introCard} role="dialog" aria-modal="true" aria-labelledby="class3-review-title"
            onKeyDown={event => { if (event.key === "Tab") { event.preventDefault(); play.current?.focus(); } }}>
            <h1 id="class3-review-title">Acerte o cubo que combina com sua munição!</h1>
            <div className={styles.introColumns}>
                <div className={styles.demoPreview} aria-label="Exemplo: mire no cubo 3×3 com uma face colorida usando 1 × 9">
                    <ReviewScene state={rendered} surfaceRef={surface} preview />
                    <span className={styles.demoCaption}>Mire e clique para disparar!</span>
                </div>
                <div className={styles.explanation}>
                    <div className={styles.explanationCube} style={{ "--yaw": "-30deg" } as React.CSSProperties}>
                        <SummaryCube size={3} color={color} faces={["top"]} outlined />
                    </div>
                    <svg className={styles.factorLinks} viewBox="0 0 300 65" aria-hidden="true">
                        <path d="M143 4L66 22V54M161 4L235 22V54" fill="none" stroke="#6b21a8" strokeWidth="3" strokeLinecap="round" />
                        <path d="M58 47L66 55L74 47M227 47L235 55L243 47" fill="none" stroke="#6b21a8" strokeWidth="3" />
                    </svg>
                    <div className={styles.factorExplanation}>
                        <div><strong>1</strong><span>face {COLOR_DETAILS[color].adjective}</span></div><b>×</b>
                        <div><strong>9</strong><span>quadradinhos<br />por face</span></div>
                    </div>
                </div>
            </div>
            <p>Observe as faces coloridas e mire no cubo certo.</p>
            <button ref={play} className={styles.actionButton} onClick={onPlay}>Jogar</button>
        </section>
    </div>;
}
