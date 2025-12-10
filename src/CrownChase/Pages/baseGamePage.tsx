import Board from "../Components/board-component";
import { gameConfig } from "../Logic/gameConfig";
import { gameRules } from "../Logic/gameRules";
import { useState, useEffect } from 'react';
import DynamicTutorial, { TutorialStep } from "../Components/DynamicTutorial";
export default function CrownChasePage() {
  const [showTutorial, setShowTutorial] = useState(false);

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
          fontSize: '2vw',
          color: '#f2d356ff',
          marginBottom: '24px',
          lineHeight: 1.5,
          WebkitTextStroke: '0.15vw #241555ff',
          display:'flex',
          flexDirection:'column',
          gap:'1vw'
        }}>
          <span>- O rei <span style={{
            color: '#fb5530ff',
            fontSize:'2.3vw',
          }}>não</span> se move</span>
          <span>- Capture o rei inimigo para <span style={{
            color: '#fb5530ff',
            fontSize:'2.3vw',
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
          display:'flex',
          flexDirection:'column',
          gap:'1vw'
        }}>
          <span>- Se move 1 casa para <span style={{
            color: '#fb5530ff',
            fontSize:'2.3vw',
          }}>todos </span>lados</span>
          <span>- Pode capturar <span style={{
            color: '#fb5530ff',
            fontSize:'2.3vw',
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
          display:'flex',
          flexDirection:'column',
          gap:'1vw'
        }}>
          <span>- Move 1 casa para <span style={{
            color: '#fb5530ff',
            fontSize:'2.3vw',
          }}>baixo</span>, <span style={{
            color: '#fb5530ff',
            fontSize:'2.3vw',
          }}>cima</span> e <span style={{
            color: '#fb5530ff',
            fontSize:'2.3vw',
          }}>lados</span></span>
          <span>- Pode <span style={{
            color: '#fb5530ff',
            fontSize:'2.3vw',
          }}>pular</span> por cima de qualquer peça <span style={{
            color: '#fb5530ff',
            fontSize:'2.3vw',
          }}>sem </span>capturar</span>
          <span>- Pode capturar <span style={{
            color: '#fb5530ff',
            fontSize:'2.3vw',
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
          fontSize: '2vw',
          color: '#f2d356ff',
          marginBottom: '24px',
          lineHeight: 1.5,
          WebkitTextStroke: '0.15vw #241555ff',
          display:'flex',
          flexDirection:'column',
          gap:'1vw'
        }}>
          <span>- Veja de quem é a <span style={{
            color: '#fb5530ff',
            fontSize:'2.3vw',
          }}>vez</span> </span>
          <span>- Veja quantas peças foram <span style={{
            color: '#fb5530ff',
            fontSize:'2.3vw',
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
