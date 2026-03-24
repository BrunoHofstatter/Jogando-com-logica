import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { HighlightRegion } from "../../Components/RubiksCube";

export type Class2Phase = "question" | "hint1" | "hint2" | "hint3" | "transition" | "summary";

export interface CubeProps {
    size: number;
    highlightRegion: HighlightRegion | HighlightRegion[] | null;
    dimInactive: boolean;
    showIndices: boolean;
    showCounting: boolean;
    resetToFront: boolean;
}

export interface UiProps {
    options: number[];
    currentPhase: Class2Phase;
    feedbackText: string;
    handleGuess: (guessedAnswer: number) => void;
    totalFlags: number;
    currentLevelIndex: number;
    timer: number;
}

export interface UseClass2Return {
    cubeProps: CubeProps;
    uiProps: UiProps;
}

const LEVELS = [2, 3, 4, 5, 6];
const AUTO_HINT_THRESHOLD_S = 45;
const TRANSITION_DELAY_MS = 1500;

function generateOptions(targetArea: number): number[] {
    const options = new Set<number>();
    options.add(targetArea);

    // Distractors based on common mistakes
    if (targetArea === 4) { // 2x2
        [2, 3, 5, 6, 8].forEach((n) => options.add(n));
    } else if (targetArea === 9) { // 3x3
        [6, 7, 8, 10, 12].forEach((n) => options.add(n));
    } else if (targetArea === 16) { // 4x4
        [8, 12, 14, 15, 20].forEach((n) => options.add(n));
    } else if (targetArea === 25) { // 5x5
        [10, 15, 20, 24, 30].forEach((n) => options.add(n));
    } else if (targetArea === 36) { // 6x6
        [12, 24, 30, 35, 42].forEach((n) => options.add(n));
    }

    // Fallback generation if not enough options
    let offset = 1;
    while (options.size < 6) {
        if (targetArea - offset > 0) options.add(targetArea - offset);
        if (options.size < 6) options.add(targetArea + offset);
        offset++;
    }

    return Array.from(options).sort((a, b) => a - b);
}

function getFeedbackText(phase: Class2Phase, size: number): string {
    switch (phase) {
        case "hint1":
            return `Para não contar um por um, vamos olhar as bordas! A linha de cima tem ${size} quadradinhos.`;
        case "hint2":
            return `E quantas linhas o cubo tem no total? Conte para baixo: são ${size} linhas!`;
        case "hint3":
            return `Se temos ${size} quadradinhos por linha, e ${size} linhas... basta multiplicar! Quanto é ${size} vezes ${size}?`;
        case "transition":
            return "Correto! 🎉";
        case "summary":
            return "Parabéns! Você completou a aula!";
        default:
            return "";
    }
}

export function useClass2(): UseClass2Return {
    const location = useLocation();
    const isGameMode = location.state?.mode === "game" || new URLSearchParams(location.search).get("mode") === "game";
    const initialPhase: Class2Phase = isGameMode ? "summary" : "question";

    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [phase, setPhase] = useState<Class2Phase>(initialPhase);
    const [totalFlags, setTotalFlags] = useState(0);
    const [timer, setTimer] = useState(0);

    const [shouldResetToFront, setShouldResetToFront] = useState(false);
    const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Generate options for the current level
    const currentSize = LEVELS[currentLevelIndex];
    const currentArea = currentSize * currentSize;
    const currentOptions = useRef(generateOptions(currentArea));

    // Update options when level changes
    useEffect(() => {
        currentOptions.current = generateOptions(
            LEVELS[currentLevelIndex] * LEVELS[currentLevelIndex]
        );
    }, [currentLevelIndex]);

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
        (guessedAnswer: number) => {
            if (phase === "transition" || phase === "summary") return;

            const isCorrect = guessedAnswer === currentArea;

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
                } else if (phase === "hint2") {
                    setPhase("hint3");
                    setShouldResetToFront(true);
                }
                // hint3 → stays on hint3
            }
        },
        [phase, currentLevelIndex, currentArea]
    );

    // --- Build output ----------------------------------------------------------

    const getHighlightRegion = ():
        | HighlightRegion
        | HighlightRegion[]
        | null => {
        if (phase === "hint1") return { type: "row", index: 0 };
        if (phase === "hint2") return { type: "col", index: 0 };
        if (phase === "hint3")
            return [
                { type: "row", index: 0 },
                { type: "col", index: 0 },
            ];
        return null;
    };

    const isHintActive =
        phase === "hint1" || phase === "hint2" || phase === "hint3";

    const cubeProps: CubeProps = {
        size: currentSize,
        highlightRegion: getHighlightRegion(),
        dimInactive: isHintActive,
        // We show indices for all hints so they can see the sequential count
        showIndices: isHintActive,
        // We animate popIn for all hints
        showCounting: isHintActive,
        resetToFront: shouldResetToFront,
    };

    const uiProps: UiProps = {
        options: currentOptions.current,
        currentPhase: phase,
        feedbackText: getFeedbackText(phase, currentSize),
        handleGuess,
        totalFlags,
        currentLevelIndex,
        timer,
    };

    return { cubeProps, uiProps };
}
