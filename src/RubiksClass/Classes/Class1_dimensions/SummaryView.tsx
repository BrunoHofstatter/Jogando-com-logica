import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import RubiksCube from "../../Components/RubiksCube";
import styles from "./SummaryView.module.css";

interface SummaryViewProps {
    totalFlags: number;
}

const ITEMS = [2, 3, 4, 5, 6];

const SummaryView: React.FC<SummaryViewProps> = ({ totalFlags }) => {
    const navigate = useNavigate();

    // --- State ---
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [matchedIds, setMatchedIds] = useState<number[]>([]);
    const [mistakes, setMistakes] = useState<number>(0);
    const [shakingLabel, setShakingLabel] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    // Scramble the cubes once on mount
    const scrambledCubes = useMemo(() => {
        return [...ITEMS].sort(() => Math.random() - 0.5);
    }, []);

    // --- Handlers ---
    const handleCubeClick = (id: number) => {
        if (matchedIds.includes(id)) return;
        setSelectedId(id === selectedId ? null : id); // Toggle selection
        setFeedback(null);
    };

    const handleLabelClick = useCallback((labelId: number) => {
        if (matchedIds.includes(labelId)) return;

        if (selectedId === null) {
            setFeedback("Selecione um cubo primeiro!");
            return;
        }

        if (selectedId === labelId) {
            // Success
            setMatchedIds((prev) => [...prev, labelId]);
            setSelectedId(null);
            setFeedback(null);
        } else {
            // Fail
            setMistakes((prev) => prev + 1);
            setShakingLabel(labelId);
            setSelectedId(null);
            setFeedback("Tamanho incorreto! Tente de novo.");

            setTimeout(() => {
                setShakingLabel(null);
            }, 500); // match CSS animation duration
        }
    }, [selectedId, matchedIds]);

    const isComplete = matchedIds.length === ITEMS.length;

    // --- Render ---
    return (
        <div className={styles.container}>
            {/* --- Back to Menu Button --- */}
            <button className={styles.aulasButton} onClick={() => navigate("/classMenu")}>
                Aulas
            </button>

            {/* Feedback Overlay for errors/hints */}
            {feedback && !isComplete && (
                <div className={styles.feedbackOverlay}>
                    <div className={styles.feedbackBubble}>⚠️ {feedback}</div>
                </div>
            )}

            {/* Left Panel: The Pile */}
            <div className={styles.leftPanel}>
                {scrambledCubes.map((id) => {
                    const isSelected = selectedId === id;
                    const isMatched = matchedIds.includes(id);

                    const wrapperClasses = [
                        styles.cubeWrapper,
                        isSelected ? styles.selected : "",
                        isMatched ? styles.matched : "",
                    ]
                        .filter(Boolean)
                        .join(" ");

                    return (
                        <div
                            key={id}
                            className={wrapperClasses}
                            onClick={() => handleCubeClick(id)}
                        >
                            <div style={{ pointerEvents: "none" }}>
                                {/* 
                  Render a slightly smaller cube.
                  We keep it auto-rotating so the pile feels alive.
                */}
                                <RubiksCube
                                    size={id}
                                    cubeSize={10} // small size in vw
                                    resetToFront={false}
                                    highlightRegion={null}
                                    dimInactive={false}
                                    showIndices={false}
                                    showCounting={false}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Right Panel: Labels */}
            <div className={styles.rightPanel}>
                <h2 className={styles.title}>Combine os Tamanhos!</h2>

                <div className={styles.labelsList}>
                    {ITEMS.map((id) => {
                        const isMatched = matchedIds.includes(id);
                        const isShaking = shakingLabel === id;

                        const btnClasses = [
                            styles.labelButton,
                            isMatched ? styles.matched : "",
                            isShaking ? styles.shake : "",
                        ]
                            .filter(Boolean)
                            .join(" ");

                        return (
                            <button
                                key={id}
                                className={btnClasses}
                                disabled={isMatched}
                                onClick={() => handleLabelClick(id)}
                            >
                                {isMatched ? "✅ " : ""}{id}×{id}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Completion Modal */}
            {isComplete && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h1 className={styles.modalTitle}>Excelente! 🎉</h1>
                        <p className={styles.modalStats}>
                            Erros nas lições: {totalFlags}
                            <br />
                            Erros no final: {mistakes}
                            <br />
                            <span>Total de Erros: {totalFlags + mistakes}</span>
                        </p>
                        <button
                            className={styles.modalButton}
                            onClick={() => navigate("/classMenu")}
                        >
                            Voltar ao Menu
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SummaryView;
