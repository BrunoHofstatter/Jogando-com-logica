import { useLocation, useNavigate } from "react-router-dom";
import SPTTT from "../Components/SPTTT";
import { useState, useEffect } from "react";
import DynamicTutorial, { TutorialStep } from "../../Shared/Components/DynamicTutorial";
import tutorialStyles from "../Style/DynamicTutorial.module.css";
import { useDifficultyLock } from "../../Shared/Hooks/useDifficultyLock";
import { ROUTES } from "../../routes";


export default function SPTTTAIPage() {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = "#c2e4fa";
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", "#c2e4fa");
  }, []);

  // Auto-show on first visit
  useEffect(() => {
    const completed = localStorage.getItem("tutorial_spttt_v1_completed");
    if (completed !== "true") {
      setTimeout(() => setShowTutorial(true), 500); // Delay for DOM
    }
  }, []);
  const tutorialSteps: TutorialStep[] = [
    {
      id: "player",
      target: '[data-target="player"]',
      highlight: true,
      placement: "auto",
      title: "Jogador da Vez",
      body: (
        <div className={tutorialStyles.stepBody}>
          <span>
            - Aqui mostra o jogador da{" "}
            <span className={tutorialStyles.highlight}>vez</span>
          </span>
          <span>
            - Quem aparece aqui deve{" "}
            <span className={tutorialStyles.highlight}>jogar</span>
          </span>
        </div>
      ),
    },

    {
      id: "bigboard",
      target: '[data-target="bigboard"]',
      highlight: true,
      placement: "auto",
      title: "Tabuleiro Gigante",
      body: (
        <div className={tutorialStyles.stepBody}>
          <span>
            - Este é o tabuleiro{" "}
            <span className={tutorialStyles.highlight}>gigante</span>
          </span>
          <span>
            - Ele tem 9 tabuleiros{" "}
            <span className={tutorialStyles.highlight}>pequenos</span>
          </span>
        </div>
      ),
    },

    {
      id: "smallboard",
      target: '[data-target="smallboard-0"]',
      highlight: true,
      placement: "auto",
      title: "Tabuleiro Pequeno",
      body: (
        <div className={tutorialStyles.stepBody}>
          <span>
            - Cada quadrado grande é um tabuleiro{" "}
            <span className={tutorialStyles.highlight}>pequeno</span>
          </span>
          <span>
            - Vença ele para ganhar este{" "}
            <span className={tutorialStyles.highlight}>quadrado</span>
          </span>
        </div>
      ),
    },

    {
      id: "cell",
      target: '[data-cell="0-0"]',
      highlight: true,
      placement: "auto",
      title: "Casa do Jogo",
      body: (
        <div className={tutorialStyles.stepBody}>
          <span>
            - Aqui você coloca seu{" "}
            <span className={tutorialStyles.highlight}>X</span> ou{" "}
            <span className={tutorialStyles.highlight}>O</span>
          </span>
          <span>
            - Cada jogada ocupa uma{" "}
            <span className={tutorialStyles.highlight}>casa</span>
          </span>
        </div>
      ),
    },

    {
      id: "sendrule",
      target: '[data-cell="6-2"]',
      highlight: true,
      placement: "auto",
      title: "Regra Principal",
      secondaryTargets: ['[data-target="smallboard-2"]'],

      body: (
        <div className={tutorialStyles.stepBody}>
          <span>
            - Onde você joga aqui manda o outro jogador para o mesmo{" "}
            <span className={tutorialStyles.highlight}>lugar</span>
          </span>
          <span>
            - A jogada escolhe o próximo tabuleiro{" "}
            <span className={tutorialStyles.highlight}>pequeno</span>
          </span>
        </div>
      ),
    },

    {
      id: "winrule",
      target: '[data-target="smallboard-1"]',
      highlight: true,
      placement: "auto",
      title: "Como Vencer",
      secondaryTargets: [
        '[data-target="smallboard-4"]',
        '[data-target="smallboard-7"]',
      ],
      body: (
        <div className={tutorialStyles.stepBody}>
          <span>
            - Ganhe 3 tabuleiros pequenos em{" "}
            <span className={tutorialStyles.highlight}>linha</span>
          </span>
          <span>
            - Igual ao jogo da velha{" "}
            <span className={tutorialStyles.highlight}>normal</span>
          </span>
        </div>
      ),
    },
  ];

  const location = useLocation();
  const navigate = useNavigate();
  const difficulty = Number(location.state?.difficulty || 1);
  const { unlockNext } = useDifficultyLock("spttt");

  // Key reset for forcing recreation when difficulty changes
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    setGameKey(prev => prev + 1);
  }, [difficulty]);


  const handleUnlock = () => {
    unlockNext(difficulty);
  };

  const handleMenu = () => {
    navigate(ROUTES.SPTTT_RULES);
  };

  const handleNextLevel = () => {
    navigate(ROUTES.SPTTT_AI, { state: { difficulty: difficulty + 1 }, replace: true });
  };

  const showNextLevel = difficulty < 4;


  return (
    <div className="spttt-page">
      <SPTTT
        key={gameKey}
        isAiMode={true}
        difficulty={difficulty as 1 | 2 | 3 | 4}
        onUnlockNext={handleUnlock}
        onMenu={handleMenu}
        onNextLevel={handleNextLevel}
        showNextLevel={showNextLevel}
      />
      {showTutorial && (
        <DynamicTutorial
          steps={tutorialSteps}
          onFinish={() => setShowTutorial(false)}
          storageKey="spttt_v1"
          locale="pt"
          styles={tutorialStyles}
        />
      )}
    </div>
  );
}
