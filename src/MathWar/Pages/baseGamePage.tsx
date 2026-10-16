import { useEffect, useState } from "react";

import Board from "../Components/board-component";
import { DiceAnimation } from "../Components/DiceAnimation";
import { createInitialState } from "../Logic/v2";
import type { MathWarState } from "../Logic/v2";
import { useBoardGameAnalytics } from "../../analytics/useBoardGameAnalytics";

export default function MathWarPage() {
  const [gameState, setGameState] = useState<MathWarState>(() =>
    createInitialState(),
  );
  const [showDiceAnim, setShowDiceAnim] = useState(true);
  const [diceTarget, setDiceTarget] = useState<number[]>(
    () => gameState.diceRoll,
  );

  useBoardGameAnalytics({
    context: {
      gameId: "guerra_matematica",
      gameMode: "local_multiplayer",
      usageContext: "standard",
      playerSlotCount: 2,
    },
    isReady: !showDiceAnim,
    status: gameState.status,
    winner: gameState.winner,
  });

  useEffect(() => {
    if (gameState.turnCount % 3 === 0) {
      setDiceTarget(gameState.diceRoll);
      setShowDiceAnim(true);
    }
  }, [gameState.diceRoll, gameState.turnCount]);

  const handleGameStateChange = (nextState: MathWarState) => {
    if (gameState.status === "ended" && nextState.turnCount === 0) {
      setShowDiceAnim(true);
    }
    setGameState(nextState);
  };

  return <>
    <Board
      gameState={gameState}
      onGameStateChange={handleGameStateChange}
    />

    {showDiceAnim && (
      <DiceAnimation
        targetValue={diceTarget}
        onComplete={() => setShowDiceAnim(false)}
      />
    )}
  </>;
}
