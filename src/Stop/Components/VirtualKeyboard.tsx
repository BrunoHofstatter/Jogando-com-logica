import React, { useEffect, useState } from "react";
import { Delete, Check, X } from "lucide-react";
import styles from "../styles/StopGame.module.css";

interface VirtualKeyboardProps {
    isVisible: boolean;
    targetRect: DOMRect | null;
    onInput: (value: string) => void;
    onDelete: () => void;
    onNext: () => void;
    onClose: () => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
    isVisible,
    targetRect,
    onInput,
    onDelete,
    onNext,
    onClose,
}) => {
    const [position, setPosition] = useState<{ top: number; left?: number; right?: number } | null>(null);

    useEffect(() => {
        if (isVisible && targetRect) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const isRightSide = targetRect.left > viewportWidth / 2;

            // Dimensions (approximate based on CSS or could be measured via ref if needed, but constants work for now)
            // Width: 30.8vw, Height approx 35vw with padding/gap
            const keyboardWidthVW = 30.8;
            const keyboardWidthPx = (keyboardWidthVW * viewportWidth) / 100;
            const keyboardHeightPx = viewportHeight * 0.5; // Roughly 50% height max

            let top = targetRect.top - 50;

            // Vertical Clamping
            if (top < 10) top = 10;
            if (top + keyboardHeightPx > viewportHeight) top = viewportHeight - keyboardHeightPx - 10;

            let left: number | undefined;
            let right: number | undefined;

            if (isRightSide) {
                // Try to place on Left
                right = viewportWidth - targetRect.left + 20; // right offset from right edge
                // Ensure it doesn't go off-screen left
                const estimatedLeft = viewportWidth - right - keyboardWidthPx;
                if (estimatedLeft < 10) {
                    // If it would go off screen left, just pin it to left 10px
                    right = undefined;
                    left = 10;
                }
            } else {
                // Try to place on Right
                left = targetRect.right + 20;
                // Ensure it doesn't go off-screen right
                if (left + keyboardWidthPx > viewportWidth - 10) {
                    left = undefined;
                    right = 10; // Pin to right
                }
            }

            setPosition({ top, left, right });
        }
    }, [isVisible, targetRect]);

    if (!isVisible) return null;

    return (
        <>
            {/* Backdrop to catch clicks outside */}
            <div className={styles.virtualKeyboardBackdrop} onClick={onClose} />

            {/* Keyboard Container */}
            <div
                className={styles.virtualKeyboard}
                style={{
                    top: position?.top,
                    left: position?.left,
                    right: position?.right,
                    // If position is null (first render), hide it or default
                    visibility: position ? "visible" : "hidden"
                }}
                onClick={(e) => e.stopPropagation()} // Prevent backdrop click
            >
                <button className={styles.keyButtonClose} onClick={onClose} aria-label="Fechar">
                    <X size={24} />
                </button>

                <div className={styles.keyGrid}>
                    {/* Rows 1-3: Numbers 1-9 */}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            className={styles.keyButton}
                            onClick={() => onInput(num.toString())}
                        >
                            {num}
                        </button>
                    ))}

                    {/* Row 4: Back, 0, Check */}
                    <button className={`${styles.keyButton} ${styles.actionKey}`} onClick={onDelete} aria-label="Apagar">
                        <Delete size={32} />
                    </button>

                    <button
                        className={styles.keyButton}
                        onClick={() => onInput("0")}
                    >
                        0
                    </button>

                    <button className={`${styles.keyButton} ${styles.actionKey}`} onClick={onNext} aria-label="Próximo">
                        <Check size={32} />
                    </button>
                </div>

                {/* Action Row removed, integrated above */}
            </div>
        </>
    );
};

export default VirtualKeyboard;
