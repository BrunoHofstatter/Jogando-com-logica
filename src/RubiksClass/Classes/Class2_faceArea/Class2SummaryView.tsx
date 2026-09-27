import { memo, useCallback, useEffect, useReducer, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import RubiksCube from "../../Components/RubiksCube";
import { coloredRows } from "../../Components/educationalCube";
import { useCubeMobileLayout } from "../../Components/useCubeMobileLayout";
import { initialReviewState, MATCH_COUNT, needsImmediateSpawn, REPLENISH_DELAY_MS, SPAWN_INTERVAL_MS, reviewReducer, type ReviewTarget } from "./class2Review";
import styles from "./Class2SummaryView.module.css";
import { ROUTES } from "../../../routes";

interface Class2SummaryViewProps {
    totalFlags: number;
    onStart: () => boolean;
    onComplete: (mistakes: number) => boolean;
}

// Falling-card frames must not re-render all cube stickers.
const ReviewCube = memo(function ReviewCube({ target, mobile, selected, onMatch }: {
    target: ReviewTarget; mobile: boolean; selected: boolean; onMatch: (id: number) => void;
}) {
    return <div className={styles.cubeWrapper}
        role="button" tabIndex={0}
        aria-label={`Cubo com ${target.rows} linhas coloridas de ${target.size} quadradinhos`}
        onClick={() => onMatch(target.id)}
        onKeyDown={event => {
            if (!event.repeat && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault(); onMatch(target.id);
            }
        }}>
        <div className={selected ? styles.cubePulseTarget : undefined}>
            <RubiksCube size={target.size} cubeSize={mobile ? 15 : 10} returnToDefault
                faceAppearances={coloredRows(target.size, target.rows)} />
        </div>
    </div>;
});

const DemoCursor = () => <svg className={styles.demoPointer} viewBox="0 0 34 36" aria-hidden="true"
    stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19V6a3 3 0 0 1 6 0v7a3 3 0 0 1 6 0v2a3 3 0 0 1 6 0v3a2 2 0 0 1 4 0v7c0 6-4 9-10 9h-3c-4 0-6-2-8-5l-7-9a3 3 0 0 1 4-4Z" />
    <path d="M15 13v8m6-6v7m6-4v5" fill="none" />
</svg>;

export default function Class2SummaryView({ totalFlags, onStart, onComplete }: Class2SummaryViewProps) {
    const navigate = useNavigate();
    const mobile = useCubeMobileLayout();
    const [state, dispatch] = useReducer(reviewReducer, undefined, initialReviewState);
    const completed = useRef(false);
    const playButton = useRef<HTMLButtonElement>(null);
    const finishButton = useRef<HTMLButtonElement>(null);
    const match = useCallback((targetId: number) => dispatch({ type: "match", targetId }), []);
    const shouldReplenish = needsImmediateSpawn(state);

    useEffect(() => {
        if (state.phase === "intro") playButton.current?.focus();
        if (state.phase !== "playing") return;
        let frame = 0;
        let previous: number | null = null;
        const tick = (now: number) => {
            if (previous !== null && document.visibilityState === "visible") {
                dispatch({ type: "tick", seconds: (now - previous) / 1000, mobile });
            }
            previous = now;
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") dispatch({ type: "spawn", random: Math.random(), position: Math.random(), mobile });
        }, SPAWN_INTERVAL_MS);
        return () => { cancelAnimationFrame(frame); clearInterval(interval); };
    }, [state.phase, mobile]);

    useEffect(() => {
        if (!shouldReplenish) return;
        const timer = setTimeout(() => dispatch({
            type: "spawn", random: Math.random(), position: Math.random(), mobile,
        }), REPLENISH_DELAY_MS);
        return () => clearTimeout(timer);
    }, [shouldReplenish, state.boxes.length, state.nextBoxId, mobile]);

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
            finishButton.current?.focus();
        }
    }, [state.phase, state.mistakes, onComplete]);

    const renderCube = (target: ReviewTarget | null, slot: number) => state.pendingReplacement?.slot === slot
        ? <div key={`pending-${slot}`} className={styles.emptySlot} aria-hidden="true" />
        : target ? (
        <ReviewCube key={target.id} target={target} mobile={mobile} selected={state.selected !== null} onMatch={match} />
    ) : <div key={`finished-${slot}`} className={styles.finishedSlot} aria-label="Combinação concluída"><Check aria-hidden="true" /></div>;

    return <div className={styles.container}>
        <button className={styles.aulasButton} onClick={() => navigate(ROUTES.CLASS_MENU)}>Aulas</button>
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
                    <button ref={playButton} className={styles.modalButton} onClick={() => { onStart(); dispatch({ type: "start", mobile }); }}>Jogar</button>
                </section>
            </div>
        ) : state.phase === "complete" ? (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent} role="dialog" aria-labelledby="review-complete-title">
                    <h1 id="review-complete-title" className={styles.modalTitle}>Excelente! 🎉</h1>
                    <p className={styles.modalStats}>Você fez 10 combinações!<br />Erros nas lições: {totalFlags}<br />Tentativas incorretas no jogo: {state.mistakes}</p>
                    <button ref={finishButton} className={styles.modalButton} onClick={() => navigate(ROUTES.CLASS_MENU)}>Voltar ao Menu</button>
                </div>
            </div>
        ) : <>
            <div className={styles.titleOverlay}>
                <h2 className={styles.titleText}>Escolha o número e depois o cubo!</h2>
                <span className={styles.matchProgress}>{state.matches} / {MATCH_COUNT} combinações</span>
            </div>
            <div className={styles.reviewFeedback} key={state.feedbackId} role="status">{state.feedback}</div>
            <div className={`${styles.sidePanel} ${styles.leftPanel}`}>{state.targets.slice(0, 3).map(renderCube)}</div>
            <div className={`${styles.sidePanel} ${styles.rightPanel}`}>{state.targets.slice(3).map((target, index) => renderCube(target, index + 3))}</div>
            <div className={styles.fallingArea}>
                {state.boxes.map(box => <button key={box.id}
                    className={`${styles.fallingBox} ${state.selected === box.id ? styles.paused : ""}`}
                    aria-pressed={state.selected === box.id}
                    style={{ top: `${box.top}%`, left: `${box.left}%` }}
                    onClick={() => dispatch({ type: "select", id: box.id })}>{box.value}</button>)}
            </div>
        </>}
    </div>;
}
