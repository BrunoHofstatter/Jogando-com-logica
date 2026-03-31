import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import RubiksCube from "../../Components/RubiksCube";
import styles from "./Class2SummaryView.module.css";
import { ROUTES } from "../../../routes";


interface Class2SummaryViewProps {
    totalFlags: number;
}

interface FallingBox {
    id: string;
    value: number;
    top: number; // percentage (vh)
    left: number; // percentage (vw)
    speed: number;
    isPaused: boolean;
}

const CUBES_LEFT = [2, 3, 4];
const CUBES_RIGHT = [5, 6];

const TARGETS = [4, 9, 16, 25, 36];
const DISTRACTORS = [6, 8, 10, 12, 14, 15, 20, 24, 30, 35, 42];

const MAX_BOXES = 6;

const Class2SummaryView: React.FC<Class2SummaryViewProps> = ({ totalFlags }) => {
    const navigate = useNavigate();

    // --- State ---
    const [boxes, setBoxes] = useState<FallingBox[]>([]);
    const [matchedSizes, setMatchedSizes] = useState<number[]>([]);
    const [mistakes, setMistakes] = useState(0);

    // Animations & Selection
    const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
    const [shakingCube, setShakingCube] = useState<number | null>(null);
    const [shakingBox, setShakingBox] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const requestRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);

    // --- Physics Loop ---
    const updatePhysics = useCallback((time: number) => {
        if (lastTimeRef.current != null) {
            const deltaTime = time - lastTimeRef.current;
            // Time scale: ~60fps means deltaTime is ~16ms
            const timeScale = deltaTime / 16;
            const isMobile = window.matchMedia("(max-width: 600px) and (orientation: portrait)").matches;

            setBoxes((prevBoxes) => {
                let changed = false;
                const nextBoxes = prevBoxes.map((box) => {
                    if (box.isPaused) return box;
                    changed = true;
                    if (isMobile) {
                        return { ...box, left: box.left + box.speed * timeScale };
                    }
                    return { ...box, top: box.top + box.speed * timeScale };
                });

                // Remove boxes that exited the screen
                const filtered = isMobile
                    ? nextBoxes.filter((b) => b.left < 115)
                    : nextBoxes.filter((b) => b.top < 110);
                if (filtered.length !== nextBoxes.length) changed = true;

                return changed ? filtered : prevBoxes;
            });
        }
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(updatePhysics);
    }, []);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => cancelAnimationFrame(requestRef.current!);
    }, [updatePhysics]);

    // --- Spawn Loop ---
    useEffect(() => {
        const spawnInterval = setInterval(() => {
            setBoxes((prev) => {
                if (prev.length >= MAX_BOXES) return prev;

                // Determine available targets
                const remainingTargets = TARGETS.filter(
                    (t) => !matchedSizes.includes(Math.sqrt(t))
                );

                // Check if there is already a target on screen
                const hasTargetOnScreen = prev.some((b) =>
                    remainingTargets.includes(b.value)
                );

                let nextValue: number;
                // If no target is on screen, force spawn a target.
                // Otherwise, 40% chance for another target, 60% for distractor.
                if (
                    remainingTargets.length > 0 &&
                    (!hasTargetOnScreen || Math.random() < 0.4)
                ) {
                    nextValue =
                        remainingTargets[
                        Math.floor(Math.random() * remainingTargets.length)
                        ];
                } else {
                    nextValue =
                        DISTRACTORS[Math.floor(Math.random() * DISTRACTORS.length)];
                }

                const isMobile = window.matchMedia("(max-width: 600px) and (orientation: portrait)").matches;
                const newBox: FallingBox = {
                    id: Math.random().toString(36).substr(2, 9),
                    value: nextValue,
                    top: isMobile ? 15 + Math.random() * 37 : -15,
                    left: isMobile ? -15 : 30 + Math.random() * 40,
                    speed: 0.15 + Math.random() * 0.1,
                    isPaused: false,
                };

                return [...prev, newBox];
            });
        }, 1500);

        return () => clearInterval(spawnInterval);
    }, [matchedSizes]);

    // --- Interactions ---
    const handleBoxClick = (id: string) => {
        if (matchedSizes.length === TARGETS.length) return;

        setBoxes((prev) =>
            prev.map((b) => ({
                ...b,
                // Pause the clicked one, unpause all others
                isPaused: b.id === id ? !b.isPaused : false,
            }))
        );
        setSelectedBoxId((prev) => (prev === id ? null : id));
        setFeedback(null);
    };

    const handleCubeClick = (size: number) => {
        if (matchedSizes.includes(size)) return;

        if (!selectedBoxId) {
            setFeedback("Selecione um número caindo primeiro!");
            return;
        }

        const box = boxes.find((b) => b.id === selectedBoxId);
        if (!box) return;

        const targetArea = size * size;

        if (box.value === targetArea) {
            // MATCH
            setMatchedSizes((prev) => [...prev, size]);
            setBoxes((prev) => prev.filter((b) => b.id !== selectedBoxId));
            setSelectedBoxId(null);
            setFeedback(null);
        } else {
            // WRONG
            setMistakes((m) => m + 1);
            setShakingCube(size);
            setShakingBox(selectedBoxId);
            setFeedback("Área incorreta! Tente de novo.");

            // Resume falling after shake
            setTimeout(() => {
                setShakingCube(null);
                setShakingBox(null);
                setBoxes((prev) =>
                    prev.map((b) =>
                        b.id === selectedBoxId ? { ...b, isPaused: false } : b
                    )
                );
                setSelectedBoxId(null);
            }, 500);
        }
    };

    const isComplete = matchedSizes.length === TARGETS.length;

    // --- Render helpers ---
    const renderCube = (size: number, isLeft: boolean) => {
        const isMatched = matchedSizes.includes(size);
        const isShaking = shakingCube === size;
        const isPulsing = selectedBoxId !== null && !isMatched;

        const wrapperClasses = [
            styles.cubeWrapper,
            isMatched ? styles.matched : "",
            isShaking ? styles.shake : "",
            isPulsing && !isShaking ? styles.pulse : "",
        ]
            .filter(Boolean)
            .join(" ");

        return (
            <div
                key={size}
                className={wrapperClasses}
                onClick={() => handleCubeClick(size)}
            >
                <div style={{ pointerEvents: "none" }}>
                    <RubiksCube
                        size={size}
                        cubeSize={window.matchMedia("(max-width: 600px) and (orientation: portrait)").matches ? 15 : 10}
                        resetToFront={true}
                        highlightRegion={null}
                        dimInactive={false}
                        showIndices={false}
                        showCounting={false}
                    />
                </div>
                {/* Docked number indicator when solved */}
                {isMatched && (
                    <div className={`${styles.dockedNumber} ${isLeft ? styles.dockedRight : styles.dockedLeft}`}>
                        {size * size}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.container}>
            {/* --- Back to Menu Button --- */}
            <button className={styles.aulasButton} onClick={() => navigate(ROUTES.CLASS_MENU)}>
                Aulas
            </button>

            {/* Title */}
            <div className={styles.titleOverlay}>
                <h2 className={styles.titleText}>Clique em um número e depois em um cubo!</h2>
            </div>

            {/* Feedback Notifications */}
            {feedback && !isComplete && (
                <div className={styles.feedbackOverlay}>
                    <div className={styles.feedbackBubble}>⚠️ {feedback}</div>
                </div>
            )}

            {/* Left Cubes (2, 3, 4) */}
            <div className={`${styles.sidePanel} ${styles.leftPanel}`}>
                {React.useMemo(() => CUBES_LEFT.map((size) => renderCube(size, true)), [matchedSizes, shakingCube, selectedBoxId])}
            </div>

            {/* Right Cubes (5, 6) */}
            <div className={`${styles.sidePanel} ${styles.rightPanel}`}>
                {React.useMemo(() => CUBES_RIGHT.map((size) => renderCube(size, false)), [matchedSizes, shakingCube, selectedBoxId])}
            </div>

            {/* Falling Area */}
            <div className={styles.fallingArea}>
                {boxes.map((box) => {
                    const isSelected = selectedBoxId === box.id;
                    const isShaking = shakingBox === box.id;

                    const boxClasses = [
                        styles.fallingBox,
                        box.isPaused || isSelected ? styles.paused : "",
                        isShaking ? styles.shake : "",
                    ]
                        .filter(Boolean)
                        .join(" ");

                    return (
                        <div
                            key={box.id}
                            className={boxClasses}
                            style={{
                                top: `${box.top}vh`,
                                left: `${box.left}%`,
                            }}
                            onPointerDown={() => handleBoxClick(box.id)}
                        >
                            {box.value}
                        </div>
                    );
                })}
            </div>

            {/* Completion Modal */}
            {isComplete && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h1 className={styles.modalTitle}>Excelente! 🎉</h1>
                        <p className={styles.modalStats}>
                            Erros nas lições: {totalFlags}
                            <br />
                            Cliques errados nas caixas: {mistakes}
                            <br />
                            <span>Total de Erros: {totalFlags + mistakes}</span>
                        </p>
                        <button
                            className={styles.modalButton}
                            onClick={() => navigate(ROUTES.CLASS_MENU)}
                        >
                            Voltar ao Menu
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Class2SummaryView;
