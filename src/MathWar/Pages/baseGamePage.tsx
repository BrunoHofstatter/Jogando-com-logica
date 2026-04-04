import Board from "../Components/board-component"
import { gameConfig } from "../Logic/gameConfig"
import { gameRules } from "../Logic/gameRules"
import { useState, useEffect } from 'react';
import DynamicTutorial, { TutorialStep } from "../../Shared/Components/DynamicTutorial";
import tutorialStyles from "../styles/DynamicTutorial.module.css";
import { DiceAnimation } from "../Components/DiceAnimation";
import { GameEngine } from "../Logic/gameEngine";
import { GameState } from "../Logic/types";

export default function MathWarPage() {
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
      target: '[data-target="info"]', // Point to game info panel
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
      target: '[data-target="board"]', // Point to game info panel
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