import React from "react";
import { useNavigate } from "react-router-dom";
import RubiksCube from "../../Components/RubiksCube";
import { useClass1 } from "./useClass1";
import SummaryView from "./SummaryView";
import styles from "./Class1Dimensions.module.css";

const LEVELS = [2, 3, 4, 5, 6];

const Class1Dimensions: React.FC = () => {
    const { cubeProps, uiProps } = useClass1();
    const navigate = useNavigate();

    // --- Summary phase ---
    if (uiProps.currentPhase === "summary") {
        return <SummaryView totalFlags={uiProps.totalFlags} />;
    }

    const isTransition = uiProps.currentPhase === "transition";
    const showHint =
        uiProps.currentPhase === "hint1" || uiProps.currentPhase === "hint2";

    return (
        <div className={styles.container}>
            {/* --- Back to Menu Button --- */}
            <button className={styles.aulasButton} onClick={() => navigate("/classMenu")}>
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
                    cubeSize={22}
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
