import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import NumberReveal from "../Components/NumberReveal";
import GameBoard from "../Components/GameBoard";
import DynamicTutorial, {
  TutorialStep,
} from "../Components/DynamicTutorial";
import type { DifficultyKey } from "../Logic/gameConfig";
import styles from "../styles/StopGame.module.css";

/**
 * Main Stop game page
 * Orchestrates the number reveal animation, tutorial, and game board
 */
function StopGamePage() {
  const location = useLocation();
  const difficulty = (location.state?.difficulty || "d2") as DifficultyKey;

  const [showTutorial, setShowTutorial] = useState(false);
  const [randomNumber, setRandomNumber] = useState<number | null>(null);
  const [showNumber, setShowNumber] = useState(true);
  const [showGame, setShowGame] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  const tutorialActiveRef = useRef(false);

  // Auto-show tutorial on first visit
  useEffect(() => {
    const completed = localStorage.getItem("tutorial_stop_v1_completed");
    if (completed !== "true") {
      setTimeout(() => setShowTutorial(true), 500);
    }
  }, []);

  // Tutorial step definitions
  const tutorialSteps: TutorialStep[] = [
    {
      id: "numeromagico",
      target: '[data-target="numeromagico"]',
      highlight: true,
      placement: "auto",
      title: "Número Mágico",
      body: (
        <div
          style={{
            fontSize: "2vw",
            color: "#e2a01d",
            WebkitTextStroke: "0.15vw #080303",
            marginBottom: "24px",
            lineHeight: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: "1vw",
          }}
        >
          <span>
            - O{" "}
            <span
              style={{
                color: "#f81c1cff",
                fontSize: "2.3vw",
              }}
            >
              Número Mágico{" "}
            </span>
            é sorteado
          </span>
          <span>
            - Preste{" "}
            <span
              style={{
                color: "#f81c1cff",
                fontSize: "2.3vw",
              }}
            >
              atenção{" "}
            </span>
            nesse número{" "}
          </span>
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
        <div
          style={{
            fontSize: "2vw",
            color: "#e2a01d",
            WebkitTextStroke: "0.15vw #080303",
            marginBottom: "24px",
            lineHeight: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: "1vw",
          }}
        >
          <span>
            - Use o Número mágico para fazer os{" "}
            <span
              style={{
                color: "#f81c1cff",
                fontSize: "2.3vw",
              }}
            >
              cálculos{" "}
            </span>
          </span>
          <span>
            - Cada cálculo usa o{" "}
            <span
              style={{
                color: "#f81c1cff",
                fontSize: "2.3vw",
              }}
            >
              mesmo{" "}
            </span>
            Número Mágico{" "}
          </span>
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
        <div
          style={{
            fontSize: "2vw",
            color: "#e2a01d",
            WebkitTextStroke: "0.15vw #080303",
            marginBottom: "24px",
            lineHeight: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: "1vw",
          }}
        >
          <span>
            - Quando{" "}
            <span
              style={{
                color: "#f81c1cff",
                fontSize: "2.3vw",
              }}
            >
              terminar{" "}
            </span>
            os cálculos, clique em{" "}
            <span
              style={{
                color: "#f81c1cff",
                fontSize: "2.3vw",
              }}
            >
              STOP{" "}
            </span>
          </span>
          <span>
            - E veja sua{" "}
            <span
              style={{
                color: "#f81c1cff",
                fontSize: "2.3vw",
              }}
            >
              pontuação{" "}
            </span>
            e{" "}
            <span
              style={{
                color: "#f81c1cff",
                fontSize: "2.3vw",
              }}
            >
              tempo{" "}
            </span>
            de jogo
          </span>
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
          onNumberRevealed={handleNumberRevealed}
          onAnimationComplete={proceedToGame}
          tutorialActive={tutorialActiveRef.current}
        />
      )}

      {/* Game board */}
      {showGame && randomNumber !== null && (
        <>
          <GameBoard randomNumber={randomNumber} difficulty={difficulty} />
          <button onClick={handleReset} className={styles.resetButton}>
            Reiniciar
          </button>
        </>
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
        />
      )}
    </div>
  );
}

export default StopGamePage;
