import { useEffect, useReducer, useState } from "react";
import { useLocation } from "react-router-dom";
import {
    class2Reducer, initialLessonState, LESSON_STEPS, lessonCubeProps, lessonHint,
} from "./class2Lesson";

const AUTO_HINT_THRESHOLD_S = 45;
const TRANSITION_DELAY_MS = 1200;

export function useClass2() {
    const location = useLocation();
    const isGameMode = location.state?.mode === "game" ||
        new URLSearchParams(location.search).get("mode") === "game";
    const [state, dispatch] = useReducer(class2Reducer, isGameMode, initialLessonState);
    const [offerHelp, setOfferHelp] = useState(false);
    const currentStep = LESSON_STEPS[state.stepIndex];

    useEffect(() => {
        setOfferHelp(false);
        if (state.phase !== "question" || state.hintLevel > 0) return;
        let elapsed = 0;
        const interval = setInterval(() => {
            if (document.visibilityState !== "visible") return;
            elapsed += 1;
            if (elapsed >= AUTO_HINT_THRESHOLD_S) {
                setOfferHelp(true);
                clearInterval(interval);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [state.stepIndex, state.phase, state.hintLevel]);

    useEffect(() => {
        if (state.phase !== "transition") return;
        const timer = setTimeout(() => dispatch({ type: "advance" }), TRANSITION_DELAY_MS);
        return () => clearTimeout(timer);
    }, [state.phase, state.stepIndex]);

    return {
        state, currentStep, cubeProps: lessonCubeProps(currentStep, state),
        feedbackText: lessonHint(currentStep, state.hintLevel), offerHelp, dispatch,
    };
}
