import { LevelProgress, LevelAttemptResult } from './gameTypes';
import { levels } from './levelConfigs';

const STORAGE_KEY = 'cacasoma_level_progress';

const createDefaultProgress = (levelId: number): LevelProgress => ({
  levelId,
  completed: false,
  bestStars: 0,
  bestTime: Infinity,
  bestCorrect: 0,
  attempts: 0,
  lastPlayed: ''
});

const isValidNumber = (value: unknown): value is number => (
  typeof value === 'number' && Number.isFinite(value)
);

// Get all level progress from localStorage, ensuring synchronization with current config
export const getAllProgress = (): LevelProgress[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  let progress: LevelProgress[] = [];

  if (stored) {
    try {
      progress = JSON.parse(stored);
    } catch {
      progress = [];
    }
  }

  // Synchronization: add missing levels and repair older saved progress shapes.
  let changed = false;
  progress = levels.map(level => {
    const savedProgress = progress.find(p => p.levelId === level.levelId);

    if (!savedProgress) {
      changed = true;
      return createDefaultProgress(level.levelId);
    }

    const normalizedProgress: LevelProgress = {
      levelId: level.levelId,
      completed: Boolean(savedProgress.completed),
      bestStars: isValidNumber(savedProgress.bestStars) ? savedProgress.bestStars : 0,
      bestTime: isValidNumber(savedProgress.bestTime) ? savedProgress.bestTime : Infinity,
      bestCorrect: isValidNumber(savedProgress.bestCorrect) ? savedProgress.bestCorrect : 0,
      attempts: isValidNumber(savedProgress.attempts) ? savedProgress.attempts : 0,
      lastPlayed: typeof savedProgress.lastPlayed === 'string' ? savedProgress.lastPlayed : ''
    };
    const savedBestTimeMatches = normalizedProgress.bestTime === savedProgress.bestTime ||
      (!isValidNumber(savedProgress.bestTime) && normalizedProgress.bestTime === Infinity);

    if (
      normalizedProgress.completed !== savedProgress.completed ||
      normalizedProgress.bestStars !== savedProgress.bestStars ||
      !savedBestTimeMatches ||
      normalizedProgress.bestCorrect !== savedProgress.bestCorrect ||
      normalizedProgress.attempts !== savedProgress.attempts ||
      normalizedProgress.lastPlayed !== savedProgress.lastPlayed
    ) {
      changed = true;
    }

    return normalizedProgress;
  });

  // If we initialized empty or added new levels, save back to storage
  if (changed || !stored) {
    saveAllProgress(progress);
  }

  return progress;
};

// Save all progress to localStorage
const saveAllProgress = (progress: LevelProgress[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

// Get progress for specific level
export const getLevelProgress = (levelId: number): LevelProgress | undefined => {
  const allProgress = getAllProgress();
  return allProgress.find(p => p.levelId === levelId);
};

// Update progress after level attempt
export const updateLevelProgress = (result: LevelAttemptResult): void => {
  const allProgress = getAllProgress();
  const levelIndex = allProgress.findIndex(p => p.levelId === result.levelId);

  if (levelIndex === -1) return;

  const current = allProgress[levelIndex];

  // Update statistics
  allProgress[levelIndex] = {
    ...current,
    attempts: current.attempts + 1,
    lastPlayed: new Date().toISOString(),
    completed: result.passed || current.completed,
    bestStars: Math.max(current.bestStars, result.starsEarned),
    bestTime: Math.min(current.bestTime, result.totalTime),
    bestCorrect: Math.max(current.bestCorrect, result.totalCorrect)
  };

  saveAllProgress(allProgress);
};

export const unlockAllLevelProgress = (): void => {
  const allProgress = getAllProgress();
  const now = new Date().toISOString();

  const unlockedProgress = levels.map(level => {
    const current = allProgress.find(progress => progress.levelId === level.levelId);

    return {
      ...(current ?? createDefaultProgress(level.levelId)),
      levelId: level.levelId,
      completed: true,
      bestStars: 3,
      bestTime: 0,
      bestCorrect: level.rounds,
      lastPlayed: now
    };
  });

  saveAllProgress(unlockedProgress);
};

// Check if level is unlocked
export const isLevelUnlocked = (levelId: number): boolean => {
  if (levelId === 1) return true; // First level always unlocked

  const level = levels.find(l => l.levelId === levelId);
  if (!level) return false;

  const allProgress = getAllProgress();
  const previousLevel = allProgress.find(p => p.levelId === levelId - 1);

  if (!previousLevel) return false;

  // Check if previous level has required stars (2 stars needed to unlock next)
  const currentLevel = levels.find(l => l.levelId === levelId);
  return previousLevel.bestStars >= (currentLevel?.requiredStars || 2);
};

export const getCurrentLevelId = (): number => {
  return levels.reduce((highestUnlocked, level) => {
    return isLevelUnlocked(level.levelId)
      ? Math.max(highestUnlocked, level.levelId)
      : highestUnlocked;
  }, levels[0]?.levelId ?? 1);
};

// Reset all progress (for testing/debugging)
export const resetAllProgress = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// Calculate stars earned from attempt
// BOTH correct answers AND time must meet thresholds
export const calculateStars = (
  correctAnswers: number,
  totalTime: number,
  levelId: number
): number => {
  const level = levels.find(l => l.levelId === levelId);
  if (!level) return 0;

  const { starThresholds } = level;

  // Must meet BOTH correct answers AND time requirements for each star tier
  if (
    correctAnswers >= starThresholds.threeStarCorrect &&
    totalTime <= starThresholds.threeStarTime
  ) {
    return 3;
  }

  if (
    correctAnswers >= starThresholds.twoStarCorrect &&
    totalTime <= starThresholds.twoStarTime
  ) {
    return 2;
  }

  if (
    correctAnswers >= starThresholds.oneStarCorrect &&
    totalTime <= starThresholds.oneStarTime
  ) {
    return 1;
  }

  return 0;
};
