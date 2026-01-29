import Board from "../Components/board-component";
import { gameConfig } from "../Logic/gameConfig";
import { gameRules } from "../Logic/gameRules";
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import DynamicTutorial, { TutorialStep } from "../Components/DynamicTutorial";
import { GameEngine } from "../../CrownChase/Logic/gameEngine";
import { GameState } from "../../CrownChase/Logic/types";
import { getAIMove } from "../Logic/aiPlayer";

import { useDifficultyLock } from "../../Shared/Hooks/useDifficultyLock";

export default function CrownChaseAIPage() {
  const location = useLocation();
  const navigate = useNavigate();
  // Ensure difficulty is a number
  const difficulty = Number(location.state?.difficulty || 1);
  const [showTutorial, setShowTutorial] = useState(false);
  const engine = new GameEngine();
  const [gameState, setGameState] = useState<GameState>(() =>
    engine.initializeGame(gameConfig, gameRules)
  );

  const { unlockNext, isUnlocked } = useDifficultyLock("crownchase");

  // Reset game when difficulty changes (for Next Level feature)
  useEffect(() => {
    setGameState(engine.initializeGame(gameConfig, gameRules));
  }, [difficulty]);

  // Check if tutorial should auto-start
  useEffect(() => {
    const completed = localStorage.getItem('tutorial_crownchase_v1_completed');
    if (completed !== 'true') {
      setShowTutorial(true);
    }
  }, []);

  // Handle AI move when it's AI's turn (player 0 = red = AI)
  useEffect(() => {
    if (gameState.currentPlayer === 0 && gameState.gamePhase === 'playing') {
      // Add a delay so the AI doesn't move instantly
      const timeout = setTimeout(() => {
        makeAIMove();
      }, 800);

      return () => clearTimeout(timeout);
    }
  }, [gameState.currentPlayer, gameState.gamePhase]);

  const makeAIMove = () => {
    try {
      const aiMove = getAIMove(gameState, gameRules, difficulty as 1 | 2 | 3 | 4);
      const success = engine.executeAction(gameState, aiMove, gameRules);

      if (success) {
        setGameState({ ...gameState });
      }
    } catch (error) {
      console.error("AI move failed:", error);
    }
  };

  const handleGameStateChange = (newState: GameState) => {
    setGameState({ ...newState });

    // Check for win condition
    if (newState.gamePhase === 'ended' && newState.winner === 1) {
      // Player 1 (Human) won
      unlockNext(difficulty);
    }
  };

  const handleMenu = () => {
    navigate("/crownchaseRg");
  };

  const handleNextLevel = () => {
    // Navigate to the same page but with next difficulty
    // Force replace so history doesn't get cluttered if they spam next
    navigate("/crownchase-ai", { state: { difficulty: difficulty + 1 }, replace: true });
  };

  const showNextLevel = difficulty < 4;

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'king',
      target: '[data-piece*="king"]',
      highlight: true,
      placement: 'auto',
      title: 'O Rei',
      body: <div style={{
        fontSize: '2vw',
        color: '#f2d356ff',
        marginBottom: '24px',
        lineHeight: 1.5,
        WebkitTextStroke: '0.15vw #241555ff',
        display: 'flex',
        flexDirection: 'column',
        gap: '1vw'
      }}>
        <span>- O rei <span style={{
          color: '#fb5530ff',
          fontSize: '2.3vw',
        }}>não</span> se move</span>
        <span>- Capture o rei inimigo para <span style={{
          color: '#fb5530ff',
          fontSize: '2.3vw',
        }}>ganhar</span></span>
      </div>
    },
    {
      id: 'killer',
      target: '[data-piece*="killer"]',
      highlight: true,
      placement: 'auto',
      title: 'O Assassino',
      body: <div style={{
        fontSize: '2vw',
        color: '#f2d356ff',
        marginBottom: '24px',
        lineHeight: 1.5,
        WebkitTextStroke: '0.15vw #241555ff',
        display: 'flex',
        flexDirection: 'column',
        gap: '1vw'
      }}>
        <span>- Se move 1 casa para <span style={{
          color: '#fb5530ff',
          fontSize: '2.3vw',
        }}>todos </span>lados</span>
        <span>- Pode capturar <span style={{
          color: '#fb5530ff',
          fontSize: '2.3vw',
        }}>qualquer </span>peça</span>
      </div>
    },
    {
      id: 'jumper',
      target: '[data-piece*="jumper"]',
      highlight: true,
      placement: 'auto',
      title: 'O Saltador',
      body: <div style={{
        fontSize: '2vw',
        color: '#f2d356ff',
        marginBottom: '24px',
        lineHeight: 1.5,
        WebkitTextStroke: '0.15vw #241555ff',
        display: 'flex',
        flexDirection: 'column',
        gap: '1vw'
      }}>
        <span>- Move 1 casa para <span style={{
          color: '#fb5530ff',
          fontSize: '2.3vw',
        }}>baixo</span>, <span style={{
          color: '#fb5530ff',
          fontSize: '2.3vw',
        }}>cima</span> e <span style={{
          color: '#fb5530ff',
          fontSize: '2.3vw',
        }}>lados</span></span>
        <span>- Pode <span style={{
          color: '#fb5530ff',
          fontSize: '2.3vw',
        }}>pular</span> por cima de qualquer peça <span style={{
          color: '#fb5530ff',
          fontSize: '2.3vw',
        }}>sem </span>capturar</span>
        <span>- Pode capturar <span style={{
          color: '#fb5530ff',
          fontSize: '2.3vw',
        }}>somente </span>o rei</span>
      </div>
    },
    {
      id: 'board',
      target: '[data-target="gameInfo"]',
      highlight: true,
      placement: 'auto',
      title: 'Informações do Jogo',
      body: <div style={{
        fontSize: '2vw',
        color: '#f2d356ff',
        marginBottom: '24px',
        lineHeight: 1.5,
        WebkitTextStroke: '0.15vw #241555ff',
        display: 'flex',
        flexDirection: 'column',
        gap: '1vw'
      }}>
        <span>- Veja de quem é a <span style={{
          color: '#fb5530ff',
          fontSize: '2.3vw',
        }}>vez</span> </span>
        <span>- Veja quantas peças foram <span style={{
          color: '#fb5530ff',
          fontSize: '2.3vw',
        }}>capturadas</span></span>
      </div>
    }
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
        storageKey="crownchase_v1"
        locale="pt"
      />
    )}
  </>;
}
