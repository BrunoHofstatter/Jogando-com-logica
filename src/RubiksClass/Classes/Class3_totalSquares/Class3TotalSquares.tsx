import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LessonCube } from "./LessonCube";
import { expression, faceExpression, hintText, LESSON_STEPS } from "./class3Lesson";
import { VerticalMultiplication } from "../../../Shared/Calculation";
import { useClass3 } from "./useClass3";
import styles from "./Class3TotalSquares.module.css";
import { ROUTES } from "../../../routes";
import { useGameAttemptAnalytics } from "../../../analytics/useGameAttemptAnalytics";

const calculationClassNames = {
    root: styles.calculationRoot,
    workspace: styles.calculationWorkspace,
    calculationStage: styles.calculationStage,
    controlRail: styles.calculationControlRail,
    grid: styles.calculationGrid,
    cell: styles.calculationCell,
    cellAnchor: styles.calculationCellAnchor,
    operandCell: styles.operandCell,
    resultCell: styles.resultCell,
    carryCell: styles.carryCell,
    operator: styles.calculationOperator,
    bar: styles.calculationBar,
    activeCell: styles.activeCell,
    disabledCell: styles.disabledCell,
    keypad: styles.keypad,
    keypadButton: styles.keypadButton,
    toolbar: styles.calculationToolbar,
    actionButton: styles.calculationActionButton,
    checkButton: styles.checkButton,
    message: styles.calculationMessage,
    coach: styles.calculationCoach,
    coachArrow: styles.calculationCoachArrow,
    coachBadge: styles.calculationCoachBadge,
    coachText: styles.calculationCoachText,
    coachEquation: styles.calculationCoachEquation,
    coachLeadingDigit: styles.calculationCoachLeadingDigit,
    coachResultDigit: styles.calculationCoachResultDigit,
    coachLeft: styles.calculationCoachLeft,
    coachRight: styles.calculationCoachRight,
    coachBelow: styles.calculationCoachBelow,
    helpButton: styles.calculationHelpButton,
};

const Class3TotalSquares: React.FC = () => {
    const { state, step, config, dispatch, offerHelp } = useClass3();
    const navigate = useNavigate();
    const [portrait, setPortrait] = useState(() => window.matchMedia("(max-width: 650px) and (orientation: portrait)").matches);
    const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const [touch, setTouch] = useState(() => window.matchMedia("(pointer: coarse)").matches);
    useEffect(() => {
        const queries = [window.matchMedia("(max-width: 650px) and (orientation: portrait)"), window.matchMedia("(prefers-reduced-motion: reduce)"), window.matchMedia("(pointer: coarse)")];
        const update = () => { setPortrait(queries[0].matches); setReducedMotion(queries[1].matches); setTouch(queries[2].matches); };
        queries.forEach(query => query.addEventListener("change", update));
        return () => queries.forEach(query => query.removeEventListener("change", update));
    }, []);
    const { completeAttempt, startAttempt } = useGameAttemptAnalytics({
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
    const isCalculation = step.kind === "calculation" && state.phase === "question";
    return <div className={styles.container}>
        <button className={styles.aulasButton} onClick={() => navigate(ROUTES.CLASS_MENU)}>Aulas</button>
        <LessonCube key={step.configuration} config={config} step={step} state={state} reducedMotion={reducedMotion} portrait={portrait} />
        <div className={styles.rightPanel}>
            {state.phase === "complete" ? <div className={styles.completeCard}>
                <h1 className={styles.completeTitle}>Aula completa!</h1>
                <p className={styles.completeText}>Você aprendeu a multiplicar a quantidade de faces pelos quadradinhos de cada face. Vale para algumas faces e para o cubo inteiro!</p>
                <p className={styles.completeStats}>Erros: {state.incorrectCount} · Dicas usadas: {state.assistanceCount}</p>
                <button className={styles.completeButton} onClick={() => navigate(ROUTES.CLASS_MENU)}>Voltar às Aulas</button>
            </div> : <>
                <div className={styles.progress}>Multiplicação nas Faces · {state.stepIndex + 1}/{LESSON_STEPS.length}</div>
                <h1 className={styles.title} aria-live="polite">{state.phase === "faceResult" ? "Uma face colorida" : state.phase === "calculationIntro" ? "Vamos armar a multiplicação" : step.question}</h1>
                {showHint && <div className={styles.lessonHint} role="status">{hintText(step, state.hintLevel)}</div>}
                {showGrouping && <div className={styles.grouping}>
                    <div className={styles.sumStrip}>{Array.from({ length: config.faces.length }, (_, index) => <React.Fragment key={index}>{index > 0 && <span>+</span>}<span className={styles.sumTerm} data-color={config.color}>{area}</span></React.Fragment>)}</div>
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
                            maxTopDigits={2} guidanceMode="adaptive" processValidation="require"
                            adaptiveGuidance={{ autoHintDelayMs: config.size === 4 ? 12000 : config.size === 5 ? 16000 : 20000, detailedHintDelayMs: config.size === 4 ? 26000 : config.size === 5 ? 32000 : 38000, mistakesBeforeHint: config.size === 4 ? 1 : 2, mistakesBeforeDetailedHint: config.size === 4 ? 2 : 3 }}
                            keypadMode={portrait || touch ? "visible" : "hidden"} showClearButton={false} classNames={calculationClassNames}
                            messages={{ chooseCell: "Clique em um espaço e comece pela coluna destacada.", assistedNextStep: "Tente seguir o espaço amarelo destacado.", checkAnswer: "Verificar", clear: "Limpar", correct: "Isso! A conta está certa.", tryAgain: "Ainda não. Revise os algarismos da conta.", help: "Preciso de ajuda", yourTurn: "Sua vez" }}
                            onComplete={result => dispatch({ type: "calculationComplete", usedHints: result.usedHints })}
                            onMistake={() => dispatch({ type: "calculationMistake" })} />
                    </div>
                </> : <>
                    <div className={styles.optionsGrid}>{step.options.map(option => <button key={option} className={styles.optionButton} disabled={isTransition} onClick={() => dispatch({ type: "guess", answer: option })}>{option}</button>)}</div>
                    <div className={styles.lessonActions}>
                        <button className={`${styles.hintButton} ${offerHelp ? styles.offeredHint : ""}`} disabled={isTransition || state.hintLevel >= 3} onClick={() => dispatch({ type: "hint" })}>{state.hintLevel >= 3 ? "Dica completa" : state.hintLevel ? "Mais uma dica" : "Dica"}</button>
                        {offerHelp && <span>Precisa de uma dica?</span>}
                    </div>
                </>}
                {isTransition && <div className={styles.successCard} role="status">{step.kind === "expression" ? `Correto! ${expression(config)}: ${config.faces.length} faces com ${area} quadradinhos cada.` : step.kind === "total" || step.kind === "calculation" ? `Correto! ${expression(config)} = ${step.answer}.` : "Correto!"}</div>}
            </>}
        </div>
    </div>;
};
export default Class3TotalSquares;