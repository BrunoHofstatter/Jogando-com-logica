import { useLessonEntry } from "../../Testing/entryContext";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Lightbulb } from "lucide-react";
import { useCubeMobileLayout } from "../../Components/useCubeMobileLayout";
import { useLocation, useNavigate } from "react-router-dom";
import RubiksCube from "../../Components/RubiksCube";
import { useClass2 } from "./useClass2";
import { multiplication, repeatedAddition, rowColors } from "./class2Lesson";
import Class2SummaryView from "./Class2SummaryView";
import styles from "./Class2FaceArea.module.css";
import { LessonSuccess } from "../../Components/LessonSuccess";
import { TemporaryFeedback } from "../../Components/TemporaryFeedback";
import { ROUTES } from "../../../routes";
import { useGameAttemptAnalytics } from "../../../analytics/useGameAttemptAnalytics";


const Class2FaceArea: React.FC = () => {
    const { isCheckpoint } = useLessonEntry();
    const mobile = useCubeMobileLayout();
    const { cubeProps, state, currentStep, feedbackText, offerHelp, dispatch } = useClass2();
    const navigate = useNavigate();
    const location = useLocation();
    const [reviewRound, setReviewRound] = useState(0);
    const isReview =
        location.state?.mode === "game" ||
        new URLSearchParams(location.search).get("mode") === "game";
    const analyticsContext = useMemo(() => ({
        gameId: "cubo_magico" as const,
        gameMode: "solo" as const,
        usageContext: "standard" as const,
        playerSlotCount: 1,
        levelId: "class_02",
        activityVariant: isReview || reviewRound > 0 ? "review" as const : "lesson" as const,
    }), [isReview, reviewRound]);
    const { completeAttempt, startAttempt } = useGameAttemptAnalytics(isCheckpoint ? null : analyticsContext);

    useEffect(() => {
        if (!isReview) startAttempt();
    }, [startAttempt, isReview]);

    const handleSummaryComplete = useCallback((summaryMistakes: number) => {
        return completeAttempt({
            assistanceCount: reviewRound ? 0 : state.assistanceCount,
            incorrectCount: (reviewRound ? 0 : state.incorrectCount) + summaryMistakes,
            outcome: "completed",
            success: true,
        });
    }, [completeAttempt, state.assistanceCount, state.incorrectCount, reviewRound]);


    // --- Summary phase ---
    if (state.phase === "summary") {
        return (
            <Class2SummaryView key={reviewRound}
                totalFlags={isReview || reviewRound ? undefined : state.incorrectCount}
                lessonHints={reviewRound ? 0 : state.assistanceCount}
                onReplay={() => setReviewRound(round => round + 1)}
                onComplete={handleSummaryComplete}
                onStart={startAttempt}
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

            {isTransition && <LessonSuccess />}

            {/* --- Left panel: Cube visualization --- */}
            <div className={styles.leftPanel}>
                <div className={styles.headerOverlay}>
                    {showHint && <div role="status" aria-live="polite" className={styles.hintCard} key={state.hintLevel}>{feedbackText}</div>}
                </div>
                <div className={styles.cubeStage} role="group" aria-label={`Face com ${currentStep.size} linhas de ${currentStep.size} quadradinhos${currentStep.rows < currentStep.size ? `; ${currentStep.rows} linhas destacadas` : ""}.`}>
                    <RubiksCube {...cubeProps} cubeSize={mobile ? 33 : 22} />
                </div>
            </div>

            {/* --- Right panel: Interaction --- */}
            <div className={styles.rightPanel}>
              <div className={styles.lessonContent}>
                <h1 className={styles.title} aria-live="polite">
                    {isReveal ? "Uma soma pode virar multiplicação!" : currentStep.question}
                </h1>
                {state.incorrectAnswer !== null && <TemporaryFeedback key={state.incorrectCount} message="Ainda não! Tente outra resposta." />}
                {showGrouping && (
                    <div className={styles.grouping} key={currentStep.id}>
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
                        {state.hintLevel >= 3 && !isReveal && currentStep.kind === "total" && (
                            <div className={styles.runningTotals}>
                                {multiplication(currentStep)} = {currentStep.rows * currentStep.size}
                            </div>
                        )}
                    </div>
                )}

                {isReveal ? (
                    <div className={styles.lessonActions}>
                        <button className={`${styles.optionButton} ${styles.continueButton}`} onClick={() => dispatch({ type: "continueReveal" })}>Continuar</button>
                    </div>
                ) : <>
                <div className={`${styles.optionsGrid} ${isAddition ? styles.additionOptions : ""}`}>
                    {currentStep.options.map((opt) => (
                        <button
                            key={opt.value}
                            className={`${styles.optionButton} ${state.selectedSum === opt.value ? styles.selectedOption : ""} ${state.incorrectAnswer === opt.value ? styles.wrongOption : ""}`}
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
                </>}
              </div>
            </div>
            {!isReveal && <div className={styles.hintDock}>
                    <button className={`${styles.hintButton} ${offerHelp ? styles.offeredHint : ""}`}
                        disabled={isTransition || state.hintLevel >= 3}
                        onClick={() => dispatch({ type: "hint" })}>
                        <Lightbulb aria-hidden="true" />
                        {state.hintLevel >= 3 ? "Dica completa" : state.hintLevel > 0 ? "Mais uma dica" : "Dica"}
                    </button>
                    {offerHelp && <span className={styles.helpPrompt}>Precisa de uma dica?</span>}
                </div>}
        </div>
    );
};

export default Class2FaceArea;
