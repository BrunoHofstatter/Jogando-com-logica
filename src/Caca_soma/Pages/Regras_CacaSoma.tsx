import { useState, useEffect } from "react";
import styles from "../styles/regras.module.css";
import { useNavigate } from "react-router-dom";
import { useTutorialCompleted } from "../../Shared/Components/DynamicTutorial";

import { levels } from "../Logic/levelConfigs";
import { isLevelUnlocked, updateLevelProgress } from "../Logic/levelProgress";
import { ROUTES } from "../../routes";


type GameMode = "versus" | "levels";

function CacaSomaRegras() {
  useEffect(() => {
    document.body.style.backgroundColor = "#efc9c9";
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", "#efc9c9");
  }, []);

  const navigate = useNavigate();

  const [showDetailedRules, setShowDetailedRules] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>("levels");

  // Placeholder for current level logic (would come from progress in a real app)
  const currentLevel = 1;

  const [tutorialCompleted, resetTutorial] =
    useTutorialCompleted("cacasoma_v1");

  function jogar() {
    if (gameMode === "levels") {
      // Find the highest unlocked level
      let maxUnlockedLevel = 1;

      // We iterate through all levels to find the highest unlocked one
      // Since levels are ordered, we could optimize, but checking all is safe
      for (const level of levels) {
        if (isLevelUnlocked(level.levelId)) {
          if (level.levelId > maxUnlockedLevel) {
            maxUnlockedLevel = level.levelId;
          }
        }
      }

      navigate(`${ROUTES.CACA_SOMA_LEVEL_BASE}/${maxUnlockedLevel}`);
    } else {
      navigate(ROUTES.CACA_SOMA_GAME); // Versus/Random mode
    }
  }

  const goToLevelsMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(ROUTES.CACA_SOMA_LEVELS);
  };

  const goToOnlineLobby = () => {
    navigate(ROUTES.CACA_SOMA_MP_LOBBY);
  };

  const unlockAllLevels = () => {
    levels.forEach((level) => {
      updateLevelProgress({
        levelId: level.levelId,
        rounds: [], // Not used for progress update
        totalCorrect: 10,
        totalTime: 10,
        starsEarned: 3,
        passed: true,
      });
    });
  };

  const startTutorial = () => {
    if (gameMode === "levels") {
      // Manually reset levels specific key
      localStorage.removeItem("tutorial_cacasoma_levels_v1_completed");
      navigate(`${ROUTES.CACA_SOMA_LEVEL_BASE}/1`);
    } else {
      resetTutorial(); // Clears "tutorial_cacasoma_v1_completed"
      navigate(ROUTES.CACA_SOMA_GAME);
    }
  };

  return (
    <div className={styles.regrasPage}>
      {/* Left Side - Rules */}

      <div className={styles.boxRegras}>
        <div className={styles.gameTitle}>Caça Soma</div>
        <img
          src={`${import.meta.env.BASE_URL}cacasomaPreview.png`}
          className={styles.preview}
        />
      </div>

      {/* Right Side - Game Controls */}
      <div className={styles.botoes}>
        <button className={styles.button} onClick={jogar}>
          <span>Jogar</span>
        </button>

        {/* Mode Selector */}
        <div className={styles["mode-select-rules"]}>
          <div className={styles.levelsRow}>
            <label>
              <input
                type="radio"
                name="gameMode"
                value="levels"
                checked={gameMode === "levels"}
                onChange={() => setGameMode("levels")}
              />
              Níveis
            </label>
            {gameMode === "levels" && (
              <button className={styles.levelsButton} onClick={goToLevelsMenu}>
                Níveis ≡
              </button>
            )}
          </div>

          <label>
            <input
              type="radio"
              name="gameMode"
              value="versus"
              checked={gameMode === "versus"}
              onChange={() => setGameMode("versus")}
            />
            Modo Versus
          </label>
        </div>


        <div className={styles.bottomAuxButtons}>
          <button className={styles.tutorialButton} onClick={startTutorial}>
            <span>Tutorial</span>
          </button>
          <button className={styles.onlineButton} onClick={goToOnlineLobby}>
            Online
          </button>
          <button
            className={styles.detailedRulesButton}
            onClick={() => setShowDetailedRules(true)}
          >
            Regras
          </button>
        </div>
      </div >

      {showDetailedRules && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowDetailedRules(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeButton}
              onClick={() => setShowDetailedRules(false)}
            >
              X
            </button>

            <div className={styles.detailedRules}>
              <h2>Regras Caça Soma</h2>

              <h3 className={styles.rulesTitle}>Início da Partida:</h3>
              <p className={styles.rulesText}>
                O Jogador 1 começa a partida. O jogo é disputado em rodadas.
              </p>

              <h3 className={styles.rulesTitle}>Sorteio do Número:</h3>
              <p className={styles.rulesText}>
                Em cada rodada, o sistema sorteia um número aleatório (de 3 a
                150) para o jogador da vez.
              </p>

              <h3 className={styles.rulesTitle}>Formando a Soma:</h3>
              <p className={styles.rulesText}>
                O jogador deve selecionar <strong>2 ou 3 números</strong> da
                tabela disponível que, quando somados, resultem exatamente no
                número sorteado.
              </p>

              <h3 className={styles.rulesTitle}>Ação:</h3>
              <p className={styles.rulesText}>
                O jogador clica em "Iniciar" para começar a rodada, seleciona os
                números na tabela e depois clica em "Enviar" para submeter a sua
                resposta.
              </p>

              <h3 className={styles.rulesTitle}>Sequência de Turnos:</h3>
              <p className={styles.rulesText}>
                O Jogador 2 recebe então um novo número sorteado e repete o
                processo, tentando formar a sua própria soma.
              </p>

              <h3 className={styles.rulesTitle}>Números Usados:</h3>
              <p className={styles.rulesText}>
                Os números utilizados em somas corretas são{" "}
                <strong>riscados da tabela</strong> e não podem ser usados
                novamente por nenhum jogador no restante da partida.
              </p>

              <h3 className={styles.rulesTitle}>
                Pontuação e Vencedor da Rodada:
              </h3>
              <p className={styles.rulesText}>
                A cada rodada, o jogador que encontrar e enviar uma soma correta
                em <strong>menos tempo</strong> vence a rodada e ganha{" "}
                <strong>1 ponto</strong>.
              </p>

              <h3 className={styles.rulesTitle}>Vencendo o Jogo:</h3>
              <p className={styles.rulesText}>
                O jogo termina quando um jogador alcançar{" "}
                <strong>5 pontos</strong>.
              </p>
              <p className={styles.rulesText}>
                Esse jogador será declarado o vencedor da <span onClick={unlockAllLevels} style={{ cursor: "text" }}>partida.</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CacaSomaRegras;
