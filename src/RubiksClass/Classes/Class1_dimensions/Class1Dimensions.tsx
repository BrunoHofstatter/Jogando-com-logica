import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RubiksCube from "../../Components/RubiksCube";
import { useClass1 } from "./useClass1";
import SummaryView from "./SummaryView";
import styles from "./Class1Dimensions.module.css";
import { ROUTES } from "../../../routes";


const LEVELS = [2, 3, 4, 5, 6];

const Class1Dimensions: React.FC = () => {
    const { cubeProps, uiProps } = useClass1();
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
        return <SummaryView totalFlags={uiProps.totalFlags} />;
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
