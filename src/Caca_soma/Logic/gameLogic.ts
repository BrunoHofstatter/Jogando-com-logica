export const getAvailableNumbers = (
    board: number[][],
    boardSize: number
): number[] => {
    const available: number[] = [];
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            // Assuming non-zero values are valid numbers. 
            // If the board uses 0 for empty/used, we filter them out.
            // However, Tabuleiro logic uses an internal 'state' board where 0=unselected, 1=selected.
            // We need the ACTUAL values matrix.
            // But wait, the board state in Tabuleiro is just for selection.
            // The actual numbers are fixed in the level config or generated once?
            // In 'LevelGamePage', 'matrix' is passed to Tabuleiro.
            // We need to know which ones are "used" (already part of a correct sum) to filter them out?
            // Actually, if we track 'usedNumbers' as indices or values, we can filter.
            // But for simplicity, let's assume we pass the *remaining* available numbers or the full matrix and a mask of used cells.
        }
    }
    return [];
};

export const getPossibleSums = (
    availableNumbers: number[],
    countToSelect: number
): Set<number> => {
    const sums = new Set<number>();

    const combine = (startIdx: number, currentSum: number, count: number) => {
        if (count === countToSelect) {
            sums.add(currentSum);
            return;
        }

        for (let i = startIdx; i < availableNumbers.length; i++) {
            combine(i + 1, currentSum + availableNumbers[i], count + 1);
        }
    };

    combine(0, 0, 0);
    return sums;
};

export const isValidSum = (
    target: number,
    availableNumbers: number[],
    countToSelect: number
): boolean => {
    // Optimization: If pool is too large, we might want to just check existence
    // But for board 5x5 (25 numbers), nCr is small enough for n=2 (300 combinations).
    const possibleSums = getPossibleSums(availableNumbers, countToSelect);
    return possibleSums.has(target);
};
