import { useLocation } from "react-router-dom";
import SPTTT from "../Components/SPTTT";
import { useState, useEffect } from "react";
import DynamicTutorial, { TutorialStep } from "../../Shared/Components/DynamicTutorial";
import tutorialStyles from "../Style/DynamicTutorial.module.css";

export default function SPTTTPage() {
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
  const winCondition = location.state?.winCondition || "line"; // default to "line" if not specified

  return (
    <div className="spttt-page">
      <SPTTT winCondition={winCondition} />
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
