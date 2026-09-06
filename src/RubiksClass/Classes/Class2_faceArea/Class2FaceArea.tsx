import React, { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RubiksCube from "../../Components/RubiksCube";
import { useClass2 } from "./useClass2";
import { multiplication, repeatedAddition, rowColors } from "./class2Lesson";
import Class2SummaryView from "./Class2SummaryView";
import styles from "./Class2FaceArea.module.css";
import { ROUTES } from "../../../routes";
import { useGameAttemptAnalytics } from "../../../analytics/useGameAttemptAnalytics";


const Class2FaceArea: React.FC = () => {
    const { cubeProps, state, currentStep, feedbackText, offerHelp, dispatch } = useClass2();
    const navigate = useNavigate();
    const location = useLocation();
    const isReview =
        location.state?.mode === "game" ||
        new URLSearchParams(location.search).get("mode") === "game";
    const analyticsContext = useMemo(() => ({
        gameId: "cubo_magico" as const,
        gameMode: "solo" as const,
        usageContext: "standard" as const,
        playerSlotCount: 1,
        levelId: "class_02",
        activityVariant: isReview ? "review" as const : "lesson" as const,
    }), [isReview]);
    const { completeAttempt, startAttempt } = useGameAttemptAnalytics(analyticsContext);

    useEffect(() => {
        startAttempt();
    }, [startAttempt]);

    const handleSummaryComplete = useCallback((summaryMistakes: number) => {
        return completeAttempt({
            assistanceCount: state.assistanceCount,
            incorrectCount: state.incorrectCount + summaryMistakes,
            outcome: "completed",
            success: true,
        });
    }, [completeAttempt, state.assistanceCount, state.incorrectCount]);


    // --- Summary phase ---
    if (state.phase === "summary") {
        return (
            <Class2SummaryView
                totalFlags={state.incorrectCount}
                onComplete={handleSummaryComplete}
            />
        );
    }

    const isTransition = state.phase === "transition";
    const isReveal = state.phase === "reveal";
    const showHint = state.phase === "question" && state.hintLevel > 0;
    const isAddition = currentStep.kind === "addition";
    const showGrouping = isReveal || (state.hintLevel >= 2 &&
        currentStep.kind !== "rowSize" && currentStep.kind !== "rowCount" && !isAddition);
    const sumTerms = state.selectedSum?.split(" + ") ?? [];

    return (
        <div className={styles.container}>
            {/* --- Back to Menu Button --- */}
            <button className={styles.aulasButton} onClick={() => navigate(ROUTES.CLASS_MENU)}>
                Aulas
            </button>

            {/* --- Feedback Overlay (Abs positioned at top center) --- */}
            <div className={styles.feedbackOverlay} role="status" aria-live="polite">
                {showHint && (
                    <div className={styles.hintCard} key={state.hintLevel}>
                        <span className={styles.hintIcon}>💡</span>
                        {feedbackText}
                    </div>
                )}

                {isTransition && (
                    <div
                        className={styles.successCard}
                    >
                        <span className={styles.hintIcon}>✅</span>
                        {currentStep.kind === "total"
                            ? `Correto! ${multiplication(currentStep)} = ${currentStep.answer}.`
                            : "Correto!"}
                    </div>
                )}
            </div>

            {/* --- Left panel: Cube visualization --- */}
            <div className={styles.leftPanel}>
                <div className={styles.headerOverlay}>
                    <div className={styles.cubeTitle}>
                        {currentStep.rows < currentStep.size ? "Só as linhas destacadas" : "Uma face do cubo"}
                    </div>
                </div>
                <div role="img" aria-label={`Face com ${currentStep.size} linhas de ${currentStep.size} quadradinhos${currentStep.rows < currentStep.size ? `; ${currentStep.rows} linhas destacadas` : ""}.`}>
                    <RubiksCube {...cubeProps} cubeSize={window.matchMedia("(max-width: 650px) and (orientation: portrait)").matches ? 33 : 22} />
                </div>
            </div>

            {/* --- Right panel: Interaction --- */}
            <div className={styles.rightPanel}>
                <h1 className={styles.title} aria-live="polite">
                    {isReveal ? "Uma soma pode virar multiplicação!" : currentStep.question}
                </h1>

                {showGrouping && (
                    <div className={styles.grouping} key={`${currentStep.id}-${state.replayKey}`}>
                        <div className={styles.sumStrip} aria-label={repeatedAddition(currentStep)}>
                            {Array.from({ length: currentStep.rows }, (_, row) => (
                                <React.Fragment key={row}>
                                    {row > 0 && <span aria-hidden="true">+</span>}
                                    <span className={styles.sumTerm} data-row-color={rowColors[row]} style={{ "--term": row } as React.CSSProperties}>{currentStep.size}</span>
                                </React.Fragment>
                            ))}
                        </div>
                        <div className={isReveal ? styles.revealEquation : styles.equation}>
                            <span><strong>{currentStep.rows}</strong><small>linhas</small></span>
                            <b>×</b>
                            <span><strong>{currentStep.size}</strong><small>quadradinhos<br />por linha</small></span>
                        </div>
                        {state.hintLevel >= 3 && !isReveal && (
                            <div className={styles.runningTotals} aria-label="Somando uma linha de cada vez">
                                {Array.from({ length: currentStep.rows }, (_, row) => (
                                    <span key={row} style={{ "--term": row } as React.CSSProperties}>
                                        {row > 0 ? " → " : ""}{(row + 1) * currentStep.size}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {isReveal ? (
                    <div className={styles.lessonActions}>
                        <button className={`${styles.optionButton} ${styles.continueButton}`} onClick={() => dispatch({ type: "continueReveal" })}>Continuar</button>
                        <button className={styles.hintButton} onClick={() => dispatch({ type: "replay" })}>Ver de novo</button>
                    </div>
                ) : <>
                <div className={`${styles.optionsGrid} ${isAddition ? styles.additionOptions : ""}`}>
                    {currentStep.options.map((opt) => (
                        <button
                            key={opt.value}
                            className={`${styles.optionButton} ${state.selectedSum === opt.value ? styles.selectedOption : ""}`}
                            aria-pressed={isAddition ? state.selectedSum === opt.value : undefined}
                            disabled={isTransition}
                            onClick={() => dispatch({ type: isAddition ? "selectSum" : "guess", answer: opt.value })}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                {isAddition && state.selectedSum && (
                    <div className={styles.additionPreview}>
                        <div className={styles.previewRows} aria-label="Uma parcela para cada linha">
                            {Array.from({ length: Math.max(currentStep.rows, sumTerms.length) }, (_, row) => (
                                <div key={row} className={styles.previewRow}>
                                    <span className={styles.miniRow} data-row-color={row < currentStep.rows ? rowColors[row] : undefined}>
                                        {row < currentStep.rows
                                            ? Array.from({ length: currentStep.size }, (_, index) => <i key={index} />)
                                            : <span>Sem linha</span>}
                                    </span>
                                    <span>→</span><span>{sumTerms[row] ?? "?"}</span>
                                </div>
                            ))}
                        </div>
                        <button className={`${styles.optionButton} ${styles.continueButton}`} onClick={() => dispatch({ type: "guess", answer: state.selectedSum! })}>Confirmar</button>
                    </div>
                )}
                <div className={styles.lessonActions}>
                    <button className={`${styles.hintButton} ${offerHelp ? styles.offeredHint : ""}`}
                        disabled={isTransition || state.hintLevel >= 3}
                        onClick={() => dispatch({ type: "hint" })}>
                        {state.hintLevel >= 3 ? "Dica completa" : state.hintLevel > 0 ? "Mais uma dica" : "Dica"}
                    </button>
                    {offerHelp && <span className={styles.helpPrompt}>Precisa de uma dica?</span>}
                </div>
                </>}
            </div>
        </div>
    );
};

export default Class2FaceArea;
