import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTutorialCompleted } from "../Components/DynamicTutorial";
import styles from "../styles/Regras.module.css";
import { levels, saveLevelStars } from "../Logic/levelsConfig";

type GameMode = "random" | "levels";

/**
 * Rules and mode selection page for Stop Matemático
 */
function RegrasPage() {
  const navigate = useNavigate();
  const [showDetailedRules, setShowDetailedRules] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>("levels");
  const [, resetTutorial] = useTutorialCompleted("stop_v1");

  // Placeholder for future level system
  const currentLevel = 1;

  function jogarStop() {
    if (gameMode === "random") {
      navigate("/stopPage", { state: { mode: "random" } });
    } else {
      // For now, levels mode just plays the current level (which will need implementation in game page)
      // or we can pass a specific level difficulty if we had it. 
      // Plan says: navigate with state { mode: 'level', level: currentLevel }
      navigate("/stopPage", { state: { mode: "level", level: currentLevel } });
    }
  }

  const startTutorial = () => {
    resetTutorial(); // Clear the "completed" flag
    // Tutorial always uses fixed difficulty (usually d1)
    navigate("/stopPage", { state: { mode: "tutorial_fixed", difficulty: "d1" } });
  };

  const goToLevelsMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/stop-levels");
  };

  const unlockAllLevels = () => {
    levels.forEach((level) => {
      saveLevelStars(level.id, 2);
    });
    alert("Todas as fases foram desbloqueadas!");
  };

  return (
    <div className={styles.regrasPage}>
      {/* Left Side - Rules */}
      <div className={styles.boxRegras}>
        <div className={styles.gameTitle}>Stop Matemático</div>
        <img
          src={`${import.meta.env.BASE_URL}stopPreview.png`}
          className={styles.preview}
        />
      </div>

      {/* Right Side - Game Controls */}
      <div className={styles.botoes}>
        <button className={styles.button} onClick={jogarStop}>
          <span>Jogar</span>
        </button>

        {/* Mode selector */}
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
                Nível {currentLevel} ≡
              </button>
            )}
          </div>
          <label>
            <input
              type="radio"
              name="gameMode"
              value="random"
              checked={gameMode === "random"}
              onChange={() => setGameMode("random")}
            />
            Modo Aleatório
          </label>
        </div>

        <button className={styles.tutorialButton} onClick={startTutorial}>
          <span>Tutorial</span>
        </button>
        <button
          className={styles.detailedRulesButton}
          onClick={() => setShowDetailedRules(true)}
        >
          Regras
        </button>

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
                <h2>Regras do Stop Matemático</h2>
                <p className={styles.rulesText}>
                  Este jogo adapta o formato clássico do "Stop" para um
                  desafio de raciocínio rápido e cálculo mental.
                </p>

                <h3 className={styles.rulesTitle}>
                  Sorteio do Número Mágico
                </h3>
                <p className={styles.rulesText}>
                  No início de cada rodada, o sistema gera e exibe um "Número
                  Mágico" aleatório. Este número será a base para todos os
                  cálculos daquela rodada.
                </p>

                <h3 className={styles.rulesTitle}>
                  Geração dos Desafios (Cálculos)
                </h3>
                <p className={styles.rulesText}>
                  O jogo apresenta 10 caixas de desafio. A dificuldade e o
                  tipo de cálculo (adição, subtração, multiplicação e/ou
                  divisão) nas caixas dependem do nível de dificuldade.
                </p>

                <h3 className={styles.rulesTitle}>
                  Execução dos Cálculos
                </h3>
                <p className={styles.rulesText}>
                  O jogador deve utilizar o "Número Mágico" sorteado como o
                  valor inicial para resolver cada um dos 10 desafios
                  (caixas).
                  <br />
                  <br />
                  <strong>Atenção:</strong> O valor resultante de uma caixa
                  NÃO é utilizado como entrada para a caixa seguinte. O
                  "Número Mágico" deve ser aplicado separadamente em cada um
                  dos 10 cálculos.
                </p>

                <h3 className={styles.rulesTitle}>Caixas Duplas</h3>
                <p className={styles.rulesText}>
                  Existem caixas especiais que contêm 2 cálculos distintos. O
                  jogador deve usar o "Número Mágico" para resolver ambos os
                  cálculos e, a partir deles, chegar a uma única resposta para
                  a caixa dupla.
                </p>

                <h3 className={styles.rulesTitle}>Fim da Rodada</h3>
                <p className={styles.rulesText}>
                  Ao finalizar todos os 10 desafios, o jogador deve clicar no
                  botão "Stop" para encerrar o seu tempo de jogo.
                </p>

                <h3 className={styles.rulesTitle}>
                  Pontuação e Resultado Final
                </h3>
                <p className={styles.rulesText}>
                  Ao clicar em "Stop", o jogo exibe um relatório final
                  contendo:
                  <br />• <strong>Correção:</strong> Uma verificação das
                  respostas dadas pelo jogador.
                  <br />• <strong>Pontuação:</strong> O total de acertos
                  (cálculos resolvidos corretamente).
                  <br />• <strong>Tempo:</strong> O tempo total decorrido para
                  a conclusão da <span onClick={unlockAllLevels} style={{ cursor: "default" }}>rodada.</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RegrasPage;
