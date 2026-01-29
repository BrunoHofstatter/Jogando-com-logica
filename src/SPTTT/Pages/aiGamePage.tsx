import { useLocation, useNavigate } from "react-router-dom";
import SPTTT from "../Components/SPTTT";
import { useState, useEffect } from "react";
import DynamicTutorial, { TutorialStep } from "../Components/DynamicTutorial";
import { useDifficultyLock } from "../../Shared/Hooks/useDifficultyLock";

export default function SPTTTAIPage() {
  const [showTutorial, setShowTutorial] = useState(false);

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
        <div
          style={{
            fontSize: "2vw",
            color: "#a1e1ffff",
            marginBottom: "24px",
            lineHeight: 1.5,
            WebkitTextStroke: "0.15vw #26095eff",
            display: "flex",
            flexDirection: "column",
            gap: "1vw",
          }}
        >
          <span>
            - Aqui mostra o jogador da{" "}
            <span style={{ color: "#fa1172ff", fontSize: "2.3vw" }}>vez</span>
          </span>
          <span>
            - Quem aparece aqui deve{" "}
            <span style={{ color: "#fa1172ff", fontSize: "2.3vw" }}>jogar</span>
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
        <div
          style={{
            fontSize: "2vw",
            color: "#a1e1ffff",
            marginBottom: "24px",
            lineHeight: 1.5,
            WebkitTextStroke: "0.15vw #241555ff",
            display: "flex",
            flexDirection: "column",
            gap: "1vw",
          }}
        >
          <span>
            - Este é o tabuleiro{" "}
            <span style={{ color: "#fa1172ff", fontSize: "2.3vw" }}>
              gigante
            </span>
          </span>
          <span>
            - Ele tem 9 tabuleiros{" "}
            <span style={{ color: "#fa1172ff", fontSize: "2.3vw" }}>
              pequenos
            </span>
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
        <div
          style={{
            fontSize: "2vw",
            color: "#a1e1ffff",
            marginBottom: "24px",
            lineHeight: 1.5,
            WebkitTextStroke: "0.15vw #241555ff",
            display: "flex",
            flexDirection: "column",
            gap: "1vw",
          }}
        >
          <span>
            - Cada quadrado grande é um tabuleiro{" "}
            <span style={{ color: "#fa1172ff", fontSize: "2.3vw" }}>
              pequeno
            </span>
          </span>
          <span>
            - Vença ele para ganhar este{" "}
            <span style={{ color: "#fa1172ff", fontSize: "2.3vw" }}>
              quadrado
            </span>
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
        <div
          style={{
            fontSize: "2vw",
            color: "#a1e1ffff",
            marginBottom: "24px",
            lineHeight: 1.5,
            WebkitTextStroke: "0.15vw #241555ff",
            display: "flex",
            flexDirection: "column",
            gap: "1vw",
          }}
        >
          <span>
            - Aqui você coloca seu{" "}
            <span style={{ color: "#fa1172ff", fontSize: "2.3vw" }}>X</span> ou{" "}
            <span style={{ color: "#fa1172ff", fontSize: "2.3vw" }}>O</span>
          </span>
          <span>
            - Cada jogada ocupa uma{" "}
            <span style={{ color: "#fa1172ff", fontSize: "2.3vw" }}>casa</span>
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
        <div
          style={{
            fontSize: "2vw",
            color: "#a1e1ffff",
            marginBottom: "24px",
            lineHeight: 1.5,
            WebkitTextStroke: "0.15vw #241555ff",
            display: "flex",
            flexDirection: "column",
            gap: "1vw",
          }}
        >
          <span>
            - Onde você joga aqui manda o outro jogador para o mesmo{" "}
            <span style={{ color: "#fa1172ff", fontSize: "2.3vw" }}>lugar</span>
          </span>
          <span>
            - A jogada escolhe o próximo tabuleiro{" "}
            <span style={{ color: "#fa1172ff", fontSize: "2.3vw" }}>
              pequeno
            </span>
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
        <div
          style={{
            fontSize: "2vw",
            color: "#a1e1ffff",
            marginBottom: "24px",
            lineHeight: 1.5,
            WebkitTextStroke: "0.15vw #241555ff",
            display: "flex",
            flexDirection: "column",
            gap: "1vw",
          }}
        >
          <span>
            - Ganhe 3 tabuleiros pequenos em{" "}
            <span style={{ color: "#fa1172ff", fontSize: "2.3vw" }}>linha</span>
          </span>
          <span>
            - Igual ao jogo da velha{" "}
            <span style={{ color: "#fa1172ff", fontSize: "2.3vw" }}>
              normal
            </span>
          </span>
        </div>
      ),
    },
  ];

  const location = useLocation();
  const navigate = useNavigate();
  const winCondition = location.state?.winCondition || "line"; // default to "line" if not specified
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
    navigate("/spttt");
  };

  const handleNextLevel = () => {
    navigate("/spttt-ai", { state: { winCondition: "line", difficulty: difficulty + 1 }, replace: true });
  };

  const showNextLevel = difficulty < 4;


  return (
    <div className="spttt-page">
      <SPTTT
        key={gameKey}
        winCondition={winCondition}
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
        />
      )}
    </div>
  );
}
