import { useState, useEffect, useRef, useCallback } from "react";
import "./Stop.css";
import StopJogo from "./JogoStop";
import { useLocation } from "react-router-dom";
import { difficulties,DifficultyKey } from "./Difficulties";
import DynamicTutorial, { TutorialStep } from './DynamicTutorial';

function StopPage() {
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Auto-show on first visit
  useEffect(() => {
    const completed = localStorage.getItem('tutorial_stop_v1_completed');
    if (completed !== 'true') {
      setTimeout(() => setShowTutorial(true), 500); // Delay for DOM
    }
  }, []);
  const tutorialSteps: TutorialStep[] = [
      {
        id: 'numeromagico',
        target: '[data-target="numeromagico"]',
        highlight: true,
        placement: 'auto',
        title: 'Número Mágico',
        body: <div style={{
            fontSize: '2vw',
            color: "#e2a01d",
            WebkitTextStroke: "0.15vw #080303",
            marginBottom: '24px',
            lineHeight: 1.5,
            display:'flex',
            flexDirection:'column',
            gap:'1vw'
          }}>
            <span>- O <span style={{
              color: '#f81c1cff',
              fontSize:'2.3vw',
            }}>Número Mágico </span> é sorteado</span>
            <span>- Preste <span style={{
              color: '#f81c1cff',
              fontSize:'2.3vw',
            }}>atenção </span> nesse número </span>
          </div>
      },
      {
        id: 'board',
        target: '[data-target="board"]',
        highlight: true,
        placement: 'auto',
        title: 'Cáculos',
        body: <div style={{
            fontSize: '2vw',
            color: "#e2a01d",
            WebkitTextStroke: "0.15vw #080303",
            marginBottom: '24px',
            lineHeight: 1.5,
            display:'flex',
            flexDirection:'column',
            gap:'1vw'
          }}>
            <span>- Use o Número mágico para fazer os <span style={{
              color: '#f81c1cff',
              fontSize:'2.3vw',
            }}>cálculos </span></span>
            <span>- Cada cálculo usa o <span style={{
              color: '#f81c1cff',
              fontSize:'2.3vw',
            }}>mesmo </span> Número Mágico </span>
          </div>
      },
      {
        id: 'stopbutton',
        target: '[data-target="stopbutton"]',
        highlight: true,
        placement: 'auto',
        title: 'O Botão STOP',
        body: <div style={{
            fontSize: '2vw',
            color: "#e2a01d",
            WebkitTextStroke: "0.15vw #080303",
            marginBottom: '24px',
            lineHeight: 1.5,
            display:'flex',
            flexDirection:'column',
            gap:'1vw'
          }}>
            <span>- Quando <span style={{
              color: '#f81c1cff',
              fontSize:'2.3vw',
            }}>terminar </span> os cálculos, clique em <span style={{
              color: '#f81c1cff',
              fontSize:'2.3vw',
            }}>STOP </span></span>
            <span>- E veja sua <span style={{
              color: '#f81c1cff',
              fontSize:'2.3vw',
            }}>pontuação </span> e <span style={{
              color: '#f81c1cff',
              fontSize:'2.3vw',
            }}>tempo </span> de jogo</span>
          </div>
      }
    ];
 const tutorialActiveRef = useRef(false);

const proceedToGame = useCallback(() => {
  if (gameTimeoutRef.current) clearTimeout(gameTimeoutRef.current);
  setShowNumber(false);
  setShowGame(true);
}, []);   
  const NumGenerator = () => {
    const possible =
      difficulties[difficulty as DifficultyKey].possibleRandomNumbers;
    const index = Math.floor(Math.random() * possible.length);
    return possible[index];
  };
  const location = useLocation();
  const difficulty = (location.state?.difficulty || "d2") as DifficultyKey;
  const [randomNumber, setRandomNumber] = useState<number | null>(null);
  const [displayedNumber, setDisplayedNumber] = useState<number>(4);
  const [showGame, setShowGame] = useState(false);
  const [showNumber, setShowNumber] = useState(true);
  const [resetTrigger, setResetTrigger] = useState(0); // Triggers re-run

  // Use browser-safe types
  const animationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startGame = useCallback(() => {
  setShowGame(false);
  setShowNumber(true);
  setDisplayedNumber(4);
  setRandomNumber(null);

  animationIntervalRef.current = setInterval(() => {
    setDisplayedNumber(NumGenerator());
  }, 50);

  stopTimeoutRef.current = setTimeout(() => {
    if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
    const finalNum = NumGenerator();
    setDisplayedNumber(finalNum);
    setRandomNumber(finalNum);
  }, 2000);

  // Only auto-advance if tutorial is NOT active
  if (!tutorialActiveRef.current) {
    gameTimeoutRef.current = setTimeout(() => {
      proceedToGame();
    }, 3500);
  }
}, [proceedToGame]);

  useEffect(() => {
    startGame();

    return () => {
      if (animationIntervalRef.current)
        clearInterval(animationIntervalRef.current);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      if (gameTimeoutRef.current) clearTimeout(gameTimeoutRef.current);
    };
  }, [resetTrigger]); // re-run when resetTrigger changes

  const handleReset = () => {
    setResetTrigger((prev) => prev + 1);
  };

  return (
    <div>
      {showNumber && (
        <div className="sortPage">
          <div className="bordaSort">
            <div className="divSort" >
              <div className="sort">O número mágico é</div>
              <div className="numeroBox" data-target="numeromagico">
                <span className="numero">{displayedNumber}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGame && randomNumber !== null && (
        <>
          <StopJogo randomNumber={randomNumber} difficulty={difficulty} />
          <button onClick={handleReset} className="reset-button">
            Reiniciar
          </button>
        </>
      )}
      {showTutorial && (
        <DynamicTutorial
  steps={tutorialSteps}
  onStart={() => {
    tutorialActiveRef.current = true;
    if (gameTimeoutRef.current) clearTimeout(gameTimeoutRef.current);
  }}
  onStepChange={(index) => {
    if (index === 1) {
      proceedToGame();
    }
  }}
  onFinish={() => {
    tutorialActiveRef.current = false;
    setShowTutorial(false);           // <-- add this back
    if (showNumber) {
      proceedToGame();
    }
  }}
  storageKey="stop_v1"
  locale="pt"
/>
      )}
    </div>
  );
}

export default StopPage;
