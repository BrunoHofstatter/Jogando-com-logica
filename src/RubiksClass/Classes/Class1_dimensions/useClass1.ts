import { useEffect, useReducer, useState } from "react";
import { useLocation } from "react-router-dom";
import { useLessonEntry } from "../../Testing/entryContext";
import { CLASS1_STEPS, class1Reducer, initialClass1 } from "./class1Lesson";

export function useClass1() {
    const entry = useLessonEntry();
    const location = useLocation();
    const review = !entry.isCheckpoint && (location.state?.mode === "game" || new URLSearchParams(location.search).get("mode") === "game");
    const [state, dispatch] = useReducer(class1Reducer, undefined, () => initialClass1(entry.stepIndex, review));
    const [offerHelp, setOfferHelp] = useState(false);
    useEffect(() => {
        setOfferHelp(false);
        if (state.phase !== "question" || state.hintLevel > 0) return;
        let seconds = 0;
        const interval = setInterval(() => {
            if (document.visibilityState !== "visible") return;
            if (++seconds >= 30) { setOfferHelp(true); clearInterval(interval); }
        }, 1000);
        return () => clearInterval(interval);
    }, [state.stepIndex, state.phase, state.hintLevel]);
    useEffect(() => {
        if (state.phase !== "transition") return;
        const timeout = setTimeout(() => dispatch({ type: "advance", stepIndex: state.stepIndex }), 1200);
        return () => clearTimeout(timeout);
    }, [state.phase, state.stepIndex]);
    return { state, dispatch, step: CLASS1_STEPS[state.stepIndex], offerHelp, review };
}
