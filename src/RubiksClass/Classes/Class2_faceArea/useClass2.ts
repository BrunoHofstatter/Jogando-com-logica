import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { HighlightRegion } from "../../Components/RubiksCube";

export type Class2Phase = "question" | "hint1" | "hint2" | "transition" | "summary";

export interface LessonOption {
    label: string;
    value: string;
}

interface LessonHint {
    text: string;
    highlightRegion: HighlightRegion | HighlightRegion[] | null;
    dimInactive?: boolean;
    showIndices?: boolean;
    showCounting?: boolean;
}

interface LessonStep {
    cubeSize: number;
    question: string;
    options: LessonOption[];
    correctAnswer: string;
    hints: LessonHint[];
}

export interface CubeProps {
    size: number;
    highlightRegion: HighlightRegion | HighlightRegion[] | null;
    dimInactive: boolean;
    showIndices: boolean;
    showCounting: boolean;
    resetToFront: boolean;
}

export interface UiProps {
    options: LessonOption[];
    question: string;
    currentPhase: Class2Phase;
    feedbackText: string;
    handleGuess: (guessedAnswer: string) => void;
    totalFlags: number;
    currentStepIndex: number;
    totalSteps: number;
    timer: number;
}

export interface UseClass2Return {
    cubeProps: CubeProps;
    uiProps: UiProps;
}

const numericOptions = (values: number[]): LessonOption[] =>
    values.map((value) => ({ label: String(value), value: String(value) }));

const expressionOptions = (values: string[]): LessonOption[] =>
    values.map((value) => ({ label: value, value }));

const LESSON_STEPS: LessonStep[] = [
    {
        cubeSize: 3,
        question: "Quantas linhas há em uma face do cubo?",
        options: numericOptions([1, 6, 3, 10, 2, 9]),
        correctAnswer: "3",
        hints: [
            {
                text: "Uma linha atravessa a face de um lado até o outro.",
                highlightRegion: { type: "row", index: 0 },
                dimInactive: true,
            },
            {
                text: "Conte as linhas de cima para baixo: 1, 2, 3.",
                highlightRegion: { type: "col", index: 0 },
                dimInactive: true,
                showIndices: true,
                showCounting: true,
            },
        ],
    },
    {
        cubeSize: 3,
        question: "Quantos quadradinhos há em cada linha?",
        options: numericOptions([9, 2, 10, 3, 6, 1]),
        correctAnswer: "3",
        hints: [
            {
                text: "Observe apenas uma linha da face.",
                highlightRegion: { type: "row", index: 0 },
                dimInactive: true,
            },
            {
                text: "Conte os quadradinhos desta linha: 1, 2, 3.",
                highlightRegion: { type: "row", index: 0 },
                dimInactive: true,
                showIndices: true,
                showCounting: true,
            },
        ],
    },
    {
        cubeSize: 3,
        question: "Quanto é 3 × 3?",
        options: numericOptions([8, 3, 10, 0, 9, 6]),
        correctAnswer: "9",
        hints: [
            {
                text: "3 × 3 é igual a 3 + 3 + 3.",
                highlightRegion: { type: "face", index: 0 },
            },
        ],
    },
    {
        cubeSize: 3,
        question: "Então, quantos quadradinhos há em uma face?",
        options: numericOptions([6, 10, 9, 3, 0, 8]),
        correctAnswer: "9",
        hints: [
            {
                text: "Lembre-se: são 3 linhas com 3 quadradinhos em cada linha.",
                highlightRegion: [
                    { type: "row", index: 0 },
                    { type: "col", index: 0 },
                ],
                dimInactive: true,
            },
            {
                text: "Juntando todos: 3 × 3 = 9 quadradinhos.",
                highlightRegion: { type: "face", index: 0 },
                showIndices: true,
                showCounting: true,
            },
        ],
    },
    {
        cubeSize: 2,
        question: "Quantas linhas e quantos quadradinhos por linha há nesta face?",
        options: numericOptions([4, 1, 6, 2, 5, 3]),
        correctAnswer: "2",
        hints: [
            {
                text: "Nesta face, a quantidade de linhas é igual à quantidade de quadradinhos por linha.",
                highlightRegion: [
                    { type: "row", index: 0 },
                    { type: "col", index: 0 },
                ],
                dimInactive: true,
            },
            {
                text: "Conte: são 2 linhas e 2 quadradinhos em cada linha.",
                highlightRegion: { type: "row", index: 0 },
                dimInactive: true,
                showIndices: true,
                showCounting: true,
            },
        ],
    },
    {
        cubeSize: 2,
        question: "Quanto é 2 × 2?",
        options: numericOptions([3, 8, 2, 5, 4, 6]),
        correctAnswer: "4",
        hints: [
            {
                text: "2 × 2 é igual a 2 + 2.",
                highlightRegion: { type: "face", index: 0 },
            },
        ],
    },
    {
        cubeSize: 2,
        question: "Quantos quadradinhos há em uma face?",
        options: numericOptions([6, 4, 8, 3, 5, 2]),
        correctAnswer: "4",
        hints: [
            {
                text: "São 2 linhas com 2 quadradinhos em cada linha.",
                highlightRegion: [
                    { type: "row", index: 0 },
                    { type: "col", index: 0 },
                ],
                dimInactive: true,
            },
            {
                text: "Calcule 2 × 2 para descobrir o total.",
                highlightRegion: { type: "face", index: 0 },
                showIndices: true,
                showCounting: true,
            },
        ],
    },
    {
        cubeSize: 4,
        question: "Qual multiplicação calcula os quadradinhos desta face?",
        options: expressionOptions(["4 + 4", "3 × 3", "4 × 6", "4 × 4", "2 × 2", "5 × 5"]),
        correctAnswer: "4 × 4",
        hints: [
            {
                text: "Observe quantas linhas há e quantos quadradinhos há em cada linha.",
                highlightRegion: [
                    { type: "row", index: 0 },
                    { type: "col", index: 0 },
                ],
                dimInactive: true,
            },
            {
                text: "São 4 linhas com 4 quadradinhos em cada linha.",
                highlightRegion: [
                    { type: "row", index: 0 },
                    { type: "col", index: 0 },
                ],
                dimInactive: true,
                showIndices: true,
                showCounting: true,
            },
        ],
    },
    {
        cubeSize: 4,
        question: "Quantos quadradinhos há em uma face?",
        options: numericOptions([12, 24, 8, 16, 4, 20]),
        correctAnswer: "16",
        hints: [
            {
                text: "Use a multiplicação que você escolheu: 4 × 4.",
                highlightRegion: [
                    { type: "row", index: 0 },
                    { type: "col", index: 0 },
                ],
                dimInactive: true,
            },
            {
                text: "4 × 4 = 16 quadradinhos.",
                highlightRegion: { type: "face", index: 0 },
                showIndices: true,
                showCounting: true,
            },
        ],
    },
    {
        cubeSize: 5,
        question: "Quantos quadradinhos há em uma face?",
        options: numericOptions([15, 5, 30, 20, 25, 10]),
        correctAnswer: "25",
        hints: [
            {
                text: "São 5 linhas com 5 quadradinhos em cada linha.",
                highlightRegion: [
                    { type: "row", index: 0 },
                    { type: "col", index: 0 },
                ],
                dimInactive: true,
            },
            {
                text: "Calcule 5 × 5 para descobrir o total.",
                highlightRegion: { type: "face", index: 0 },
                showIndices: true,
                showCounting: true,
            },
        ],
    },
    {
        cubeSize: 6,
        question: "Quantos quadradinhos há em uma face?",
        options: numericOptions([24, 36, 12, 30, 6, 18]),
        correctAnswer: "36",
        hints: [
            {
                text: "São 6 linhas com 6 quadradinhos em cada linha.",
                highlightRegion: [
                    { type: "row", index: 0 },
                    { type: "col", index: 0 },
                ],
                dimInactive: true,
            },
            {
                text: "Calcule 6 × 6 para descobrir o total.",
                highlightRegion: { type: "face", index: 0 },
                showIndices: true,
                showCounting: true,
            },
        ],
    },
];

const AUTO_HINT_THRESHOLD_S = 45;
const TRANSITION_DELAY_MS = 1200;

export function useClass2(): UseClass2Return {
    const location = useLocation();
    const isGameMode =
        location.state?.mode === "game" ||
        new URLSearchParams(location.search).get("mode") === "game";
    const initialPhase: Class2Phase = isGameMode ? "summary" : "question";

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [phase, setPhase] = useState<Class2Phase>(initialPhase);
    const [totalFlags, setTotalFlags] = useState(0);
    const [timer, setTimer] = useState(0);
    const [shouldResetToFront, setShouldResetToFront] = useState(false);
    const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentStep = LESSON_STEPS[currentStepIndex];

    useEffect(() => {
        if (phase !== "question") return;

        const intervalId = setInterval(() => {
            setTimer((previousTimer) => {
                const nextTimer = previousTimer + 1;
                if (nextTimer >= AUTO_HINT_THRESHOLD_S) {
                    setPhase("hint1");
                    setTotalFlags((flags) => flags + 1);
                    setShouldResetToFront(true);
                }
                return nextTimer;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [phase]);

    useEffect(() => {
        return () => {
            if (transitionTimer.current) clearTimeout(transitionTimer.current);
        };
    }, []);

    const handleGuess = useCallback(
        (guessedAnswer: string) => {
            if (phase === "transition" || phase === "summary") return;

            if (guessedAnswer === currentStep.correctAnswer) {
                setPhase("transition");
                setShouldResetToFront(false);

                transitionTimer.current = setTimeout(() => {
                    const nextStepIndex = currentStepIndex + 1;

                    if (nextStepIndex >= LESSON_STEPS.length) {
                        setPhase("summary");
                    } else {
                        setCurrentStepIndex(nextStepIndex);
                        setTimer(0);
                        setPhase("question");
                    }
                }, TRANSITION_DELAY_MS);
                return;
            }

            setTotalFlags((flags) => flags + 1);
            setShouldResetToFront(true);

            if (phase === "question") {
                setPhase("hint1");
            } else if (phase === "hint1" && currentStep.hints.length > 1) {
                setPhase("hint2");
            }
        },
        [currentStep, currentStepIndex, phase]
    );

    const hintIndex = phase === "hint1" ? 0 : phase === "hint2" ? 1 : -1;
    const activeHint = hintIndex >= 0 ? currentStep.hints[hintIndex] : null;

    const cubeProps: CubeProps = {
        size: currentStep.cubeSize,
        highlightRegion: activeHint?.highlightRegion ?? null,
        dimInactive: activeHint?.dimInactive ?? false,
        showIndices: activeHint?.showIndices ?? false,
        showCounting: activeHint?.showCounting ?? false,
        resetToFront: shouldResetToFront,
    };

    const uiProps: UiProps = {
        options: currentStep.options,
        question: currentStep.question,
        currentPhase: phase,
        feedbackText:
            activeHint?.text ??
            (phase === "transition" ? "Correto!" : phase === "summary" ? "Parabéns! Você completou a aula!" : ""),
        handleGuess,
        totalFlags,
        currentStepIndex,
        totalSteps: LESSON_STEPS.length,
        timer,
    };

    return { cubeProps, uiProps };
}
