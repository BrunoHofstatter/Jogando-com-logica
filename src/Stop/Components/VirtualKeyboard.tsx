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
            const inputRight = targetRect.right;
            const spaceOnRight = viewportWidth - inputRight;

            // 30vw is width, give 1vw buffer -> 31vw needed to fit on right
            const spaceNeededPx = (31 * viewportWidth) / 100;

            const newStyle: React.CSSProperties = {
                top: "10dvh", // Vertically centered (80dvh height)
                visibility: "visible",
            };

            if (spaceOnRight > spaceNeededPx) {
                // Place on Right
                newStyle.right = "2vw";
                newStyle.left = "auto";
            } else {
                // Place on Left (Just to the right of the Stop/Magic Panel which is ~35vw)
                newStyle.left = "37vw";
                newStyle.right = "auto";
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
                        <Delete size={'3vw'} />
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
                        <Check size={'3vw'} />
                    </button>
                </div>
            </div>
        </>
    );
};

export default VirtualKeyboard;
