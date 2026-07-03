import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HighlightRegion } from "../../Components/RubiksCube";
import { CUBE_FACE_ROTATIONS, CubeRotation } from "../../Components/RubiksCubeAnimations";

export type Class3Phase = "question" | "hint1" | "hint2" | "hint3" | "transition" | "complete";

export interface LessonOption {
    label: string;
    value: string;
}

type StepKind = "options" | "calculation";

interface LessonHint {
    text: string;
    highlightRegion?: HighlightRegion | HighlightRegion[] | null;
    dimInactive?: boolean;
    showIndices?: boolean;
    showCounting?: boolean;
    focusedFaceIndex?: number | null;
    focusedFaceLabel?: string | null;
    scriptedRotation?: CubeRotation | null;
    countFaces?: boolean;
    resetToFront?: boolean;
}

interface BaseLessonStep {
    kind: StepKind;
    cubeSize: number;
    question: string;
    hints: LessonHint[];
}

interface OptionsLessonStep extends BaseLessonStep {
    kind: "options";
    options: LessonOption[];
    correctAnswer: string;
}

interface CalculationLessonStep extends BaseLessonStep {
    kind: "calculation";
    topNumber: number;
    bottomNumber: number;
    supportingText: string;
}

type LessonStep = OptionsLessonStep | CalculationLessonStep;

export interface CubeProps {
    size: number;
    highlightRegion: HighlightRegion | HighlightRegion[] | null;
    dimInactive: boolean;
    showIndices: boolean;
    showCounting: boolean;
    resetToFront: boolean;
    focusedFaceIndex: number | null;
    focusedFaceLabel: string | null;
    scriptedRotation: CubeRotation | null;
    disableInteraction: boolean;
}

export interface UiProps {
    question: string;
    options: LessonOption[];
    currentPhase: Class3Phase;
    feedbackText: string;
    totalFlags: number;
    currentStepIndex: number;
    isCalculationStep: boolean;
    calculationTopNumber: number | null;
    calculationBottomNumber: number | null;
    calculationSupportingText: string;
    handleGuess: (guessedAnswer: string) => void;
    handleCalculationComplete: () => void;
}

export interface UseClass3Return {
    cubeProps: CubeProps;
    uiProps: UiProps;
}

const numericOptions = (values: number[]): LessonOption[] =>
    values.map((value) => ({ label: String(value), value: String(value) }));

const expressionOptions = (values: string[]): LessonOption[] =>
    values.map((value) => ({ label: value, value }));

const faceCountingHint: LessonHint = {
    text: "Vamos contar as faces do cubo: 1, 2, 3, 4, 5, 6.",
    dimInactive: true,
    countFaces: true,
};

const LESSON_STEPS: LessonStep[] = [
    {
        kind: "options",
        cubeSize: 2,
        question: "Qual multiplicação calcula os quadradinhos de uma face?",
        options: expressionOptions(["2 × 2", "2 × 6", "4 × 6", "3 × 3", "2 × 3", "6 × 6"]),
        correctAnswer: "2 × 2",
        hints: [
            {
                text: "Olhe para uma face: são linhas e quadradinhos por linha.",
                highlightRegion: [
                    { type: "row", index: 0 },
                    { type: "col", index: 0 },
                ],
                dimInactive: true,
            },
            {
                text: "São 2 linhas com 2 quadradinhos em cada linha.",
                highlightRegion: { type: "face", index: 0 },
                showIndices: true,
                showCounting: true,
            },
        ],
    },
    {
        kind: "options",
        cubeSize: 2,
        question: "Quantos quadradinhos há em uma face?",
        options: numericOptions([2, 4, 6, 8, 10, 12]),
        correctAnswer: "4",
        hints: [
            {
                text: "Use a multiplicação da pergunta anterior: 2 × 2.",
                highlightRegion: [
                    { type: "row", index: 0 },
                    { type: "col", index: 0 },
                ],
                dimInactive: true,
            },
            {
                text: "2 × 2 = 4 quadradinhos.",
                highlightRegion: { type: "face", index: 0 },
                showIndices: true,
                showCounting: true,
            },
        ],
    },
    {
        kind: "options",
        cubeSize: 2,
        question: "Quantas faces tem um cubo?",
        options: numericOptions([1, 2, 3, 4, 5, 6]),
        correctAnswer: "6",
        hints: [
            {
                text: "Esta é uma face do cubo.",
                dimInactive: true,
                focusedFaceIndex: 0,
                focusedFaceLabel: "1",
                resetToFront: true,
            },
            faceCountingHint,
        ],
    },
    {
        kind: "options",
        cubeSize: 2,
        question: "Temos 6 faces com 4 quadradinhos em cada uma. Qual cálculo encontra o total?",
        options: expressionOptions(["4 × 6", "4 + 6", "2 × 2", "6 × 6", "4 × 4", "2 × 6"]),
        correctAnswer: "4 × 6",
        hints: [
            {
                text: "São 6 grupos de 4 quadradinhos.",
                focusedFaceIndex: 0,
                focusedFaceLabel: "4",
                dimInactive: true,
            },
        ],
    },
    {
        kind: "options",
        cubeSize: 2,
        question: "Quantos quadradinhos há no cubo inteiro?",
        options: numericOptions([4, 6, 10, 12, 20, 24]),
        correctAnswer: "24",
        hints: [
            {
                text: "São 6 grupos de 4 quadradinhos.",
                focusedFaceIndex: 0,
                focusedFaceLabel: "4",
                dimInactive: true,
            },
            {
                text: "Você pode somar 4 seis vezes: 4 + 4 + 4 + 4 + 4 + 4.",
                highlightRegion: { type: "face", index: 0 },
                showIndices: true,
                showCounting: true,
            },
            {
                text: "Conte de 4 em 4: 4, 8, 12, 16, 20, 24.",
                highlightRegion: { type: "face", index: 0 },
                showIndices: true,
                showCounting: true,
            },
        ],
    },
    {
        kind: "options",
        cubeSize: 3,
        question: "Quantos quadradinhos há em uma face?",
        options: numericOptions([3, 6, 9, 12, 18, 27]),
        correctAnswer: "9",
        hints: [
            {
                text: "Use a multiplicação da aula anterior: linhas × quadradinhos por linha.",
                highlightRegion: [
                    { type: "row", index: 0 },
                    { type: "col", index: 0 },
                ],
                dimInactive: true,
            },
            {
                text: "3 × 3 = 9 quadradinhos.",
                highlightRegion: { type: "face", index: 0 },
                showIndices: true,
                showCounting: true,
            },
        ],
    },
    {
        kind: "options",
        cubeSize: 3,
        question: "Quantas faces tem o cubo?",
        options: numericOptions([3, 4, 5, 6, 8, 9]),
        correctAnswer: "6",
        hints: [
            {
                text: "Esta é uma face do cubo.",
                dimInactive: true,
                focusedFaceIndex: 0,
                focusedFaceLabel: "1",
                resetToFront: true,
            },
            faceCountingHint,
        ],
    },
    {
        kind: "options",
        cubeSize: 3,
        question: "Quantos quadradinhos há no cubo inteiro?",
        options: numericOptions([9, 15, 36, 45, 54, 63]),
        correctAnswer: "54",
        hints: [
            {
                text: "São 6 grupos de 9 quadradinhos.",
                focusedFaceIndex: 0,
                focusedFaceLabel: "9",
                dimInactive: true,
            },
            {
                text: "Você pode somar 9 seis vezes: 9 + 9 + 9 + 9 + 9 + 9.",
                highlightRegion: { type: "face", index: 0 },
                showIndices: true,
                showCounting: true,
            },
            {
                text: "Conte de 9 em 9: 9, 18, 27, 36, 45, 54.",
                highlightRegion: { type: "face", index: 0 },
                showIndices: true,
                showCounting: true,
            },
        ],
    },
    {
        kind: "options",
        cubeSize: 4,
        question: "Qual cálculo encontra todos os quadradinhos do cubo?",
        options: expressionOptions(["16 × 6", "4 × 6", "4 × 4", "16 + 6", "6 × 6", "12 × 6"]),
        correctAnswer: "16 × 6",
        hints: [
            {
                text: "Quantos quadradinhos há em uma face deste cubo?",
                highlightRegion: [
                    { type: "row", index: 0 },
                    { type: "col", index: 0 },
                ],
                dimInactive: true,
            },
            {
                text: "O cubo tem 6 faces, então são 6 grupos de 16 quadradinhos.",
                focusedFaceIndex: 0,
                focusedFaceLabel: "16",
                dimInactive: true,
            },
            {
                text: "Multiplique os quadradinhos de uma face pela quantidade de faces: 16 × 6.",
                highlightRegion: { type: "face", index: 0 },
                showIndices: true,
                showCounting: true,
            },
        ],
    },
    {
        kind: "calculation",
        cubeSize: 4,
        question: "Resolva 16 × 6. Quantos quadradinhos há no cubo inteiro?",
        topNumber: 16,
        bottomNumber: 6,
        supportingText: "Uma face tem 16 quadradinhos. O cubo tem 6 faces. Então fazemos 16 × 6.",
        hints: [],
    },
    {
        kind: "calculation",
        cubeSize: 5,
        question: "Quantos quadradinhos há no cubo inteiro?",
        topNumber: 25,
        bottomNumber: 6,
        supportingText: "Uma face tem 25 quadradinhos. O cubo tem 6 faces. Então fazemos 25 × 6.",
        hints: [],
    },
    {
        kind: "calculation",
        cubeSize: 6,
        question: "Quantos quadradinhos há no cubo inteiro?",
        topNumber: 36,
        bottomNumber: 6,
        supportingText: "Uma face tem 36 quadradinhos. O cubo tem 6 faces. Então fazemos 36 × 6.",
        hints: [],
    },
];

const TRANSITION_DELAY_MS = 1200;
const FACE_COUNT_DELAY_MS = 950;

export function useClass3(): UseClass3Return {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [phase, setPhase] = useState<Class3Phase>("question");
    const [totalFlags, setTotalFlags] = useState(0);
    const [faceCountIndex, setFaceCountIndex] = useState(0);
    const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentStep = LESSON_STEPS[currentStepIndex];
    const hintIndex = phase === "hint1" ? 0 : phase === "hint2" ? 1 : phase === "hint3" ? 2 : -1;
    const activeHint = hintIndex >= 0 ? currentStep.hints[hintIndex] : null;

    useEffect(() => {
        if (!activeHint?.countFaces) {
            setFaceCountIndex(0);
            return;
        }

        const intervalId = setInterval(() => {
            setFaceCountIndex((currentIndex) => (currentIndex + 1) % CUBE_FACE_ROTATIONS.length);
        }, FACE_COUNT_DELAY_MS);

        return () => clearInterval(intervalId);
    }, [activeHint?.countFaces]);

    useEffect(() => {
        return () => {
            if (transitionTimer.current) clearTimeout(transitionTimer.current);
        };
    }, []);

    const goToNextStep = useCallback(() => {
        setPhase("transition");

        transitionTimer.current = setTimeout(() => {
            const nextStepIndex = currentStepIndex + 1;

            if (nextStepIndex >= LESSON_STEPS.length) {
                setPhase("complete");
                return;
            }

            setCurrentStepIndex(nextStepIndex);
            setPhase("question");
        }, TRANSITION_DELAY_MS);
    }, [currentStepIndex]);

    const handleGuess = useCallback(
        (guessedAnswer: string) => {
            if (currentStep.kind !== "options" || phase === "transition" || phase === "complete") return;

            if (guessedAnswer === currentStep.correctAnswer) {
                goToNextStep();
                return;
            }

            setTotalFlags((flags) => flags + 1);

            if (phase === "question") {
                setPhase("hint1");
            } else if (phase === "hint1" && currentStep.hints.length > 1) {
                setPhase("hint2");
            } else if (phase === "hint2" && currentStep.hints.length > 2) {
                setPhase("hint3");
            }
        },
        [currentStep, goToNextStep, phase]
    );

    const handleCalculationComplete = useCallback(() => {
        if (phase === "transition" || phase === "complete") return;
        goToNextStep();
    }, [goToNextStep, phase]);

    const countFaceProps = useMemo(() => {
        if (!activeHint?.countFaces) {
            return null;
        }

        return {
            focusedFaceIndex: faceCountIndex,
            focusedFaceLabel: String(faceCountIndex + 1),
            scriptedRotation: CUBE_FACE_ROTATIONS[faceCountIndex],
        };
    }, [activeHint?.countFaces, faceCountIndex]);

    const cubeProps: CubeProps = {
        size: currentStep.cubeSize,
        highlightRegion: activeHint?.highlightRegion ?? null,
        dimInactive: activeHint?.dimInactive ?? false,
        showIndices: activeHint?.showIndices ?? false,
        showCounting: activeHint?.showCounting ?? false,
        resetToFront: Boolean(activeHint?.resetToFront || activeHint?.highlightRegion),
        focusedFaceIndex: countFaceProps?.focusedFaceIndex ?? activeHint?.focusedFaceIndex ?? null,
        focusedFaceLabel: countFaceProps?.focusedFaceLabel ?? activeHint?.focusedFaceLabel ?? null,
        scriptedRotation: countFaceProps?.scriptedRotation ?? activeHint?.scriptedRotation ?? null,
        disableInteraction: Boolean(activeHint?.countFaces),
    };

    const uiProps: UiProps = {
        question: currentStep.question,
        options: currentStep.kind === "options" ? currentStep.options : [],
        currentPhase: phase,
        feedbackText:
            activeHint?.text ??
            (phase === "transition" ? "Correto!" : phase === "complete" ? "Parabéns! Você completou a aula!" : ""),
        totalFlags,
        currentStepIndex,
        isCalculationStep: currentStep.kind === "calculation",
        calculationTopNumber: currentStep.kind === "calculation" ? currentStep.topNumber : null,
        calculationBottomNumber: currentStep.kind === "calculation" ? currentStep.bottomNumber : null,
        calculationSupportingText: currentStep.kind === "calculation" ? currentStep.supportingText : "",
        handleGuess,
        handleCalculationComplete,
    };

    return { cubeProps, uiProps };
}
