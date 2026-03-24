import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";

// --- Types -------------------------------------------------------------------

export type Class1Phase = "question" | "hint1" | "hint2" | "transition" | "summary";

export interface HighlightRegion {
    type: "row" | "col" | "face";
    index: number;
}

export interface CubeProps {
    size: number;
    highlightRegion: HighlightRegion | null;
    dimInactive: boolean;
    showIndices: boolean;
    showCounting: boolean;
    resetToFront: boolean;
}

export interface UiProps {
    options: number[];
    currentPhase: Class1Phase;
    feedbackText: string;
    handleGuess: (guessedSize: number) => void;
    totalFlags: number;
    currentLevelIndex: number;
    timer: number;
}

export interface UseClass1Return {
    cubeProps: CubeProps;
    uiProps: UiProps;
}

// --- Constants ---------------------------------------------------------------

const LEVELS = [2, 3, 4, 5, 6];
const OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9];
const AUTO_HINT_THRESHOLD_S = 30;
const TRANSITION_DELAY_MS = 1500;

// --- Feedback text -----------------------------------------------------------

function getFeedbackText(phase: Class1Phase): string {
    switch (phase) {
        case "hint1":
            return "Conte quantos quadrados tem na linha de cima.";
        case "hint2":
            return "Veja os números aparecendo: 1, 2, 3...";
        case "transition":
            return "Correto! 🎉";
        case "summary":
            return "Parabéns! Você completou a aula!";
        default:
            return "";
    }
}

// --- Hook --------------------------------------------------------------------

export function useClass1(): UseClass1Return {
    const location = useLocation();
    const isGameMode = location.state?.mode === "game" || new URLSearchParams(location.search).get("mode") === "game";
    const initialPhase: Class1Phase = isGameMode ? "summary" : "question";

    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [phase, setPhase] = useState<Class1Phase>(initialPhase);
    const [totalFlags, setTotalFlags] = useState(0);
    const [timer, setTimer] = useState(0);

    // Track whether hint was triggered by the lock prop to pulse resetToFront
    const [shouldResetToFront, setShouldResetToFront] = useState(false);
    const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- Timer (1s interval, only during "question" phase) -------------------
    useEffect(() => {
        if (phase !== "question") return;

        const intervalId = setInterval(() => {
            setTimer((prev) => {
                const next = prev + 1;
                if (next >= AUTO_HINT_THRESHOLD_S) {
                    // Auto-transition to hint1
                    setPhase("hint1");
                    setTotalFlags((f) => f + 1);
                    setShouldResetToFront(true);
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [phase]);

    // --- Cleanup transition timer on unmount ---------------------------------
    useEffect(() => {
        return () => {
            if (transitionTimer.current) clearTimeout(transitionTimer.current);
        };
    }, []);

    // --- handleGuess -----------------------------------------------------------
    const handleGuess = useCallback(
        (guessedSize: number) => {
            if (phase === "transition" || phase === "summary") return;

            const correctSize = LEVELS[currentLevelIndex];
            const isCorrect = guessedSize === correctSize;

            if (isCorrect) {
                // --- Correct answer ---
                setPhase("transition");
                setShouldResetToFront(false);

                transitionTimer.current = setTimeout(() => {
                    const nextIndex = currentLevelIndex + 1;

                    if (nextIndex >= LEVELS.length) {
                        // All levels done
                        setPhase("summary");
                    } else {
                        // Advance to next level
                        setCurrentLevelIndex(nextIndex);
                        setTimer(0);
                        setPhase("question");
                        setShouldResetToFront(false);
                    }
                }, TRANSITION_DELAY_MS);
            } else {
                // --- Wrong answer ---
                setTotalFlags((f) => f + 1);

                if (phase === "question") {
                    setPhase("hint1");
                    setShouldResetToFront(true);
                } else if (phase === "hint1") {
                    setPhase("hint2");
                    setShouldResetToFront(true);
                }
                // hint2 → stays on hint2 (flags still incremented above)
            }
        },
        [phase, currentLevelIndex]
    );

    // --- Build output ----------------------------------------------------------

    const currentSize = LEVELS[currentLevelIndex];
    const isHintActive = phase === "hint1" || phase === "hint2";

    const cubeProps: CubeProps = {
        size: currentSize,
        highlightRegion: isHintActive ? { type: "row", index: 0 } : null,
        dimInactive: isHintActive,
        showIndices: phase === "hint2",
        showCounting: phase === "hint2",
        resetToFront: shouldResetToFront,
    };

    const uiProps: UiProps = {
        options: OPTIONS,
        currentPhase: phase,
        feedbackText: getFeedbackText(phase),
        handleGuess,
        totalFlags,
        currentLevelIndex,
        timer,
    };

    return { cubeProps, uiProps };
}
