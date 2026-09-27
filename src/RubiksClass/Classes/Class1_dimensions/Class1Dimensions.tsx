import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLessonEntry } from "../../Testing/entryContext";
import { useCubeMobileLayout } from "../../Components/useCubeMobileLayout";
import { useClass1 } from "./useClass1";
import { class1Hint } from "./class1Lesson";
import { Class1Cube } from "./Class1Cube";
import SummaryView from "./SummaryView";
import { Lightbulb } from "lucide-react";
import chrome from "./Class1Chrome.module.css";
import { TemporaryFeedback } from "./TemporaryFeedback";
import styles from "./Class1Dimensions.module.css";
import { ROUTES } from "../../../routes";
import { useGameAttemptAnalytics } from "../../../analytics/useGameAttemptAnalytics";

export default function Class1Dimensions() {
    const { isCheckpoint } = useLessonEntry();
    const { state, dispatch, step, offerHelp, review } = useClass1();
    const mobile = useCubeMobileLayout();
    const navigate = useNavigate();
    const [reviewRound, setReviewRound] = useState(0);
    const heading = useRef<HTMLHeadingElement>(null);
    const context = useMemo(() => ({
        gameId: "cubo_magico" as const, gameMode: "solo" as const, usageContext: "standard" as const,
        playerSlotCount: 1, levelId: "class_01", activityVariant: review || reviewRound > 0 ? "review" as const : "lesson" as const,
    }), [review, reviewRound]);
    const { completeAttempt, startAttempt } = useGameAttemptAnalytics(isCheckpoint ? null : context);
    useEffect(() => { startAttempt(); }, [startAttempt, reviewRound]);
    useEffect(() => {
        if (state.phase === "question" || state.phase === "reveal") heading.current?.focus();
    }, [state.stepIndex, state.phase]);
    const handleComplete = useCallback((mistakes: number, hints: number) => completeAttempt({
        assistanceCount: (reviewRound ? 0 : state.assistanceCount) + hints,
        incorrectCount: (reviewRound ? 0 : state.incorrectCount) + mistakes,
        outcome: "completed", success: true,
    }), [completeAttempt, state.assistanceCount, state.incorrectCount, reviewRound]);
    if (state.phase === "summary") return <SummaryView key={reviewRound}
        lessonErrors={review || reviewRound ? undefined : state.incorrectCount}
        lessonHints={reviewRound ? 0 : state.assistanceCount} onComplete={handleComplete}
        onReplay={() => setReviewRound(value => value + 1)} />;
    const reveal = state.phase === "reveal";
    const hint = state.hintLevel > 0 && state.phase === "question";
    const rows = step.kind === "rows" || reveal;
    const cubeProps = {
        size: step.size, highlightRegion: hint && !rows ? { type: "row" as const, index: 0 } : null,
        dimInactive: hint && !rows, showCounting: hint && state.hintLevel === 2 && !rows,
        hintAnimationKey: hint ? `${step.id}-${state.focusVersion}` : undefined,
        focusRequest: hint ? state.focusVersion : 0,
        rowGuides: (hint && rows) || reveal ? { front: Array.from({ length: step.size }, (_, row) => ({ row, glow: true, label: reveal || state.hintLevel === 2 ? String(row + 1) : undefined })) } : undefined,
    };
    return <div className={styles.container}>
        <button className={chrome.aulasButton} onClick={() => navigate(ROUTES.CLASS_MENU)}>Aulas</button>
        <div className={styles.feedbackOverlay}>
            {state.phase === "transition" && <div className={styles.successCard} role="status">Correto!</div>}
        </div>
        <div className={styles.leftPanel}>
            <div className={chrome.headerOverlay}>{hint && <div className={chrome.hintCard} role="status">{class1Hint(step, state.hintLevel)}</div>}</div>
            <div className={styles.cubeGroup}>
                <Class1Cube key={`${step.id}-${reveal}`} {...cubeProps}
                    cubeSize={mobile ? 33 : 22}
                    demo={state.phase === "question" && state.stepIndex < 3 && !state.practicedRotation && !hint}
                    onRotate={() => dispatch({ type: "rotate" })} />

            </div>
        </div>
        <div className={styles.rightPanel}>
            <h1 className={styles.title} ref={heading} tabIndex={-1}>{reveal ? "De onde vem o nome 2×2?" : step.question}</h1>
            {reveal ? <div className={styles.reveal}>
                <p>2 linhas, com 2 quadradinhos em cada linha.</p>
                <strong>Este cubo é chamado de 2×2.</strong>
                <button className={styles.optionButton} onClick={() => dispatch({ type: "continue" })}>Continuar</button>
            </div> : <>
                <div className={styles.optionsGrid}>
                    {step.options.map(option => <button key={option}
                        className={`${styles.optionButton} ${state.lastWrong === option ? styles.wrongOption : ""}`}
                        disabled={state.phase === "transition"} onClick={() => dispatch({ type: "guess", answer: option })}>{option}</button>)}
                </div>
                {state.lastWrong && <TemporaryFeedback key={state.feedbackVersion} message="Ainda não. Observe a grade e tente novamente." />}
                <div className={chrome.hintDock}>
                    <button className={`${chrome.hintButton} ${offerHelp ? chrome.offeredHelp : ""}`}
                        disabled={state.phase !== "question"} onClick={() => dispatch({ type: "hint" })}>
                        <Lightbulb aria-hidden="true" />
                        {state.hintLevel === 2 ? "Ver dica novamente" : "Dica"}
                    </button>
                </div>
            </>}
        </div>
    </div>;
}
