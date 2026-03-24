import Board from "../Components/board-component";
import { gameConfig } from "../Logic/gameConfig";
import { gameRules } from "../Logic/gameRules";
import { useState, useEffect } from 'react';
import DynamicTutorial, { TutorialStep } from "../Components/DynamicTutorial";

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
      body: <div style={{
        fontSize: 'clamp(2vw, min(5.5vw, 3dvh), 6vw)',
        color: '#fbbf24',
        marginBottom: '24px',
        lineHeight: 1.5,
        WebkitTextStroke: 'clamp(0.15vw, min(0.3vw, 0.2dvh), 0.4vw) #6b21a8',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(1vw, min(3vw, 2dvh), 3vw)'
      }}>
        <span>- O rei <span style={{
          color: '#fde047',
          fontSize: 'clamp(2.3vw, min(6vw, 3.5dvh), 6.5vw)',
        }}>não</span> se move</span>
        <span>- Capture o rei inimigo para <span style={{
          color: '#fde047',
          fontSize: 'clamp(2.3vw, min(6vw, 3.5dvh), 6.5vw)',
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
        fontSize: 'clamp(2vw, min(5.5vw, 3dvh), 6vw)',
        color: '#fbbf24',
        marginBottom: '24px',
        lineHeight: 1.5,
        WebkitTextStroke: 'clamp(0.15vw, min(0.3vw, 0.2dvh), 0.4vw) #6b21a8',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(1vw, min(3vw, 2dvh), 3vw)'
      }}>
        <span>- Se move 1 casa para <span style={{
          color: '#fde047',
          fontSize: 'clamp(2.3vw, min(6vw, 3.5dvh), 6.5vw)',
        }}>todos </span>lados</span>
        <span>- Pode capturar <span style={{
          color: '#fde047',
          fontSize: 'clamp(2.3vw, min(6vw, 3.5dvh), 6.5vw)',
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
        fontSize: 'clamp(2vw, min(5.5vw, 3dvh), 6vw)',
        color: '#fbbf24',
        marginBottom: '24px',
        lineHeight: 1.5,
        WebkitTextStroke: 'clamp(0.15vw, min(0.3vw, 0.2dvh), 0.4vw) #6b21a8',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(1vw, min(3vw, 2dvh), 3vw)'
      }}>
        <span>- Move 1 casa para <span style={{
          color: '#fde047',
          fontSize: 'clamp(2.3vw, min(6vw, 3.5dvh), 6.5vw)',
        }}>baixo</span>, <span style={{
          color: '#fde047',
          fontSize: 'clamp(2.3vw, min(6vw, 3.5dvh), 6.5vw)',
        }}>cima</span> e <span style={{
          color: '#fde047',
          fontSize: 'clamp(2.3vw, min(6vw, 3.5dvh), 6.5vw)',
        }}>lados</span></span>
        <span>- Pode <span style={{
          color: '#fde047',
          fontSize: 'clamp(2.3vw, min(6vw, 3.5dvh), 6.5vw)',
        }}>pular</span> por cima de qualquer peça <span style={{
          color: '#fde047',
          fontSize: 'clamp(2.3vw, min(6vw, 3.5dvh), 6.5vw)',
        }}>sem </span>capturar</span>
        <span>- Pode capturar <span style={{
          color: '#fde047',
          fontSize: 'clamp(2.3vw, min(6vw, 3.5dvh), 6.5vw)',
        }}>somente </span>o rei</span>
      </div>
    },
    {
      id: 'board',
      target: '[data-target="gameInfo"]', // Point to game info panel
      highlight: true,
      placement: 'auto',
      title: 'Informações do Jogo',
      body: <div style={{
        fontSize: 'clamp(2vw, min(5.5vw, 3dvh), 6vw)',
        color: '#fbbf24',
        marginBottom: '24px',
        lineHeight: 1.5,
        WebkitTextStroke: 'clamp(0.15vw, min(0.3vw, 0.2dvh), 0.4vw) #6b21a8',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(1vw, min(3vw, 2dvh), 3vw)'
      }}>
        <span>- Veja de quem é a <span style={{
          color: '#fde047',
          fontSize: 'clamp(2.3vw, min(6vw, 3.5dvh), 6.5vw)',
        }}>vez</span> </span>
        <span>- Veja quantas peças foram <span style={{
          color: '#fde047',
          fontSize: 'clamp(2.3vw, min(6vw, 3.5dvh), 6.5vw)',
        }}>capturadas</span></span>
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
      />
    )}
  </>;
}
