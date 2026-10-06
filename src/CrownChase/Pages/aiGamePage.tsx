import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { allowedDifficulty } from "../Tutorial/navigation";
import { useDifficultyLock } from "../../Shared/Hooks/useDifficultyLock";
import { ROUTES } from "../../routes";
import Board from "../Components/board-component";
import { getAIMove } from "../Logic/aiPlayer";
import { applyAction, createInitialState } from "../Logic/v2";
import type { CrownChaseState } from "../Logic/v2";
import { formatAiDifficulty } from "../../analytics/events";
import { useBoardGameAnalytics } from "../../analytics/useBoardGameAnalytics";

export default function CrownChaseAIPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const difficulty = allowedDifficulty(location.state?.difficulty);
  const [gameState, setGameState] = useState<CrownChaseState>(() =>
    createInitialState(),
  );
  const { unlockNext } = useDifficultyLock("crownchase");


  useEffect(() => {
    setGameState(createInitialState());
  }, [difficulty]);

  useBoardGameAnalytics({
    context: {
      gameId: "caca_coroa",
      gameMode: "ai",
      usageContext: "standard",
      playerSlotCount: 1,
      difficulty: formatAiDifficulty(difficulty),
    },
    isReady: true,
    status: gameState.status,
    winner: gameState.winner,
    perspective: 1,
  });

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
  return (
      <Board
        gameState={gameState}
        onGameStateChange={handleGameStateChange}
        isAIMode
        difficulty={difficulty}
        onMenu={handleMenu}
        onNextLevel={handleNextLevel}
        showNextLevel={showNextLevel}
      />
  );
}
