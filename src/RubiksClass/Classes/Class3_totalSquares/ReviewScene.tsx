import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from "react";
import { COLOR_DETAILS } from "./class3ReviewConfig";
import { currentRound, visibleCubes } from "./class3ReviewGeometry";
import { paintScene } from "./class3ReviewPaint";
import type { Point, ReviewEffect, ReviewState } from "./class3ReviewTypes";
import { AmmoIcon, Cannon, ClockIcon, Corridor, Crosshair, Dust, FragmentHeart } from "./assets/ReviewArtwork";
import { SummaryCube } from "./SummaryCube";
import styles from "./Class3SummaryView.module.css";


function Effect({ effect, state }: { effect: ReviewEffect; state: ReviewState }) {
    return <div className={styles.moving} data-effect={effect.id}>
        {effect.kind === "success" ? <SummaryCube color={state.color} special="success" />
            : effect.kind === "dust" ? <Dust />
                : effect.kind === "pellet" ? <span className={styles.pellet} />
                    : <><div data-wrong-cube className={styles.wrongCube}><SummaryCube color={state.color} size={effect.cube?.size} faces={effect.cube?.faces} /></div><div data-wrong-dust style={{ display: "none" }}><Dust /></div></>}
    </div>;
}

export function ReviewScene({ state, surfaceRef, snapshot, pointer, preview = false }:
    { state: ReviewState; surfaceRef?: RefObject<HTMLDivElement | null>; snapshot?: RefObject<ReviewState>; pointer?: RefObject<Point | null>; preview?: boolean }) {
    const ownRef = useRef<HTMLDivElement>(null);
    const ref = surfaceRef ?? ownRef;
    useLayoutEffect(() => {
        if (ref.current) paintScene(ref.current, snapshot?.current ?? state, pointer?.current ?? null);
    }, [state, ref, snapshot, pointer]);
    const active = state.phase === "practice" ? state.practice : currentRound(state);
    const rounds = state.phase === "practice" ? state.practice.status === "unspawned" ? [] : [state.practice]
        : state.rounds.filter(round => round.status === "approaching" || round.status === "resolving");
    const frozen = state.freezeUntil > state.inspectionTime;
    return <div ref={ref} className={`${styles.scene} ${frozen ? styles.frozen : ""} ${preview ? styles.preview : ""}`}
        style={{ "--session-color": COLOR_DETAILS[state.color].light } as CSSProperties}>
        <div className={styles.corridor}><Corridor /></div>
        <div className={styles.entrance} />
        {rounds.flatMap(round => visibleCubes(round, state).map(cube =>
            <div key={cube.id} data-motion={cube.id} className={`${styles.moving} ${styles.target}`}>
                <SummaryCube size={cube.size} faces={cube.faces} color={state.color} />
            </div>))}
        {rounds.filter(round => round.clock === "available" && round.id !== 0).map(round =>
            <div key={`clock-${round.id}`} data-motion={`clock-${round.id}`} className={styles.moving}><SummaryCube color={state.color} special="clock" /></div>)}
        {state.effects.map(effect => <Effect key={effect.id} effect={effect} state={state} />)}
        <div className={styles.hud}>
            <div className={styles.hearts} role="group" aria-label={`${state.health} de 9 pontos de vida`}>
                {[0, 1, 2].map(index => <FragmentHeart key={index} points={Math.max(0, Math.min(3, state.health - index * 3))} />)}
            </div>
            <div className={styles.rounds} role="group" aria-label="Rodadas">
                {state.rounds.map(round => <span key={round.id} data-status={round.id === active?.id ? "current" : round.status}
                    aria-current={round.id === active?.id ? "step" : undefined}
                    aria-label={`Rodada ${round.id}: ${round.status === "hit" || round.status === "escaped" ? "concluída" : round.id === active?.id ? "atual" : "a seguir"}`}>
                    {round.id}{(round.status === "hit" || round.status === "escaped") && <small>✓</small>}
                </span>)}
            </div>
        </div>
        {state.phase !== "practice" && <div className={styles.ammoDock}>
            <AmmoIcon /><div className={styles.ammo} aria-live={preview ? "off" : "polite"}>{active ? `${active.ammo.faces} × ${active.ammo.squaresPerFace}` : "✓"}</div>
        </div>}
        <div className={styles.cannon}><Cannon /></div>
        <div data-muzzle className={styles.muzzle} />
        {frozen && <div className={styles.freezeCue} role="status"><ClockIcon /><span>Tempo parado!</span></div>}
        <div data-crosshair className={styles.crosshair}><Crosshair /></div>
    </div>;
}
