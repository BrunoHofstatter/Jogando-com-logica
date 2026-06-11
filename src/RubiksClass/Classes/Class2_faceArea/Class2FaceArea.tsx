import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RubiksCube from "../../Components/RubiksCube";
import { useClass2 } from "./useClass2";
import Class2SummaryView from "./Class2SummaryView";
import styles from "./Class2FaceArea.module.css";
import { ROUTES } from "../../../routes";


const Class2FaceArea: React.FC = () => {
    const { cubeProps, uiProps } = useClass2();
    const navigate = useNavigate();

    useEffect(() => {
        document.body.style.backgroundColor = "#e0f2fe";
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement("meta");
            metaThemeColor.setAttribute("name", "theme-color");
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.setAttribute("content", "#e0f2fe");
    }, []);

    // --- Summary phase ---
    if (uiProps.currentPhase === "summary") {
        return <Class2SummaryView totalFlags={uiProps.totalFlags} />;
    }

    const isTransition = uiProps.currentPhase === "transition";
    const showHint =
        uiProps.currentPhase === "hint1" ||
        uiProps.currentPhase === "hint2";

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
                    <div
                        className={styles.successCard}
                    >
                        <span className={styles.hintIcon}>✅</span>
                        {uiProps.feedbackText}
                    </div>
                )}
            </div>

            {/* --- Left panel: Cube visualization --- */}
            <div className={styles.leftPanel}>
                <div className={styles.headerOverlay}>
                    <div className={styles.cubeTitle}>
                        Cubo {cubeProps.size}×{cubeProps.size}
                    </div>
                </div>
                <RubiksCube {...cubeProps} cubeSize={window.matchMedia("(max-width: 600px) and (orientation: portrait)").matches ? 33 : 22} />
            </div>

            {/* --- Right panel: Interaction --- */}
            <div className={styles.rightPanel}>
                <div className={styles.progress}>
                    Pergunta {uiProps.currentStepIndex + 1} de {uiProps.totalSteps}
                </div>

                <h1 className={styles.title}>
                    {uiProps.question}
                </h1>

                {/* Options grid */}
                <div className={styles.optionsGrid}>
                    {uiProps.options.map((opt) => (
                        <button
                            key={opt.value}
                            className={styles.optionButton}
                            disabled={isTransition}
                            onClick={() => uiProps.handleGuess(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Class2FaceArea;
