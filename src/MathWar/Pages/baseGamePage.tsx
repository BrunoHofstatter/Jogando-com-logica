import { useEffect, useState } from "react";

import DynamicTutorial, { TutorialStep } from "../../Shared/Components/DynamicTutorial";
import Board from "../Components/board-component";
import { DiceAnimation } from "../Components/DiceAnimation";
import { createInitialState } from "../Logic/v2";
import type { MathWarState } from "../Logic/v2";
import tutorialStyles from "../styles/DynamicTutorial.module.css";

export default function MathWarPage() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDiceAnim, setShowDiceAnim] = useState(false);
  const [diceTarget, setDiceTarget] = useState<number[]>([]);
  const [gameState, setGameState] = useState<MathWarState>(() =>
    createInitialState(),
  );

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

  useEffect(() => {
    const completed = localStorage.getItem("tutorial_mathwar_v1_completed");
    if (completed !== "true") {
      setShowTutorial(true);
    }
  }, []);

  useEffect(() => {
    if (gameState.turnCount % 3 === 0) {
      setDiceTarget(gameState.diceRoll);
      setShowDiceAnim(true);
    }
  }, [gameState.diceRoll, gameState.turnCount]);

  const tutorialSteps: TutorialStep[] = [
    {
      id: "captain",
      target: '[data-captain="true"]',
      highlight: true,
      placement: "auto",
      title: "O Capitão",
      body: <div className={tutorialStyles.stepBody}>
        <span>- Pode ser <span className={tutorialStyles.highlight}>qualquer </span> peça </span>
        <span>- Se ele for capturado, o jogo <span className={tutorialStyles.highlight}>acaba </span> </span>
      </div>,
    },
    {
      id: "sum",
      target: '[data-piece*="sum"]',
      highlight: true,
      placement: "auto",
      title: "A Soma Redonda",
      body: <div className={tutorialStyles.stepBody}>
        <span>- Se move somente em <span className={tutorialStyles.highlight}>linha reta </span> </span>
        <span>- O número na peça é seu <span className={tutorialStyles.highlight}>valor </span> </span>
      </div>,
    },
    {
      id: "sumDiag",
      target: '[data-piece*="sumDiag"]',
      highlight: true,
      placement: "auto",
      title: "A Soma Quadrada",
      body: <div className={tutorialStyles.stepBody}>
        <span>- Se move somente em <span className={tutorialStyles.highlight}>diagonal </span> </span>
        <span>- O número na peça é seu <span className={tutorialStyles.highlight}>valor </span> </span>
      </div>,
    },
    {
      id: "info",
      target: '[data-target="info"]',
      highlight: true,
      placement: "auto",
      title: "Informações do Jogo",
      body: <div className={tutorialStyles.stepBody}>
        <span>- Toda rodada o <span className={tutorialStyles.highlight}>dado </span> gera um número de <span className={tutorialStyles.highlight}>2 a 10 </span> </span>
        <span>- O valor de cada peça + o dado = <span className={tutorialStyles.highlight}>energia </span> da peça </span>
      </div>,
    },
    {
      id: "board",
      target: '[data-target="board"]',
      highlight: true,
      placement: "auto",
      title: "Informações do Jogo",
      body: <div className={tutorialStyles.stepBody}>
        <span>- Para andar <span className={tutorialStyles.highlight}>1 </span> espaço gasta <span className={tutorialStyles.highlight}>2 </span> de energia </span>
        <span>- Para capturar uma peça gasta <span className={tutorialStyles.highlight}>mais 2 </span> de energia </span>
      </div>,
    },
  ];

  return <>
    <Board
      gameState={gameState}
      onGameStateChange={setGameState}
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
