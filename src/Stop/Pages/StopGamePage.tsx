import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import NumberReveal from "../Components/NumberReveal";
import GameBoard from "../Components/GameBoard";
import DynamicTutorial, {
  TutorialStep,
} from "../../Shared/Components/DynamicTutorial";
import tutorialStyles from "../styles/DynamicTutorial.module.css";
import { getRandomDifficultyKey, type DifficultyKey } from "../Logic/gameConfig";
import { getLevelById, type LevelConfig } from "../Logic/levelsConfig";
import {
  createStopRound,
  createStopRoundTemplateFromDifficulty,
  createStopRoundTemplateFromLevel,
  type StopRound,
} from "../Logic/stopRound";
import { formatLevelId, type ActivityVariant } from "../../analytics/events";
import { useGameAttemptAnalytics } from "../../analytics/useGameAttemptAnalytics";

/**
 * Main Stop game page
 * Orchestrates the number reveal animation, tutorial, and game board
 */
function StopGamePage() {

  const location = useLocation();
  const mode = location.state?.mode || "random";
  const levelId = location.state?.level || 1;
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);

  // Initialize difficulty based on mode
  const [difficulty, setDifficulty] = useState<DifficultyKey>(() => {
    // Priority: If tutorial is not completed, FORCE d1
    // The tutorial flag is "tutorial_stop_v1_completed"
    const tutorialCompleted = localStorage.getItem("tutorial_stop_v1_completed") === "true";

    // If we are in a forced tutorial mode, we definitely want d1.
    // If we are in random mode (first load) but tutorial is not done, we also want d1.
    if (!tutorialCompleted) {
      return "d1";
    }

    if (mode === "random") {
      return getRandomDifficultyKey();
    }

    // For specific levels or forced difficulty
    return (location.state?.difficulty || "d1") as DifficultyKey;
  });

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialCheckComplete, setTutorialCheckComplete] = useState(false);
  const [currentRound, setCurrentRound] = useState<StopRound | null>(null);
  const [showNumber, setShowNumber] = useState(true);
  const [showGame, setShowGame] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  const tutorialActiveRef = useRef(false);

  const activityVariant: ActivityVariant =
    mode === "level"
      ? "level"
      : mode === "tutorial_fixed"
        ? "tutorial"
        : "random";
  const analyticsContext = useMemo(
    () => ({
      gameId: "stop_matematico" as const,
      gameMode: "solo" as const,
      usageContext: "standard" as const,
      playerSlotCount: 1,
      levelId: mode === "level" ? formatLevelId(levelId) : undefined,
      difficulty: mode === "level" ? undefined : difficulty,
      activityVariant,
    }),
    [activityVariant, difficulty, levelId, mode],
  );
  const { completeAttempt, startAttempt } =
    useGameAttemptAnalytics(analyticsContext);

  // Auto-show tutorial on first visit or if explicitly requested
  useEffect(() => {
    const completed = localStorage.getItem("tutorial_stop_v1_completed");
    if (mode === "tutorial_fixed" || completed !== "true") {
      const timeout = window.setTimeout(() => {
        setShowTutorial(true);
        setTutorialCheckComplete(true);
      }, 500);
      return () => window.clearTimeout(timeout);
    }

    setTutorialCheckComplete(true);
  }, [mode]);

  useEffect(() => {
    if (mode === "level") {
      const config = getLevelById(levelId);
      if (config) setLevelConfig(config);
    } else {
      setLevelConfig(null);
    }
  }, [mode, levelId]);

  const roundTemplate = useMemo(() => {
    if (mode === "level") {
      return levelConfig ? createStopRoundTemplateFromLevel(levelConfig) : null;
    }

    return createStopRoundTemplateFromDifficulty(difficulty);
  }, [difficulty, levelConfig, mode]);

  useEffect(() => {
    if (!roundTemplate) {
      return;
    }

    setCurrentRound(createStopRound(roundTemplate));
  }, [roundTemplate, resetTrigger]);

  // Tutorial step definitions
  const tutorialSteps: TutorialStep[] = [
    {
      id: "numeromagico",
      target: '[data-target="numeromagico"]',
      highlight: true,
      placement: "auto",
      title: "Número Mágico",
      body: (
        <div className={tutorialStyles.stepBody}>
          <span>- O <span className={tutorialStyles.highlight}>Número Mágico </span>é sorteado</span>
          <span>- Preste <span className={tutorialStyles.highlight}>atenção </span>nesse número</span>
        </div>
      ),
    },
    {
      id: "board",
      target: '[data-target="board"]',
      highlight: true,
      placement: "auto",
      title: "Cáculos",
      body: (
        <div className={tutorialStyles.stepBody}>
          <span>- Use o Número mágico para fazer os <span className={tutorialStyles.highlight}>cálculos </span></span>
          <span>- Cada cálculo usa o <span className={tutorialStyles.highlight}>mesmo </span>Número Mágico</span>
        </div>
      ),
    },
    {
      id: "stopbutton",
      target: '[data-target="stopbutton"]',
      highlight: true,
      placement: "auto",
      title: "O Botão STOP",
      body: (
        <div className={tutorialStyles.stepBody}>
          <span>- Quando <span className={tutorialStyles.highlight}>terminar </span>os cálculos, clique em <span className={tutorialStyles.highlight}>STOP </span></span>
          <span>- E veja sua <span className={tutorialStyles.highlight}>pontuação </span>e <span className={tutorialStyles.highlight}>tempo </span>de jogo</span>
        </div>
      ),
    },
  ];

  const proceedToGame = useCallback(() => {
    setShowNumber(false);
    setShowGame(true);
  }, []);

  const handleReset = () => {
    if (mode === "random") {
      setDifficulty(prev => getRandomDifficultyKey(prev));
    }
    setCurrentRound(null);
    setResetTrigger((prev) => prev + 1);
    setShowNumber(true);
    setShowGame(false);
  };

  return (
    <div>
      {/* Number reveal animation */}
      {showNumber && currentRound !== null && roundTemplate !== null && (
        <NumberReveal
          finalNumber={currentRound.magicNumber}
          possibleNumbers={roundTemplate.possibleRandomNumbers}
          onAnimationComplete={proceedToGame}
          tutorialActive={tutorialActiveRef.current}
        />
      )}

      {/* Game board */}
      {showGame && currentRound !== null && (
        <GameBoard
          round={currentRound}
          levelConfig={levelConfig}
          onReset={handleReset}
          interactionReady={tutorialCheckComplete && !showTutorial}
          onPlayable={startAttempt}
          onComplete={completeAttempt}
        />
      )}
      {/* Tutorial overlay */}
      {showTutorial && (
        <DynamicTutorial
          steps={tutorialSteps}
          onStart={() => {
            tutorialActiveRef.current = true;
          }}
          onStepChange={(index) => {
            if (index === 1) {
              proceedToGame();
            }
          }}
          onFinish={() => {
            tutorialActiveRef.current = false;
            setShowTutorial(false);
            if (showNumber) {
              proceedToGame();
            }
          }}
          storageKey="stop_v1"
          locale="pt"
          styles={tutorialStyles}
        />
      )}
    </div>
  );
}

export default StopGamePage;
