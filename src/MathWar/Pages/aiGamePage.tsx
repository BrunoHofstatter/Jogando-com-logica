import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useDifficultyLock } from "../../Shared/Hooks/useDifficultyLock";
import { ROUTES } from "../../routes";
import Board from "../Components/board-component";
import { DiceAnimation } from "../Components/DiceAnimation";
import { applyAction, createInitialState, getAIMove } from "../Logic/v2";
import type { MathWarState } from "../Logic/v2";
import { formatAiDifficulty } from "../../analytics/events";
import { useBoardGameAnalytics } from "../../analytics/useBoardGameAnalytics";

export default function MathWarAIPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const difficulty = location.state?.difficulty || 1;
  const [gameState, setGameState] = useState<MathWarState>(() =>
    createInitialState({ startingPlayer: 1 }),
  );
  const [showDiceAnim, setShowDiceAnim] = useState(true);
  const [diceTarget, setDiceTarget] = useState<number[]>(
    () => gameState.diceRoll,
  );
  const { unlockNext } = useDifficultyLock("mathwar");

  useEffect(() => {
    setShowDiceAnim(true);
    setGameState(createInitialState({ startingPlayer: 1 }));
  }, [difficulty]);

  useBoardGameAnalytics({
    context: {
      gameId: "guerra_matematica",
      gameMode: "ai",
      usageContext: "standard",
      playerSlotCount: 1,
      difficulty: formatAiDifficulty(difficulty),
    },
    isReady: !showDiceAnim,
    status: gameState.status,
    winner: gameState.winner,
    perspective: 1,
  });

  useEffect(() => {
    if (gameState.turnCount % 3 === 0) {
      setDiceTarget(gameState.diceRoll);
      setShowDiceAnim(true);
    }
  }, [gameState.diceRoll, gameState.turnCount]);

  useEffect(() => {
    if (gameState.currentPlayer === 0 && gameState.status === "playing" && !showDiceAnim) {
      const timeout = setTimeout(() => {
        const attemptMove = (currentDifficulty: number): boolean => {
          try {
            const aiMove = getAIMove(gameState, currentDifficulty as 1 | 2 | 3 | 4);
            if (!aiMove) {
              return false;
            }

            const result = applyAction(gameState, aiMove);
            if (!result.ok) {
              console.warn(`AI move failed at difficulty ${currentDifficulty}`, result.evaluation.invalidReason);
              return false;
            }

            setGameState(result.state);
            return true;
          } catch (error) {
            console.error(`AI failed at difficulty ${currentDifficulty}:`, error);
            return false;
          }
        };

        if (!attemptMove(difficulty)) {
          console.warn("AI failed primary difficulty, falling back to random.");
          if (!attemptMove(1)) {
            console.error("AI completely failed to move!");
          }
        }
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [difficulty, gameState, showDiceAnim]);

  const handleGameStateChange = (newState: MathWarState) => {
    if (gameState.status === "ended" && newState.turnCount === 0) {
      setShowDiceAnim(true);
    }
    setGameState(newState);

    if (newState.status === "ended" && newState.winner === 1) {
      unlockNext(difficulty);
    }
  };

  const handleMenu = () => {
    navigate(ROUTES.MATH_WAR_RULES);
  };

  const handleNextLevel = () => {
    navigate(ROUTES.MATH_WAR_AI, { state: { difficulty: difficulty + 1 }, replace: true });
  };

  return <>
    <Board
      gameState={gameState}
      onGameStateChange={handleGameStateChange}
      isAIMode={true}
      difficulty={difficulty}
      onMenu={handleMenu}
      onNextLevel={handleNextLevel}
      showNextLevel={difficulty < 4}
    />

    {showDiceAnim && (
      <DiceAnimation
        targetValue={diceTarget}
        onComplete={() => setShowDiceAnim(false)}
      />
    )}
  </>;
}
