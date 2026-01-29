import { LevelProgress, LevelAttemptResult } from './gameTypes';
import { levels } from './levelConfigs';

const STORAGE_KEY = 'cacasoma_level_progress';

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

  // Synchronization: Add missing levels from config to progress
  // This handles cases where new levels are added to the code but not yet in localStorage
  let changed = false;
  levels.forEach(level => {
    if (!progress.find(p => p.levelId === level.levelId)) {
      progress.push({
        levelId: level.levelId,
        completed: false,
        bestStars: 0,
        bestTime: Infinity,
        bestCorrect: 0,
        attempts: 0,
        lastPlayed: ''
      });
      changed = true;
    }
  });

  // If we initialized empty or added new levels, save back to storage
  if (changed || !stored) {
    saveAllProgress(progress);
  }

  return progress;
};

// Initialize progress for all levels (helper, mostly used internally or for reset)
const initializeProgress = (): LevelProgress[] => {
  const progress = levels.map(level => ({
    levelId: level.levelId,
    completed: false,
    bestStars: 0,
    bestTime: Infinity,
    bestCorrect: 0,
    attempts: 0,
    lastPlayed: ''
  }));
  saveAllProgress(progress);
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
