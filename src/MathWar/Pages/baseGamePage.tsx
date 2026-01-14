import Board from "../Components/board-component"
import { gameConfig } from "../Logic/gameConfig"
import { gameRules } from "../Logic/gameRules"
import { useState, useEffect } from 'react';
import DynamicTutorial, { TutorialStep } from "../Components/DynamicTutorial";
import { DiceAnimation } from "../Components/DiceAnimation";
import { GameEngine } from "../Logic/gameEngine";
import { GameState } from "../Logic/types";

export default function MathWarPage() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDiceAnim, setShowDiceAnim] = useState(false);
  const [diceTarget, setDiceTarget] = useState<number[]>([]);

  const engine = new GameEngine();
  const [gameState, setGameState] = useState<GameState>(() => {
    return engine.initializeGame(gameConfig, gameRules);
  });

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

  const handleGameStateChange = (newState: GameState) => {
    setGameState({ ...newState });
  };

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'captain',
      target: '[data-captain="true"]',
      highlight: true,
      placement: 'auto',
      title: 'O Capitão',
      body: <div style={{
        fontSize: '2vw',
        color: '#f3f4f6',
        marginBottom: '24px',
        lineHeight: 1.5,
        WebkitTextStroke: '0.15vw #414549ff',
        display: 'flex',
        flexDirection: 'column',
        gap: '1vw'
      }}>
        <span>- Pode ser <span style={{
          color: '#3da2e6ff',
          fontSize: '2.3vw',
        }}>qualquer </span> peça </span>
        <span>- Se ele for capturado, o jogo <span style={{
          color: '#3da2e6ff',
          fontSize: '2.3vw',
        }}>acaba </span> </span>
      </div>
    },
    {
      id: 'sum',
      target: '[data-piece*="sum"]',
      highlight: true,
      placement: 'auto',
      title: 'A Soma Redonda',
      body: <div style={{
        fontSize: '2vw',
        color: '#f3f4f6',
        marginBottom: '24px',
        lineHeight: 1.5,
        WebkitTextStroke: '0.15vw #414549ff',
        display: 'flex',
        flexDirection: 'column',
        gap: '1vw'
      }}>
        <span>- Se move somente em <span style={{
          color: '#3da2e6ff',
          fontSize: '2.3vw',
          fontWeight: 'bold' // Added bold for consistency if desired, or remove if not in original
        }}>linha reta </span> </span>
        <span>- O número na peça é seu <span style={{
          color: '#3da2e6ff',
          fontSize: '2.3vw'
        }}>valor </span> </span>
      </div>
    },
    {
      id: 'sumDiag',
      target: '[data-piece*="sumDiag"]',
      highlight: true,
      placement: 'auto',
      title: 'A Soma Quadrada ',
      body: <div style={{
        fontSize: '2vw',
        color: '#f3f4f6',
        marginBottom: '24px',
        lineHeight: 1.5,
        WebkitTextStroke: '0.15vw #414549ff',
        display: 'flex',
        flexDirection: 'column',
        gap: '1vw'
      }}>
        <span>- Se move somente em <span style={{
          color: '#3da2e6ff',
          fontSize: '2.3vw'
        }}>diagonal </span> </span>
        <span>- O número na peça é seu <span style={{
          color: '#3da2e6ff',
          fontSize: '2.3vw'
        }}>valor </span> </span>
      </div>
    },
    {
      id: 'info',
      target: '[data-target="info"]', // Point to game info panel
      highlight: true,
      placement: 'auto',
      title: 'Informações do Jogo',
      body: <div style={{
        fontSize: '2vw',
        color: '#f3f4f6',
        marginBottom: '24px',
        lineHeight: 1.5,
        WebkitTextStroke: '0.15vw #414549ff',
        display: 'flex',
        flexDirection: 'column',
        gap: '1vw'
      }}>
        <span>- Toda rodada o <span style={{
          color: '#3da2e6ff',
          fontSize: '2.3vw'
        }}>dado </span> gera um número de <span style={{
          color: '#3da2e6ff',
          fontSize: '2.3vw'
        }}>2 a 10 </span>  </span>
        <span>- O valor de cada peça + o dado = <span style={{
          color: '#3da2e6ff',
          fontSize: '2.3vw'
        }}>energia </span> da peça </span>
      </div>
    },
    {
      id: 'board',
      target: '[data-target="board"]', // Point to game info panel
      highlight: true,
      placement: 'auto',
      title: 'Informações do Jogo',
      body: <div style={{
        fontSize: '2vw',
        color: '#f3f4f6',
        marginBottom: '24px',
        lineHeight: 1.5,
        WebkitTextStroke: '0.15vw #414549ff',
        display: 'flex',
        flexDirection: 'column',
        gap: '1vw'
      }}>
        <span>- Para andar <span style={{
          color: '#3da2e6ff',
          fontSize: '2.3vw'
        }}>1 </span> espaço gasta <span style={{
          color: '#3da2e6ff',
          fontSize: '2.3vw'
        }}>2 </span> de energia  </span>
        <span>- Para capturar uma peça gasta <span style={{
          color: '#3da2e6ff',
          fontSize: '2.3vw'
        }}>mais 2 </span> de energia </span>
      </div>
    },
  ];

  return <>
    <Board
      gameConfig={gameConfig}
      gameRules={gameRules}
      gameState={gameState}
      onGameStateChange={handleGameStateChange}
    />

    {showTutorial && (
      <DynamicTutorial
        steps={tutorialSteps}
        onFinish={() => setShowTutorial(false)}
        storageKey="mathwar_v1"
        locale="pt"
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