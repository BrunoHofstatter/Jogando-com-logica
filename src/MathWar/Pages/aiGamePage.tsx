import Board from "../Components/board-component";
import { gameConfig } from "../Logic/gameConfig";
import { gameRules } from "../Logic/gameRules";
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import DynamicTutorial, { TutorialStep } from "../../Shared/Components/DynamicTutorial";
import tutorialStyles from "../styles/DynamicTutorial.module.css";
import { GameEngine } from "../Logic/gameEngine";
import { GameState } from "../Logic/types";
import { getAIMove } from "../Logic/aiPlayer";

import { DiceAnimation } from "../Components/DiceAnimation";
import { useDifficultyLock } from "../../Shared/Hooks/useDifficultyLock";
import { ROUTES } from "../../routes";



export default function MathWarAIPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const difficulty = location.state?.difficulty || 1;
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDiceAnim, setShowDiceAnim] = useState(false);
  const [diceTarget, setDiceTarget] = useState<number[]>([]);

  useEffect(() => {
    document.body.style.backgroundColor = "#adfad2";
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", "#adfad2");
  }, []);

  const engine = new GameEngine();
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialState = engine.initializeGame(gameConfig, gameRules);
    // Force Player 1 (Blue/Human) to start first in AI mode
    initialState.currentPlayer = 1;
    return initialState;
  });

  const { unlockNext } = useDifficultyLock("mathwar");

  // Reset game when difficulty changes (for Next Level feature)
  useEffect(() => {
    setGameState(() => {
      const initialState = engine.initializeGame(gameConfig, gameRules);
      initialState.currentPlayer = 1;
      return initialState;
    });
  }, [difficulty]);

  // Check if tutorial should auto-start
  useEffect(() => {
    const completed = localStorage.getItem('tutorial_mathwar_v1_completed');
    if (completed !== 'true') {
      setShowTutorial(true);
    }
  }, []);

  // Handle Dice Animation on turn change
  useEffect(() => {
    if (gameState.turnCount % 3 === 0 && gameState.lastDiceRoll) {
      setDiceTarget(gameState.lastDiceRoll);
      setShowDiceAnim(true);
    }
  }, [gameState.turnCount]);

  // Handle AI move when it's AI's turn (player 0 = red = AI)
  useEffect(() => {
    // Only move if AI turn AND animation is not playing
    if (gameState.currentPlayer === 0 && gameState.gamePhase === 'playing' && !showDiceAnim) {
      // Add a delay so the AI doesn't move instantly
      const timeout = setTimeout(() => {
        makeAIMove();
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [gameState.currentPlayer, gameState.gamePhase, showDiceAnim]);

  const makeAIMove = () => {
    // Try to get a move, with fallback to simpler logic if it fails
    const attemptMove = (currentDifficulty: number): boolean => {
      try {
        const aiMove = getAIMove(gameState, gameRules, currentDifficulty as any);
        const success = engine.executeAction(gameState, aiMove, gameRules);

        if (success) {
          setGameState({ ...gameState });
          return true;
        } else {
          console.warn(`AI move failed executive action at difficulty ${currentDifficulty}`);
          return false;
        }
      } catch (error) {
        console.error(`AI failed at difficulty ${currentDifficulty}:`, error);
        return false;
      }
    };

    // First try valid difficulty
    if (!attemptMove(difficulty)) {
      console.warn("AI failed primary difficulty, falling back to random (Level 1)");
      // Fallback to random move
      if (!attemptMove(1)) {
        console.error("AI completely failed to move!");
      }
    }
  };

  const handleGameStateChange = (newState: GameState) => {
    setGameState({ ...newState });

    // Check for win condition
    // Player 1 = Human (Blue)
    if (newState.gamePhase === 'ended' && newState.winner === 1) {
      unlockNext(difficulty);
    }
  };

  const handleMenu = () => {
    navigate(ROUTES.MATH_WAR_RULES);
  };

  const handleNextLevel = () => {
    // Navigate to the same page but with next difficulty
    // Force replace so history doesn't get cluttered if they spam next
    navigate(ROUTES.MATH_WAR_AI, { state: { difficulty: difficulty + 1 }, replace: true });
  };

  const showNextLevel = difficulty < 4;

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'captain',
      target: '[data-captain="true"]',
      highlight: true,
      placement: 'auto',
      title: 'O Capitão',
      body: <div className={tutorialStyles.stepBody}>
        <span>- Pode ser <span className={tutorialStyles.highlight}>qualquer </span> peça </span>
        <span>- Se ele for capturado, o jogo <span className={tutorialStyles.highlight}>acaba </span> </span>
      </div>
    },
    {
      id: 'sum',
      target: '[data-piece*="sum"]',
      highlight: true,
      placement: 'auto',
      title: 'A Soma Redonda',
      body: <div className={tutorialStyles.stepBody}>
        <span>- Se move somente em <span className={tutorialStyles.highlight}>linha reta </span> </span>
        <span>- O número na peça é seu <span className={tutorialStyles.highlight}>valor </span> </span>
      </div>
    },
    {
      id: 'sumDiag',
      target: '[data-piece*="sumDiag"]',
      highlight: true,
      placement: 'auto',
      title: 'A Soma Quadrada ',
      body: <div className={tutorialStyles.stepBody}>
        <span>- Se move somente em <span className={tutorialStyles.highlight}>diagonal </span> </span>
        <span>- O número na peça é seu <span className={tutorialStyles.highlight}>valor </span> </span>
      </div>
    },
    {
      id: 'info',
      target: '[data-target="info"]',
      highlight: true,
      placement: 'auto',
      title: 'Informações do Jogo',
      body: <div className={tutorialStyles.stepBody}>
        <span>- Toda rodada o <span className={tutorialStyles.highlight}>dado </span> gera um número de <span className={tutorialStyles.highlight}>2 a 10 </span>  </span>
        <span>- O valor de cada peça + o dado = <span className={tutorialStyles.highlight}>energia </span> da peça </span>
      </div>
    },
    {
      id: 'board',
      target: '[data-target="board"]',
      highlight: true,
      placement: 'auto',
      title: 'Informações do Jogo',
      body: <div className={tutorialStyles.stepBody}>
        <span>- Para andar <span className={tutorialStyles.highlight}>1 </span> espaço gasta <span className={tutorialStyles.highlight}>2 </span> de energia  </span>
        <span>- Para capturar uma peça gasta <span className={tutorialStyles.highlight}>mais 2 </span> de energia </span>
      </div>
    },
  ];

  return <>
    <Board
      gameConfig={gameConfig}
      gameRules={gameRules}
      gameState={gameState}
      onGameStateChange={handleGameStateChange}
      isAIMode={true}
      difficulty={difficulty}
      onMenu={handleMenu}
      onNextLevel={handleNextLevel}
      showNextLevel={showNextLevel}
    />

    {showTutorial && (
      <DynamicTutorial
        steps={tutorialSteps}
        onFinish={() => setShowTutorial(false)}
        storageKey="mathwar_v1"
        locale="pt"
        styles={tutorialStyles}
      />
    )}

    {showDiceAnim && (
      <DiceAnimation
        targetValue={diceTarget}
        onComplete={() => setShowDiceAnim(false)}
      />
    )}
  </>;
}
