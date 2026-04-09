import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import DynamicTutorial, { TutorialStep } from "../../Shared/Components/DynamicTutorial";
import { useDifficultyLock } from "../../Shared/Hooks/useDifficultyLock";
import { ROUTES } from "../../routes";
import Board from "../Components/board-component";
import { getAIMove } from "../Logic/aiPlayer";
import { applyAction, createInitialState } from "../Logic/v2";
import type { CrownChaseState } from "../Logic/v2";
import tutorialStyles from "../styles/DynamicTutorial.module.css";

export default function CrownChaseAIPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const difficulty = Number(location.state?.difficulty || 1);
  const [showTutorial, setShowTutorial] = useState(false);
  const [gameState, setGameState] = useState<CrownChaseState>(() =>
    createInitialState(),
  );
  const { unlockNext } = useDifficultyLock("crownchase");

  useEffect(() => {
    document.body.style.backgroundColor = "#d9b6fe";
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", "#d9b6fe");
  }, []);

  useEffect(() => {
    setGameState(createInitialState());
  }, [difficulty]);

  useEffect(() => {
    const completed = localStorage.getItem("tutorial_crownchase_v1_completed");
    if (completed !== "true") {
      setShowTutorial(true);
    }
  }, []);

  useEffect(() => {
    if (gameState.currentPlayer !== 0 || gameState.status !== "playing") {
      return;
    }

    const timeout = setTimeout(() => {
      try {
        const aiMove = getAIMove(gameState, difficulty as 1 | 2 | 3 | 4);
        const result = applyAction(gameState, aiMove);
        if (result.ok) {
          setGameState(result.state);
        }
      } catch (error) {
        console.error("AI move failed:", error);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [difficulty, gameState]);

  const handleGameStateChange = (newState: CrownChaseState) => {
    setGameState(newState);

    if (newState.status === "ended" && newState.winner === 1) {
      unlockNext(difficulty);
    }
  };

  const handleMenu = () => {
    navigate(ROUTES.CROWN_CHASE_RULES);
  };

  const handleNextLevel = () => {
    navigate(ROUTES.CROWN_CHASE_AI, {
      state: { difficulty: difficulty + 1 },
      replace: true,
    });
  };

  const showNextLevel = difficulty < 4;

  const tutorialSteps: TutorialStep[] = [
    {
      id: "king",
      target: '[data-piece*="king"]',
      highlight: true,
      placement: "auto",
      title: "O Rei",
      body: <div className={tutorialStyles.stepBody}>
        <span>- O rei <span className={tutorialStyles.highlight}>não</span> se move</span>
        <span>- Capture o rei inimigo para <span className={tutorialStyles.highlight}>ganhar</span></span>
      </div>,
    },
    {
      id: "killer",
      target: '[data-piece*="killer"]',
      highlight: true,
      placement: "auto",
      title: "O Assassino",
      body: <div className={tutorialStyles.stepBody}>
        <span>- Se move 1 casa para <span className={tutorialStyles.highlight}>todos</span> os lados</span>
        <span>- Pode capturar <span className={tutorialStyles.highlight}>qualquer</span> peça</span>
      </div>,
    },
    {
      id: "jumper",
      target: '[data-piece*="jumper"]',
      highlight: true,
      placement: "auto",
      title: "O Saltador",
      body: <div className={tutorialStyles.stepBody}>
        <span>- Move 1 casa para <span className={tutorialStyles.highlight}>cima</span>, <span className={tutorialStyles.highlight}>baixo</span> e <span className={tutorialStyles.highlight}>lados</span></span>
        <span>- Pode <span className={tutorialStyles.highlight}>pular</span> por cima de qualquer peça sem capturar</span>
        <span>- Pode capturar <span className={tutorialStyles.highlight}>somente</span> o rei</span>
      </div>,
    },
    {
      id: "board",
      target: '[data-target="gameInfo"]',
      highlight: true,
      placement: "auto",
      title: "Informações do Jogo",
      body: <div className={tutorialStyles.stepBody}>
        <span>- Veja de quem é a <span className={tutorialStyles.highlight}>vez</span></span>
        <span>- Veja quantas peças foram <span className={tutorialStyles.highlight}>capturadas</span></span>
      </div>,
    },
  ];

  return (
    <>
      <Board
        gameState={gameState}
        onGameStateChange={handleGameStateChange}
        isAIMode
        difficulty={difficulty}
        onMenu={handleMenu}
        onNextLevel={handleNextLevel}
        showNextLevel={showNextLevel}
      />

      {showTutorial && (
        <DynamicTutorial
          steps={tutorialSteps}
          onFinish={() => setShowTutorial(false)}
          storageKey="crownchase_v1"
          locale="pt"
          styles={tutorialStyles}
        />
      )}
    </>
  );
}
