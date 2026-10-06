import { useState } from "react";

import Board from "../Components/board-component";
import { createInitialState } from "../Logic/v2";
import type { CrownChaseState } from "../Logic/v2";
import { useBoardGameAnalytics } from "../../analytics/useBoardGameAnalytics";

export default function CrownChasePage() {
  const [gameState, setGameState] = useState<CrownChaseState>(() =>
    createInitialState(),
  );

  useBoardGameAnalytics({
    context: {
      gameId: "caca_coroa",
      gameMode: "local_multiplayer",
      usageContext: "standard",
      playerSlotCount: 2,
    },
    isReady: true,
    status: gameState.status,
    winner: gameState.winner,
  });
  return <Board gameState={gameState} onGameStateChange={setGameState} />;
}
