import { useEffect, useReducer, useState } from "react";
import { class3Reducer, CONFIGURATIONS, initialState, LESSON_STEPS } from "./class3Lesson";

export function useClass3() {
    const [state, dispatch] = useReducer(class3Reducer, initialState);
    const [offerHelp, setOfferHelp] = useState(false);
    const step = LESSON_STEPS[state.stepIndex];
    const config = CONFIGURATIONS[step.configuration];
    useEffect(() => {
        if (state.phase !== "transition") return;
        const timer = setTimeout(() => dispatch({ type: "advance", stepIndex: state.stepIndex }), 1200);
        return () => clearTimeout(timer);
    }, [state.phase, state.stepIndex]);
    useEffect(() => {
        setOfferHelp(false);
        if (state.phase !== "question" || state.hintLevel || step.kind === "calculation") return;
        let seconds = 0;
        const timer = setInterval(() => {
            if (document.visibilityState !== "visible") return;
            if (++seconds >= 45) { setOfferHelp(true); clearInterval(timer); }
        }, 1000);
        return () => clearInterval(timer);
    }, [state.phase, state.hintLevel, state.stepIndex, step.kind]);
    return { state, step, config, dispatch, offerHelp };
}
