import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RubiksCube from "../../Components/RubiksCube";
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
    const { cubeProps, uiProps } = useClass3();
    const navigate = useNavigate();
    const [needsOnScreenKeypad, setNeedsOnScreenKeypad] = useState(() =>
        window.matchMedia("(pointer: coarse)").matches ||
        window.matchMedia("(max-width: 650px) and (orientation: portrait)").matches
    );
    const { completeAttempt, startAttempt } = useGameAttemptAnalytics({
        gameId: "cubo_magico",
        gameMode: "solo",
        usageContext: "standard",
        participantCount: 1,
        levelId: "class_03",
        activityVariant: "lesson",
    });

    useEffect(() => {
        startAttempt();
    }, [startAttempt]);

    useEffect(() => {
        if (uiProps.currentPhase === "complete") {
            completeAttempt({
                incorrectCount: uiProps.totalFlags,
                outcome: "completed",
                success: true,
            });
        }
    }, [completeAttempt, uiProps.currentPhase, uiProps.totalFlags]);


    useEffect(() => {
        const pointerQuery = window.matchMedia("(pointer: coarse)");
        const portraitQuery = window.matchMedia("(max-width: 650px) and (orientation: portrait)");
        const updateKeypadPreference = () => {
            setNeedsOnScreenKeypad(pointerQuery.matches || portraitQuery.matches);
        };

        updateKeypadPreference();
        pointerQuery.addEventListener("change", updateKeypadPreference);
        portraitQuery.addEventListener("change", updateKeypadPreference);

        return () => {
            pointerQuery.removeEventListener("change", updateKeypadPreference);
            portraitQuery.removeEventListener("change", updateKeypadPreference);
        };
    }, []);

    const isTransition = uiProps.currentPhase === "transition";
    const isComplete = uiProps.currentPhase === "complete";
    const showHint =
        uiProps.currentPhase === "hint1" ||
        uiProps.currentPhase === "hint2" ||
        uiProps.currentPhase === "hint3";

    return (
        <div className={styles.container}>
            <button className={styles.aulasButton} onClick={() => navigate(ROUTES.CLASS_MENU)}>
                Aulas
            </button>

            <div className={styles.feedbackOverlay}>
                {(isTransition || isComplete) && (
                    <div className={styles.successCard}>
                        <span className={styles.hintIcon}>{isComplete ? "Fim:" : "Boa:"}</span>
                        {uiProps.feedbackText}
                    </div>
                )}
            </div>

            <div className={styles.leftPanel}>
                <div className={styles.headerOverlay}>
                    <div className={styles.cubeTitle}>
                        Cubo {cubeProps.size}×{cubeProps.size}
                    </div>
                </div>
                <RubiksCube
                    {...cubeProps}
                    cubeSize={window.matchMedia("(max-width: 600px) and (orientation: portrait)").matches ? 32 : 21}
                />
                {showHint && (
                    <div className={styles.cubeHintCard} key={uiProps.currentPhase}>
                        <span className={styles.cubeHintArrow} aria-hidden="true" />
                        <span className={styles.hintIcon}>Dica:</span>
                        {uiProps.feedbackText}
                    </div>
                )}
            </div>

            <div className={styles.rightPanel}>
                {isComplete ? (
                    <div className={styles.completeCard}>
                        <h1 className={styles.completeTitle}>Aula completa!</h1>
                        <p className={styles.completeText}>
                            Agora você sabe calcular os quadradinhos de uma face e multiplicar pelas 6 faces do cubo.
                        </p>
                        <p className={styles.completeStats}>Erros durante a aula: {uiProps.totalFlags}</p>
                        <button className={styles.completeButton} onClick={() => navigate(ROUTES.CLASS_MENU)}>
                            Voltar às Aulas
                        </button>
                    </div>
                ) : (
                    <>
                        <h1 className={styles.title}>{uiProps.question}</h1>

                        {uiProps.isCalculationStep && uiProps.calculationTopNumber !== null && uiProps.calculationBottomNumber !== null ? (
                            <div className={styles.calculationArea}>
                                <VerticalMultiplication
                                    key={uiProps.currentStepIndex}
                                    topNumber={uiProps.calculationTopNumber}
                                    bottomNumber={uiProps.calculationBottomNumber}
                                    maxTopDigits={2}
                                    guidanceMode="adaptive"
                                    adaptiveGuidance={uiProps.calculationAssistance ?? undefined}
                                    processValidation="require"
                                    keypadMode={needsOnScreenKeypad ? "visible" : "hidden"}
                                    showClearButton={false}
                                    classNames={calculationClassNames}
                                    messages={{
                                        chooseCell: "Clique em um espaço e comece pela coluna destacada.",
                                        assistedNextStep: "Tente seguir o espaço amarelo destacado.",
                                        checkAnswer: "Verificar",
                                        clear: "Limpar",
                                        correct: "Isso! A conta está certa.",
                                        tryAgain: "Ainda não. Revise os algarismos da conta.",
                                        help: "Preciso de ajuda",
                                        yourTurn: "Sua vez",
                                        hint: "Dica",
                                    }}
                                    onComplete={uiProps.handleCalculationComplete}
                                    onMistake={uiProps.handleCalculationMistake}
                                />
                            </div>
                        ) : (
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
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Class3TotalSquares;
