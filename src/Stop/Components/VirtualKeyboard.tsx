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
    const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        if (isVisible && targetRect) {
            const viewportWidth = window.innerWidth;
            const isMobilePortrait = window.matchMedia("(orientation: portrait) and (max-width: 650px)").matches;

            const newStyle: React.CSSProperties = {
                visibility: "visible",
            };

            if (isMobilePortrait) {
                // Mobile Portrait: Center vertically, place on opposite column
                newStyle.top = "25dvh";
                if (targetRect.left < viewportWidth / 2) {
                    // Input is on Left -> Keyboard goes Right
                    newStyle.right = "3vw";
                    newStyle.left = "auto";
                } else {
                    // Input is on Right -> Keyboard goes Left
                    newStyle.left = "3vw";
                    newStyle.right = "auto";
                }
            } else {
                // Desktop / Landscape
                const spaceNeededPx = (31 * viewportWidth) / 100;
                newStyle.top = "10dvh";

                if (viewportWidth - targetRect.right > spaceNeededPx) {
                    newStyle.right = "2vw";
                    newStyle.left = "auto";
                } else {
                    newStyle.left = "37vw";
                    newStyle.right = "auto";
                }
            }

            setPositionStyle(newStyle);
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
                style={positionStyle}
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
                    <button
                        className={`${styles.keyButton} ${styles.actionKey}`}
                        onClick={onDelete}
                        aria-label="Apagar"
                    >
                        <Delete className={styles.keyButtonIcon} />
                    </button>

                    <button
                        className={styles.keyButton}
                        onClick={() => onInput("0")}
                    >
                        0
                    </button>

                    <button
                        className={`${styles.keyButton} ${styles.actionKey}`}
                        onClick={onNext}
                        aria-label="Próximo"
                    >
                        <Check className={styles.keyButtonIcon} size={'3vw'} />
                    </button>
                </div>
            </div>
        </>
    );
};

export default VirtualKeyboard;
