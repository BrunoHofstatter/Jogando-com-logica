export const getAvailableNumbers = (
    boardSize: number,
    usedIndices: Iterable<string> = []
): number[] => {
    const used = new Set(usedIndices);
    const available: number[] = [];

    for (let r = 0; r < boardSize; r += 1) {
        for (let c = 0; c < boardSize; c += 1) {
            const key = `${r}-${c}`;
            if (!used.has(key)) {
                available.push(r * boardSize + c + 1);
            }
        }
    }

    return available;
};

export const getPossibleSums = (
    availableNumbers: number[],
    countToSelect: number
): Set<number> => {
    const sums = new Set<number>();

    if (countToSelect <= 0 || availableNumbers.length < countToSelect) {
        return sums;
    }

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

export const getFilteredPossibleSums = (
    availableNumbers: number[],
    countToSelect: number,
    range?: [number, number] | null
): number[] => {
    const possibleSums = Array.from(getPossibleSums(availableNumbers, countToSelect));

    if (!range) {
        return possibleSums.sort((left, right) => left - right);
    }

    const [min, max] = range;
    const inRange = possibleSums.filter((value) => value >= min && value <= max);

    return (inRange.length > 0 ? inRange : possibleSums).sort((left, right) => left - right);
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
