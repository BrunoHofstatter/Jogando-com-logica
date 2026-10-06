import { memo, useCallback, useEffect, useLayoutEffect, useReducer, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import RubiksCube from "../../Components/RubiksCube";
import { coloredRows } from "../../Components/educationalCube";
import { useCubeMobileLayout } from "../../Components/useCubeMobileLayout";
import { initialReviewState, MATCH_COUNT, needsImmediateSpawn, REPLENISH_DELAY_MS, SPAWN_INTERVAL_MS, reviewBoxPosition, reviewReducer, type ReviewTarget } from "./class2Review";
import styles from "./Class2SummaryView.module.css";
import { ReviewCompletion } from "../../Components/ReviewCompletion";
import { TemporaryFeedback } from "../../Components/TemporaryFeedback";
import { ROUTES } from "../../../routes";

interface Class2SummaryViewProps {
    totalFlags?: number;
    lessonHints?: number;
    onReplay: () => void;
    onStart: () => boolean;
    onComplete: (mistakes: number) => boolean;
}

// Falling-card frames must not re-render all cube stickers.
const ReviewCube = memo(function ReviewCube({ target, mobile, selected, onMatch }: {
    target: ReviewTarget; mobile: boolean; selected: boolean; onMatch: (id: number) => void;
}) {
    return <div className={styles.cubeWrapper} data-review-target={target.id}>
        <div className={selected ? styles.cubePulseTarget : undefined}>
            <RubiksCube size={target.size} cubeSize={mobile ? 15 : 10} returnToDefault
                interactionLabel={`Cubo com ${target.rows} linhas coloridas de ${target.size} quadradinhos. Use as setas para girar e Enter ou espaço para combinar.`}
                onActivate={() => onMatch(target.id)}
                faceAppearances={coloredRows(target.size, target.rows)} />
        </div>
    </div>;
});

const DemoCursor = () => <svg className={styles.demoPointer} viewBox="0 0 34 36" aria-hidden="true"
    stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19V6a3 3 0 0 1 6 0v7a3 3 0 0 1 6 0v2a3 3 0 0 1 6 0v3a2 2 0 0 1 4 0v7c0 6-4 9-10 9h-3c-4 0-6-2-8-5l-7-9a3 3 0 0 1 4-4Z" />
    <path d="M15 13v8m6-6v7m6-4v5" fill="none" />
</svg>;

export default function Class2SummaryView({ totalFlags, lessonHints = 0, onReplay, onStart, onComplete }: Class2SummaryViewProps) {
    const navigate = useNavigate();
    const mobile = useCubeMobileLayout();
    const [state, dispatch] = useReducer(reviewReducer, undefined, initialReviewState);
    const completed = useRef(false);
    const playButton = useRef<HTMLButtonElement>(null);
    const container = useRef<HTMLDivElement>(null);
    const instruction = useRef<HTMLHeadingElement>(null);
    const lastFocused = useRef<HTMLElement | null>(null);
    const requestedFocus = useRef<"number" | "cube" | null>(null);
    const match = useCallback((targetId: number) => {
        if (document.activeElement?.closest("[data-review-target]")) requestedFocus.current = "number";
        dispatch({ type: "match", targetId });
    }, []);
    const shouldReplenish = needsImmediateSpawn(state);

    // Recover focus only when our control disappeared, not when the user moved elsewhere.
    useLayoutEffect(() => {
        if (state.phase !== "playing") return;
        const lostControl = lastFocused.current && !lastFocused.current.isConnected && document.activeElement === document.body;
        if (!requestedFocus.current && !lostControl) return;
        const selector = requestedFocus.current === "cube" ? "[data-review-target] [role=button]" : "[data-review-number]";
        const next = container.current?.querySelector<HTMLElement>(selector);
        requestedFocus.current = null;
        (next ?? instruction.current)?.focus({ preventScroll: true });
    }, [state.phase, state.boxes, state.targets, state.feedbackId, state.selected]);

    useEffect(() => {
        if (state.phase === "intro") playButton.current?.focus();
    }, [state.phase]);

    useEffect(() => {
        if (state.phase !== "playing" || state.stationary) return;
        let frame = 0;
        let previous: number | null = null;
        const tick = (now: number) => {
            if (previous !== null && document.visibilityState === "visible") {
                dispatch({ type: "tick", seconds: (now - previous) / 1000 });
            }
            previous = now;
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") dispatch({ type: "spawn", random: Math.random(), position: Math.random() });
        }, SPAWN_INTERVAL_MS);
        return () => { cancelAnimationFrame(frame); clearInterval(interval); };
    }, [state.phase, state.stationary]);

    useEffect(() => {
        if (!shouldReplenish) return;
        const timer = setTimeout(() => dispatch({
            type: "spawn", random: Math.random(), position: Math.random(),
        }), REPLENISH_DELAY_MS);
        return () => clearTimeout(timer);
    }, [shouldReplenish, state.boxes.length, state.nextBoxId]);

    useEffect(() => {
        if (!state.feedback) return;
        const timer = setTimeout(() => dispatch({ type: "clearFeedback", id: state.feedbackId }), 3000);
        return () => clearTimeout(timer);
    }, [state.feedback, state.feedbackId]);

    useEffect(() => {
        if (!state.pendingReplacement) return;
        const slot = state.pendingReplacement.slot;
        const timer = setTimeout(() => dispatch({ type: "showReplacement", slot }), 500);
        return () => clearTimeout(timer);
    }, [state.pendingReplacement]);

    useEffect(() => {
        if (state.phase === "complete" && !completed.current) {
            completed.current = true;
            onComplete(state.mistakes);
        }
    }, [state.phase, state.mistakes, onComplete]);

    const renderCube = (target: ReviewTarget | null, slot: number) => state.pendingReplacement?.slot === slot
        ? <div key={`pending-${slot}`} className={styles.emptySlot} aria-hidden="true" />
        : target ? (
        <ReviewCube key={target.id} target={target} mobile={mobile} selected={state.selected !== null} onMatch={match} />
    ) : <div key={`finished-${slot}`} className={styles.finishedSlot} aria-label="Combinação concluída"><Check aria-hidden="true" /></div>;

    return <div ref={container} className={styles.container} onFocusCapture={event => { lastFocused.current = event.target as HTMLElement; }}>
        {state.phase !== "complete" && <button className={styles.aulasButton} onClick={() => navigate(ROUTES.CLASS_MENU)}>Aulas</button>}
        {state.phase === "intro" ? (
            <div className={styles.introBackdrop}>
                <section className={styles.introCard} role="dialog" aria-labelledby="review-intro-title">
                    <h1 id="review-intro-title">Combine os quadradinhos!</h1>
                    <div className={styles.demo}>
                        <div className={styles.demoCalculation}>
                            <h2><b>1.</b> Conte os <strong>quadradinhos coloridos</strong></h2>
                            <span><b>2</b> linhas</span><span>×</span><span><b>3</b> quadradinhos<br />por linha</span>
                            <strong className={styles.demoResult}>= 6</strong>
                        </div>
                        <div className={styles.demoLane} aria-label="Exemplo: escolha o número 6 entre 9, 6 e 12">
                            <h2><b>2.</b> Escolha o <strong>número correto</strong></h2>
                            {[9, 6, 12].map(value => <span key={value}
                                className={`${styles.demoNumber} ${value === 6 ? styles.demoCorrect : ""}`}
                                data-value={value}>{value}</span>)}
                        </div>
                        <div className={styles.demoCube}>
                            <h2><b>3.</b> Toque no <strong>cubo correspondente</strong></h2>
                            <div className={styles.demoCubeTarget}>
                                <RubiksCube size={3} cubeSize={mobile ? 23 : 12} returnToDefault faceAppearances={coloredRows(3, 2)} />
                            </div>
                            <span className={styles.demoSuccess} aria-hidden="true"><Check /></span>
                        </div>
                        <span className={styles.demoArrow} aria-hidden="true">→</span>
                        <DemoCursor />
                    </div>
                    <p className={styles.introNote}>Conte só as partes coloridas. Você pode girar os cubos!</p>
                    <button ref={playButton} className={styles.modalButton} onClick={() => { onStart(); requestedFocus.current = "number"; dispatch({ type: "start" }); }}>Jogar</button>
                </section>
            </div>
        ) : state.phase === "complete" ? (
            <ReviewCompletion lessonErrors={totalFlags} mistakes={state.mistakes} hints={lessonHints}
                nextClass={ROUTES.CLASS_3} onReplay={onReplay} />
        ) : <>
            <button className={`${styles.motionButton} ${styles.gameMotionButton}`} onClick={() => dispatch({ type: "motion", stationary: !state.stationary })}>
                {state.stationary ? "Mover números" : "Parar números"}
            </button>
            <div className={styles.titleOverlay}>
                <h2 ref={instruction} tabIndex={-1} className={styles.titleText}>Escolha o número e depois o cubo!</h2>
                <span className={styles.matchProgress}>{state.matches} / {MATCH_COUNT} combinações</span>
            </div>
            {state.feedback && (state.feedback.includes("Muito bem!")
                ? <div className={styles.reviewFeedback} key={state.feedbackId} role="status">{state.feedback}</div>
                : <TemporaryFeedback key={state.feedbackId} message={state.feedback} />)}
            <div className={`${styles.sidePanel} ${styles.leftPanel}`}>{state.targets.slice(0, 3).map(renderCube)}</div>
            <div className={`${styles.sidePanel} ${styles.rightPanel}`}>{state.targets.slice(3).map((target, index) => renderCube(target, index + 3))}</div>
            <div className={`${styles.fallingArea} ${state.stationary ? styles.stationaryArea : ""}`}>
                {state.boxes.map(box => {
                    const position = reviewBoxPosition(box, mobile);
                    return <button key={box.id} data-review-number={box.id}
                    className={`${styles.fallingBox} ${state.selected === box.id ? styles.paused : ""} ${state.wrongPair?.boxId === box.id ? styles.wrongAnswer : ""}`}
                    aria-pressed={state.selected === box.id}
                    style={state.stationary ? undefined : { top: `${position.top}%`, left: `${position.left}%` }}
                    onFocus={() => dispatch({ type: "focus", id: box.id })}
                    onBlur={() => dispatch({ type: "focus", id: null })}
                    onClick={event => {
                        if (event.detail === 0 && state.selected !== box.id) requestedFocus.current = "cube";
                        dispatch({ type: "select", id: box.id });
                    }}>{box.value}</button>;
                })}
            </div>
        </>}
    </div>;
}
