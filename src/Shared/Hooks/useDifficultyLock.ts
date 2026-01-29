import { useState, useEffect } from "react";

const STORAGE_PREFIX = "game_progress_";

export const useDifficultyLock = (gameId: string) => {
    const [maxUnlockedDifficulty, setMaxUnlockedDifficulty] = useState<number>(() => {
        const saved = localStorage.getItem(`${STORAGE_PREFIX}${gameId}`);
        return saved ? parseInt(saved, 10) : 1;
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
            if (maxUnlockedDifficulty < 4) {
                setMaxUnlockedDifficulty((prev) => prev + 1);
            }
        }
    };

    const unlockAll = () => {
        setMaxUnlockedDifficulty(4);
    };

    const resetProgress = () => {
        setMaxUnlockedDifficulty(1);
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
