import Board from "../Components/board-component";
import { gameConfig } from "../Logic/gameConfig";
import { gameRules } from "../Logic/gameRules";
import { useState, useEffect } from 'react';
import DynamicTutorial, { TutorialStep } from "../../Shared/Components/DynamicTutorial";
import tutorialStyles from "../styles/DynamicTutorial.module.css";

export default function CrownChasePage() {
  const [showTutorial, setShowTutorial] = useState(false);

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

  // Check if tutorial should auto-start
  useEffect(() => {
    const completed = localStorage.getItem('tutorial_crownchase_v1_completed');
    if (completed !== 'true') {
      setShowTutorial(true);
    }
  }, []);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'king',
      target: '[data-piece*="king"]',
      highlight: true,
      placement: 'auto',
      title: 'O Rei',
      body: <div className={tutorialStyles.stepBody}>
        <span>- O rei <span className={tutorialStyles.highlight}>não</span> se move</span>
        <span>- Capture o rei inimigo para <span className={tutorialStyles.highlight}>ganhar</span></span>
      </div>
    },
    {
      id: 'killer',
      target: '[data-piece*="killer"]',
      highlight: true,
      placement: 'auto',
      title: 'O Assassino',
      body: <div className={tutorialStyles.stepBody}>
        <span>- Se move 1 casa para <span className={tutorialStyles.highlight}>todos </span>lados</span>
        <span>- Pode capturar <span className={tutorialStyles.highlight}>qualquer </span>peça</span>
      </div>
    },
    {
      id: 'jumper',
      target: '[data-piece*="jumper"]',
      highlight: true,
      placement: 'auto',
      title: 'O Saltador',
      body: <div className={tutorialStyles.stepBody}>
        <span>- Move 1 casa para <span className={tutorialStyles.highlight}>baixo</span>, <span className={tutorialStyles.highlight}>cima</span> e <span className={tutorialStyles.highlight}>lados</span></span>
        <span>- Pode <span className={tutorialStyles.highlight}>pular</span> por cima de qualquer peça <span className={tutorialStyles.highlight}>sem </span>capturar</span>
        <span>- Pode capturar <span className={tutorialStyles.highlight}>somente </span>o rei</span>
      </div>
    },
    {
      id: 'board',
      target: '[data-target="gameInfo"]',
      highlight: true,
      placement: 'auto',
      title: 'Informações do Jogo',
      body: <div className={tutorialStyles.stepBody}>
        <span>- Veja de quem é a <span className={tutorialStyles.highlight}>vez</span> </span>
        <span>- Veja quantas peças foram <span className={tutorialStyles.highlight}>capturadas</span></span>
      </div>
    }
  ];

  return <>
    <Board gameConfig={gameConfig} gameRules={gameRules} />

    {showTutorial && (
      <DynamicTutorial
        steps={tutorialSteps}
        onFinish={() => setShowTutorial(false)}
        storageKey="crownchase_v1"
        locale="pt"
        styles={tutorialStyles}
      />
    )}
  </>;
}
