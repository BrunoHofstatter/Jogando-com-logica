import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../routes";
import { useLessonEntry } from "../../Testing/entryContext";
import { useGameAttemptAnalytics } from "../../../analytics/useGameAttemptAnalytics";
import { Class3ReviewIntro } from "./Class3ReviewIntro";
import { ReviewScene } from "./ReviewScene";
import { useClass3Review } from "./useClass3Review";
import { REVIEW_CONFIG } from "./class3ReviewConfig";
import { FragmentHeart } from "./assets/ReviewArtwork";
import styles from "./Class3SummaryView.module.css";

function DesktopReview({ onReplay }: { onReplay: () => void }) {
    const navigate = useNavigate();
    const { isCheckpoint } = useLessonEntry();
    const surface = useRef<HTMLDivElement>(null), input = useRef<HTMLDivElement>(null), replay = useRef<HTMLButtonElement>(null);
    const { state, live, dispatch, pointer, aim, shoot } = useClass3Review(surface);
    const { startAttempt, completeAttempt } = useGameAttemptAnalytics(isCheckpoint ? null : {
        gameId: "cubo_magico", levelId: "class_03", activityVariant: "review", gameMode: "solo", usageContext: "standard", playerSlotCount: 1,
    });
    const finished = state.phase === "won" || state.phase === "lost";
    useEffect(() => {
        if (state.phase === "practice") input.current?.focus();
    }, [state.phase]);
    useEffect(() => {
        if (!finished) return;
        completeAttempt({ outcome: state.phase === "won" ? "passed" : "failed", success: state.phase === "won",
            correctCount: state.hits, incorrectCount: state.wrongShots + state.escapes,
            completedStepCount: state.hits + state.escapes, assistanceCount: 0 });
        replay.current?.focus();
    }, [finished, state.phase, state.hits, state.wrongShots, state.escapes, completeAttempt]);

    return <div className={styles.container}>
        <div ref={input} className={`${styles.inputSurface} ${state.phase === "intro" || finished ? styles.inactive : ""}`}
            role="application" aria-label="Jogo do canhão. Use o mouse para mirar e clique para atirar." tabIndex={0}
            inert={finished || state.phase === "intro"}
            onPointerMove={event => { if (event.pointerType !== "touch") aim(event); }}
            onPointerLeave={() => { pointer.current = null; const cursor = surface.current?.querySelector<HTMLElement>("[data-crosshair]"); if (cursor) cursor.style.display = "none"; }}
            onPointerDown={event => { if (event.button === 0 && event.pointerType !== "touch") shoot(event); }}>
            <ReviewScene state={state} surfaceRef={surface} snapshot={live} pointer={pointer} />
        </div>
        {!finished && <button className={styles.aulasButton} onClick={() => navigate(ROUTES.CLASS_MENU)}>Aulas</button>}
        {state.phase === "practice" && <p className={styles.practiceInstruction} role="status">Mire no cubo e clique para atirar!</p>}
        {state.phase === "intro" && <Class3ReviewIntro color={state.color} onPlay={() => { startAttempt(); dispatch({ type: "start" }); }} />}
        {finished && <div className={styles.backdrop}>
            <section className={styles.resultCard} role="dialog" aria-modal="true" aria-labelledby="class3-result-title"
                onKeyDown={event => {
                    if (event.key !== "Tab") return;
                    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button");
                    const first = buttons[0], last = buttons[buttons.length - 1];
                    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
                }}>
                <h1 id="class3-result-title">{state.phase === "won" ? "Muito bem!" : "Vamos tentar de novo?"}</h1>
                <p>{state.phase === "won" ? `Você chegou ao fim das ${REVIEW_CONFIG.rounds} rodadas!` : "Seus corações acabaram. Observe as faces e tente novamente!"}</p>
                <div className={`${styles.hearts} ${styles.resultHearts}`} role="group" aria-label={`${state.health} de 9 pontos de vida restantes`}>
                    {[0, 1, 2].map(index => <FragmentHeart key={index} points={Math.max(0, Math.min(3, state.health - index * 3))} />)}
                </div>
                <p>Acertos: {state.hits}<br />Cubos que escaparam: {state.escapes}<br />Tiros incorretos: {state.wrongShots}</p>
                <div className={styles.resultActions}>
                    <button ref={replay} className={styles.actionButton} onClick={onReplay}>Jogar novamente</button>
                    <button className={styles.aulasButtonInline} onClick={() => navigate(ROUTES.CLASS_MENU)}>Aulas</button>
                </div>
            </section>
        </div>}
    </div>;
}

export default function Class3SummaryView() {
    const navigate = useNavigate();
    const [attempt, setAttempt] = useState(0);
    const [desktop, setDesktop] = useState(() => window.matchMedia("(any-pointer: fine)").matches || !window.matchMedia("(pointer: coarse)").matches);
    useEffect(() => {
        const fine = window.matchMedia("(any-pointer: fine)"), coarse = window.matchMedia("(pointer: coarse)");
        const update = () => setDesktop(fine.matches || !coarse.matches);
        fine.addEventListener("change", update); coarse.addEventListener("change", update);
        return () => { fine.removeEventListener("change", update); coarse.removeEventListener("change", update); };
    }, []);
    if (!desktop) return <div className={styles.container}><section className={styles.unsupported}>
        <h1>Jogue com um mouse</h1><p>Este jogo usa um mouse para mirar. Você pode continuar aprendendo nas aulas!</p>
        <button className={styles.actionButton} onClick={() => navigate(ROUTES.CLASS_MENU)}>Aulas</button>
    </section></div>;
    return <DesktopReview key={attempt} onReplay={() => setAttempt(value => value + 1)} />;
}
