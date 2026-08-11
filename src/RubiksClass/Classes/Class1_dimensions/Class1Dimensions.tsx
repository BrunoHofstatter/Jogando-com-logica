import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RubiksCube from "../../Components/RubiksCube";
import { useClass1 } from "./useClass1";
import SummaryView from "./SummaryView";
import styles from "./Class1Dimensions.module.css";
import { ROUTES } from "../../../routes";
import { useGameAttemptAnalytics } from "../../../analytics/useGameAttemptAnalytics";


const Class1Dimensions: React.FC = () => {
    const { cubeProps, uiProps } = useClass1();
    const navigate = useNavigate();
    const location = useLocation();
    const isReview =
        location.state?.mode === "game" ||
        new URLSearchParams(location.search).get("mode") === "game";
    const analyticsContext = useMemo(() => ({
        gameId: "cubo_magico" as const,
        gameMode: "solo" as const,
        usageContext: "standard" as const,
        participantCount: 1,
        levelId: "class_01",
        activityVariant: isReview ? "review" as const : "lesson" as const,
    }), [isReview]);
    const { completeAttempt, startAttempt } = useGameAttemptAnalytics(analyticsContext);

    useEffect(() => {
        startAttempt();
    }, [startAttempt]);


    // --- Summary phase ---
    if (uiProps.currentPhase === "summary") {
        return (
            <SummaryView
                totalFlags={uiProps.totalFlags}
                onComplete={(summaryMistakes) => completeAttempt({
                    assistanceCount: uiProps.totalFlags,
                    incorrectCount: summaryMistakes,
                    outcome: "completed",
                    success: true,
                })}
            />
        );
    }

    const isTransition = uiProps.currentPhase === "transition";
    const showHint =
        uiProps.currentPhase === "hint1" || uiProps.currentPhase === "hint2";

    const isMobilePortrait = window.matchMedia("(max-width: 600px) and (orientation: portrait)").matches;

    return (
        <div className={styles.container}>
            {/* --- Back to Menu Button --- */}
            <button className={styles.aulasButton} onClick={() => navigate(ROUTES.CLASS_MENU)}>
                Aulas
            </button>

            {/* --- Feedback Overlay (Abs positioned at top center) --- */}
            <div className={styles.feedbackOverlay}>
                {showHint && (
                    <div className={styles.hintCard} key={uiProps.currentPhase}>
                        <span className={styles.hintIcon}>💡</span>
                        {uiProps.feedbackText}
                    </div>
                )}

                {isTransition && (
                    <div className={styles.successCard}>
                        <span className={styles.hintIcon}>✅</span>
                        {uiProps.feedbackText}
                    </div>
                )}
            </div>

            {/* --- Left panel: Cube visualization --- */}
            <div className={styles.leftPanel}>
                <RubiksCube
                    {...cubeProps}
                    cubeSize={isMobilePortrait ? 33 : 22}
                />
            </div>

            {/* --- Right panel: Interaction --- */}
            <div className={styles.rightPanel}>
                {/* Title */}
                <h1 className={styles.title}>Qual o tamanho deste cubo?</h1>

                {/* Options grid */}
                <div className={styles.optionsGrid}>
                    {uiProps.options.map((opt) => (
                        <button
                            key={opt}
                            className={styles.optionButton}
                            disabled={isTransition}
                            onClick={() => uiProps.handleGuess(opt)}
                        >
                            {opt}×{opt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Class1Dimensions;
