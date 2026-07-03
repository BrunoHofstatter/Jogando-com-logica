import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RubiksCube from "../../Components/RubiksCube";
import { VerticalMultiplication } from "../../../Shared/Calculation";
import { useClass3 } from "./useClass3";
import styles from "./Class3TotalSquares.module.css";
import { ROUTES } from "../../../routes";

const calculationClassNames = {
    root: styles.calculationRoot,
    grid: styles.calculationGrid,
    cell: styles.calculationCell,
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
};

const Class3TotalSquares: React.FC = () => {
    const { cubeProps, uiProps } = useClass3();
    const navigate = useNavigate();
    const [prefersTouch, setPrefersTouch] = useState(() =>
        window.matchMedia("(pointer: coarse)").matches
    );

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

    useEffect(() => {
        const pointerQuery = window.matchMedia("(pointer: coarse)");
        const updatePointerPreference = () => setPrefersTouch(pointerQuery.matches);

        updatePointerPreference();
        pointerQuery.addEventListener("change", updatePointerPreference);

        return () => pointerQuery.removeEventListener("change", updatePointerPreference);
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
                {showHint && (
                    <div className={styles.hintCard} key={uiProps.currentPhase}>
                        <span className={styles.hintIcon}>Dica:</span>
                        {uiProps.feedbackText}
                    </div>
                )}

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
                            <div className={styles.calculationCard}>
                                <p className={styles.supportingText}>{uiProps.calculationSupportingText}</p>
                                <VerticalMultiplication
                                    key={uiProps.currentStepIndex}
                                    topNumber={uiProps.calculationTopNumber}
                                    bottomNumber={uiProps.calculationBottomNumber}
                                    maxTopDigits={2}
                                    guidanceMode="assisted"
                                    processValidation="warn"
                                    keypadMode={prefersTouch ? "visible" : "hidden"}
                                    classNames={calculationClassNames}
                                    messages={{
                                        chooseCell: "Clique em um espaço e use o teclado.",
                                        assistedNextStep: "Esse espaço pode ser usado, mas tente seguir a próxima coluna indicada.",
                                        checkAnswer: "Verificar",
                                        clear: "Limpar",
                                        correct: "Isso! A conta está certa.",
                                        tryAgain: "Ainda não. Revise os algarismos da conta.",
                                    }}
                                    onComplete={uiProps.handleCalculationComplete}
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
