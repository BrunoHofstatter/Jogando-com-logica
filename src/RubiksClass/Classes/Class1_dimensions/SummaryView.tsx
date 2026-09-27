import { useEffect, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Lightbulb } from "lucide-react";
import { useCubeMobileLayout } from "../../Components/useCubeMobileLayout";
import { Class1Cube } from "./Class1Cube";
import { TemporaryFeedback } from "./TemporaryFeedback";
import { initialReview, reviewReducer, REVIEW_SIZES, shuffleSizes } from "./class1Review";
import styles from "./SummaryView.module.css";
import chrome from "./Class1Chrome.module.css";
import { ROUTES } from "../../../routes";

interface Props {
    lessonErrors?: number; lessonHints: number;
    onComplete: (mistakes: number, hints: number) => boolean; onReplay: () => void;
}
export default function SummaryView({ lessonErrors, lessonHints, onComplete, onReplay }: Props) {
    const navigate = useNavigate();
    const mobile = useCubeMobileLayout();
    const [deck] = useState(shuffleSizes);
    const [state, dispatch] = useReducer(reviewReducer, initialReview);
    const area = useRef<HTMLDivElement>(null);
    const replay = useRef<HTMLButtonElement>(null);
    const completed = useRef(false);
    useEffect(() => {
        if (state.phase === "complete") replay.current?.focus();
        else if (state.matched.length) area.current?.querySelector<HTMLButtonElement>("button[data-cube-select]:not(:disabled)")?.focus();
    }, [state.phase, state.matched.length]);
    useEffect(() => {
        if (state.phase === "complete" && !completed.current) {
            completed.current = true; onComplete(state.mistakes, state.hints);
        }
    }, [state.phase, onComplete, state.mistakes, state.hints]);
    const isComplete = state.phase === "complete";
    return <><div className={styles.container} ref={area} inert={isComplete} aria-hidden={isComplete || undefined}>
        <button className={chrome.aulasButton} onClick={() => navigate(ROUTES.CLASS_MENU)}>Aulas</button>
        <div className={styles.leftPanel}>
            <div className={chrome.headerOverlay}>
                {state.selected !== null && state.helpLevel > 0 && <div className={chrome.hintCard} role="status">Conte os quadradinhos de uma linha.</div>}
            </div>
            {deck.map((size, index) => {
                const selected = state.selected === size;
                const helped = selected && state.helpLevel > 0;
                return <div key={size} data-review-cube={size}>
                    <Class1Cube size={size} cubeSize={mobile ? 17 : 8.5}
                        label={`Selecionar cubo ${index + 1}. Use as setas para girar.`}
                        selected={selected} disabled={state.matched.includes(size)}
                        onSelect={() => dispatch({ type: "select", size })}
                        focusRequest={helped ? state.focusVersion : 0}
                        highlightRegion={helped ? { type: "row", index: 0 } : null}
                        dimInactive={helped} showCounting={helped && state.helpLevel === 2}
                        hintAnimationKey={helped ? String(state.focusVersion) : undefined} />
                </div>;
            })}
        </div>
        <div className={styles.rightPanel}>
            <h2 className={styles.title}>Combine os tamanhos!</h2>
            <p className={styles.instruction}>Escolha um cubo e depois o tamanho dele.</p>
            <div className={styles.labelsList}>
                {REVIEW_SIZES.map(size => {
                    const matched = state.matched.includes(size);
                    return <button key={size}
                        className={`${styles.labelButton} ${matched ? styles.correctAnswer : state.wrong === size ? styles.wrongAnswer : ""}`}
                        disabled={matched} aria-label={matched ? `${size}×${size}, correto` : undefined}
                        onClick={() => dispatch({ type: "answer", size })}>
                        {size}×{size}
                        {matched && <Check aria-hidden="true" className={styles.matchCheck} />}
                    </button>;
                })}
            </div>
        </div>
        {state.feedback && <TemporaryFeedback key={state.feedbackVersion} message={state.feedback} success={state.feedback === "Combinação correta!"} />}
        <div className={chrome.hintDock}>
            <button className={chrome.hintButton} onClick={() => dispatch({ type: "hint" })}>
                <Lightbulb aria-hidden="true" />{state.helpLevel === 2 ? "Ver dica novamente" : "Dica"}
            </button>
        </div>
    </div>
        {isComplete && <div className={styles.modalOverlay}>
            <section className={styles.completionCard} role="dialog" aria-modal="true" aria-labelledby="class1-complete"
                onKeyDown={event => {
                    if (event.key !== "Tab") return;
                    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button");
                    const first = buttons[0], last = buttons[buttons.length - 1];
                    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
                }}>
                <h1 id="class1-complete" className={styles.modalTitle}>Excelente! 🎉</h1>
                <p className={styles.summaryText}>Você completou os desafios!</p>
                <p className={styles.summaryText}>
                    {lessonErrors !== undefined && <>Erros nas lições: {lessonErrors}<br /></>}
                    Erros no jogo: {state.mistakes}<br />Dicas usadas: {lessonHints + state.hints}
                </p>
                <div className={styles.completionActions}>
                    <button ref={replay} className={`${styles.completionButton} ${styles.replayButton}`} onClick={onReplay}>Jogar novamente</button>
                    <button className={`${styles.completionButton} ${styles.nextButton}`} onClick={() => navigate(ROUTES.CLASS_2)}>Próxima aula</button>
                </div>
                <button className={`${styles.completionButton} ${styles.menuButton}`} onClick={() => navigate(ROUTES.CLASS_MENU)}>Aulas</button>
            </section>
        </div>}
    </>;
}
