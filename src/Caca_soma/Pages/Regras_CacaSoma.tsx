import { useState, useEffect } from "react";
import styles from "../styles/regras.module.css";
import { useNavigate } from "react-router-dom";
import { useTutorialCompleted } from "../../Shared/Components/DynamicTutorial";

import { levels } from "../Logic/levelConfigs";
import { isLevelUnlocked, unlockAllLevelProgress } from "../Logic/levelProgress";
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

  const [, resetTutorial] = useTutorialCompleted("cacasoma_v1");

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
    unlockAllLevelProgress();
    alert("Todas as fases foram desbloqueadas!");
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

              <h3 className={styles.rulesTitle}>Objetivo:</h3>
              <p className={styles.rulesText}>
                Encontre números na tabela que, quando somados, resultem
                exatamente no <strong>Número Mágico</strong>.
              </p>

              <h3 className={styles.rulesTitle}>Modo Níveis:</h3>
              <p className={styles.rulesText}>
                Complete uma sequência de rodadas, acerte as somas e termine
                dentro do tempo para conquistar estrelas. Os números usados em
                respostas corretas ficam indisponíveis nas próximas rodadas.
              </p>

              <h3 className={styles.rulesTitle}>Modo Versus:</h3>
              <p className={styles.rulesText}>
                Dois jogadores se alternam no mesmo aparelho. Cada jogador tenta
                formar a soma correta com <strong>2 ou 3 números</strong>. Quem
                resolver mais rápido ganha o ponto.
              </p>

              <h3 className={styles.rulesTitle}>Modo Online:</h3>
              <p className={styles.rulesText}>
                Crie uma sala ou entre com o código de um amigo. O anfitrião pode
                escolher partidas <strong>1 contra 1</strong> ou{" "}
                <strong>2 contra 2</strong>, ajustar a dificuldade e definir
                quantos pontos são necessários para vencer.
              </p>

              <h3 className={styles.rulesTitle}>Rodadas Online:</h3>
              <p className={styles.rulesText}>
                Aguarde a contagem regressiva e o sorteio do Número Mágico. Quando
                a rodada começar, escolha os números e clique em{" "}
                <strong>Pronto</strong>. No modo 2 contra 2, cada jogador escolhe
                um número e pode ver a escolha do colega de equipe.
              </p>

              <h3 className={styles.rulesTitle}>Números Usados:</h3>
              <p className={styles.rulesText}>
                Os números utilizados em somas corretas ficam indisponíveis nas
                próximas rodadas.
              </p>

              <h3 className={styles.rulesTitle}>Pontuação Online:</h3>
              <p className={styles.rulesText}>
                Cada rodada vale no máximo <strong>1 ponto</strong>. Se os dois
                lados acertarem, vence quem for mais rápido. Se ninguém acertar
                ou houver empate, ninguém recebe ponto.
              </p>

              <p className={styles.rulesText}>
                Divirta-se formando as{" "}
                <span onClick={unlockAllLevels} style={{ cursor: "text" }}>
                  somas!
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CacaSomaRegras;
