import { useState, useEffect } from "react";

const STORAGE_PREFIX = "game_progress_";
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 4;

const normalizeDifficulty = (value: string | number | null): number => {
    const parsed = typeof value === "number" ? value : Number.parseInt(value ?? "", 10);

    if (!Number.isFinite(parsed)) {
        return MIN_DIFFICULTY;
    }

    return Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, parsed));
};

export const useDifficultyLock = (gameId: string) => {
    const [maxUnlockedDifficulty, setMaxUnlockedDifficulty] = useState<number>(() => {
        const saved = localStorage.getItem(`${STORAGE_PREFIX}${gameId}`);
        return normalizeDifficulty(saved);
    });

    // Save to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem(
            `${STORAGE_PREFIX}${gameId}`,
            maxUnlockedDifficulty.toString()
        );
    }, [maxUnlockedDifficulty, gameId]);

    const isUnlocked = (difficulty: number) => {
        return difficulty <= maxUnlockedDifficulty;
    };

    const unlockNext = (currentDifficulty: number) => {
        if (currentDifficulty === maxUnlockedDifficulty) {
            // Only unlock if we beat the hardest current difficulty
            // And cap at 4 (Difícil)
            if (maxUnlockedDifficulty < MAX_DIFFICULTY) {
                setMaxUnlockedDifficulty((prev) => normalizeDifficulty(prev + 1));
            }
        }
    };

    const unlockAll = () => {
        setMaxUnlockedDifficulty(MAX_DIFFICULTY);
    };

    const resetProgress = () => {
        setMaxUnlockedDifficulty(MIN_DIFFICULTY);
        localStorage.removeItem(`${STORAGE_PREFIX}${gameId}`);
    };

    return {
        maxUnlockedDifficulty,
        isUnlocked,
        unlockNext,
        unlockAll,
        resetProgress,
    };
};
