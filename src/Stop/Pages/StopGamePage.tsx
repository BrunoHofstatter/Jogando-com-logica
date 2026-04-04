import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import NumberReveal from "../Components/NumberReveal";
import GameBoard from "../Components/GameBoard";
import DynamicTutorial, {
  TutorialStep,
} from "../../Shared/Components/DynamicTutorial";
import tutorialStyles from "../styles/DynamicTutorial.module.css";
import { getRandomDifficultyKey, type DifficultyKey } from "../Logic/gameConfig";
import { getLevelById, type LevelConfig } from "../Logic/levelsConfig";
import styles from "../styles/StopGame.module.css";

/**
 * Main Stop game page
 * Orchestrates the number reveal animation, tutorial, and game board
 */
function StopGamePage() {
  useEffect(() => {
    document.body.style.backgroundColor = "#ffbaba";
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", "#ffbaba");
  }, []);

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
  const [randomNumber, setRandomNumber] = useState<number | null>(null);
  const [showNumber, setShowNumber] = useState(true);
  const [showGame, setShowGame] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  const tutorialActiveRef = useRef(false);

  // Auto-show tutorial on first visit or if explicitly requested
  useEffect(() => {
    const completed = localStorage.getItem("tutorial_stop_v1_completed");
    if (mode === "tutorial_fixed" || completed !== "true") {
      setTimeout(() => setShowTutorial(true), 500);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "level") {
      const config = getLevelById(levelId);
      if (config) setLevelConfig(config);
    } else {
      setLevelConfig(null);
    }
  }, [mode, levelId]);

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

  const handleNumberRevealed = useCallback((number: number) => {
    setRandomNumber(number);
  }, []);

  const handleReset = () => {
    if (mode === "random") {
      setDifficulty(prev => getRandomDifficultyKey(prev));
    }
    setResetTrigger((prev) => prev + 1);
    setShowNumber(true);
    setShowGame(false);
    setRandomNumber(null);
  };

  return (
    <div>
      {/* Number reveal animation */}
      {showNumber && (
        <NumberReveal
          difficulty={difficulty}
          levelConfig={levelConfig}
          onNumberRevealed={handleNumberRevealed}
          onAnimationComplete={proceedToGame}
          tutorialActive={tutorialActiveRef.current}
        />
      )}

      {/* Game board */}
      {showGame && randomNumber !== null && (
        <GameBoard
          randomNumber={randomNumber}
          difficulty={difficulty}
          levelConfig={levelConfig}
          onReset={handleReset}
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
