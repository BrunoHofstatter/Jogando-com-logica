import { useLessonEntry } from "../../Testing/entryContext";
import React, { useCallback, useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { useCubeMobileLayout } from "../../Components/useCubeMobileLayout";
import { useNavigate } from "react-router-dom";
import { LessonCube } from "./LessonCube";
import { expression, faceExpression } from "./class3Lesson";
import { VerticalMultiplication } from "../../../Shared/Calculation";
import { useClass3 } from "./useClass3";
import styles from "./Class3TotalSquares.module.css";
import { ROUTES } from "../../../routes";
import { useGameAttemptAnalytics } from "../../../analytics/useGameAttemptAnalytics";

const Class3TotalSquares: React.FC = () => {
    const { isCheckpoint } = useLessonEntry();
    const { state, step, config, dispatch, offerHelp } = useClass3();
    const navigate = useNavigate();
    const portrait = useCubeMobileLayout();
    const [practicedRotation, setPracticedRotation] = useState(false);
    const onPractice = useCallback(() => setPracticedRotation(true), []);
    const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const [touch, setTouch] = useState(() => window.matchMedia("(pointer: coarse)").matches);
    useEffect(() => {
        const queries = [window.matchMedia("(prefers-reduced-motion: reduce)"), window.matchMedia("(pointer: coarse)")];
        const update = () => { setReducedMotion(queries[0].matches); setTouch(queries[1].matches); };
        queries.forEach(query => query.addEventListener("change", update));
        return () => queries.forEach(query => query.removeEventListener("change", update));
    }, []);
    const { completeAttempt, startAttempt } = useGameAttemptAnalytics(isCheckpoint ? null : {
        gameId: "cubo_magico", gameMode: "solo", usageContext: "standard", playerSlotCount: 1,
        levelId: "class_03", activityVariant: "lesson",
    });
    useEffect(() => { startAttempt(); }, [startAttempt]);
    useEffect(() => {
        if (state.phase === "complete") completeAttempt({ assistanceCount: state.assistanceCount, incorrectCount: state.incorrectCount, outcome: "completed", success: true });
    }, [completeAttempt, state.assistanceCount, state.incorrectCount, state.phase]);

    const area = config.size ** 2;
    const isTransition = state.phase === "transition";
    const showHint = state.phase === "question" && state.hintLevel > 0 && step.kind !== "calculation";
    const showGrouping = showHint && state.hintLevel >= 3 && (step.kind === "expression" || step.kind === "total");
    const isCalculation = step.kind === "calculation" && (state.phase === "question" || isTransition);
    return <div className={styles.container}>
        {isTransition && <div className={styles.successOverlay} role="status">Correto!</div>}
        <button className={styles.aulasButton} onClick={() => navigate(ROUTES.CLASS_MENU)}>Aulas</button>
        <LessonCube key={state.stepIndex} config={config} step={step} state={state} reducedMotion={reducedMotion} portrait={portrait} practicedRotation={practicedRotation} onPractice={onPractice} />
        <div className={styles.rightPanel}>
          <div className={styles.lessonContent}>
            {state.phase === "complete" ? <div className={styles.completeCard}>
                <h1 className={styles.completeTitle}>Aula completa!</h1>
                <p className={styles.completeText}>Você aprendeu a multiplicar a quantidade de faces pelos quadradinhos de cada face. Vale para algumas faces e para o cubo inteiro!</p>
                <p className={styles.completeStats}>Erros: {state.incorrectCount} · Dicas usadas: {state.assistanceCount}</p>
                <button className={styles.completeButton} onClick={() => navigate(ROUTES.CLASS_MENU)}>Voltar às Aulas</button>
            </div> : <>

                {step.kind === "expression" && step.configuration < 2 && <div className={styles.givenFacts}>
                    <span data-color={config.color}><strong>{config.faces.length}</strong> faces {config.faceAdjective}</span>
                    <span><strong>{area}</strong> quadradinhos em cada face</span>
                </div>}
                <h1 className={styles.title} aria-live="polite">{state.phase === "faceResult" ? "Uma face colorida" : state.phase === "calculationIntro" ? "Vamos armar a multiplicação" : step.question}</h1>

                {showGrouping && <div className={styles.grouping}>
                    <div className={styles.sumStrip}>{Array.from({ length: config.faces.length }, (_, index) => <React.Fragment key={index}>{index > 0 && <span>+</span>}<span className={styles.sumTerm} data-color={config.color} style={{ "--term": index } as React.CSSProperties}>{area}</span></React.Fragment>)}</div>
                    <div className={styles.factorRow}><span><strong>{config.faces.length}</strong><small>faces</small></span><b>×</b><span><strong>{area}</strong><small>quadradinhos<br />por face</small></span></div>
                    {step.kind === "total" && <div className={styles.runningTotals}>{config.faces.map((_, index) => (index + 1) * area).join(" → ")}</div>}
                </div>}
                {state.phase === "faceResult" ? <div className={styles.revealCard}>
                    <strong>{faceExpression(config)} = {area}</strong>
                    <p>{area} quadradinhos em cada face {config.faceAdjective === "azuis" ? "azul" : "colorida"}.</p>
                    <button className={styles.optionButton} onClick={() => dispatch({ type: "continue" })}>Continuar</button>
                </div> : state.phase === "calculationIntro" ? <div className={styles.revealCard}>
                    <div className={styles.factorRow}><span><strong>{config.faces.length}</strong><small>faces</small></span><b>×</b><span><strong>{area}</strong><small>quadradinhos<br />por face</small></span></div>
                    <strong>{expression(config)} = {area} × {config.faces.length}</strong>
                    <p>Trocar a ordem dos fatores não muda o resultado. Na conta armada, vamos colocar {area} em cima.</p>
                    <button className={styles.optionButton} onClick={() => dispatch({ type: "continue" })}>Fazer a conta</button>
                </div> : isCalculation ? <>
                    <div className={styles.equivalentExpression}>{expression(config)} = {area} × {config.faces.length}</div>
                    <div className={styles.calculationArea}>
                        <VerticalMultiplication key={state.stepIndex} topNumber={area} bottomNumber={config.faces.length}
                            readOnly={isTransition} maxTopDigits={2} guidanceMode="adaptive" processValidation="warn"
                            adaptiveGuidance={{ autoHintDelayMs: 25000 }}
                            keypadMode={portrait || touch ? "visible" : "hidden"} showClearButton={false}
                            onComplete={result => dispatch({ type: "calculationComplete", usedHints: result.usedHints })}
                            onMistake={() => dispatch({ type: "calculationMistake" })} />
                    </div>
                </> : <>
                    <div className={styles.optionsGrid}>{step.options.map(option => <button key={option} className={styles.optionButton} disabled={isTransition} onClick={() => dispatch({ type: "guess", answer: option })}>{option}</button>)}</div>

                </>}
            </>}
          </div>
        </div>
        {(state.phase === "question" || isTransition) && step.kind !== "calculation" && <div className={styles.hintDock}>
            <button className={`${styles.hintButton} ${offerHelp ? styles.offeredHint : ""}`} disabled={isTransition || state.hintLevel >= 3} onClick={() => dispatch({ type: "hint" })}>
                <Lightbulb aria-hidden="true" />{state.hintLevel >= 3 ? "Dica completa" : state.hintLevel ? "Mais uma dica" : "Dica"}
            </button>
            {offerHelp && <span className={styles.helpPrompt}>Precisa de uma dica?</span>}
        </div>}
    </div>;
};
export default Class3TotalSquares;
