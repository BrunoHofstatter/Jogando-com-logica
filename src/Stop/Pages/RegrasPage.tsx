import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTutorialCompleted } from "../../Shared/Components/DynamicTutorial";
import styles from "../styles/Regras.module.css";
import { getCurrentLevelId, levels, saveLevelStars } from "../Logic/levelsConfig";
import { ROUTES } from "../../routes";


type GameMode = "random" | "levels";

/**
 * Rules and mode selection page for Stop Matemático
 */
function RegrasPage() {

  const navigate = useNavigate();
  const [showDetailedRules, setShowDetailedRules] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>("levels");
  const [, resetTutorial] = useTutorialCompleted("stop_v1");

  const currentLevel = getCurrentLevelId();

  function jogarStop() {
    if (gameMode === "random") {
      navigate(ROUTES.STOP_GAME, { state: { mode: "random" } });
    } else {
      navigate(ROUTES.STOP_GAME, { state: { mode: "level", level: currentLevel } });
    }
  }

  const startTutorial = () => {
    resetTutorial(); // Clear the "completed" flag
    // Tutorial always uses fixed difficulty (usually d1)
    navigate(ROUTES.STOP_GAME, { state: { mode: "tutorial_fixed", difficulty: "d1" } });
  };

  const goToLevelsMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(ROUTES.STOP_LEVELS);
  };

  const goToOnlineLobby = () => {
    navigate(ROUTES.STOP_MP_LOBBY);
  };

  const unlockAllLevels = () => {
    levels.forEach((level) => {
      saveLevelStars(level.id, 3);
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
                  Cada rodada apresenta uma grade de caixas de desafio. A
                  quantidade de caixas e os tipos de cálculo — adição,
                  subtração, multiplicação e divisão — variam conforme o modo
                  e o nível da partida.
                </p>

                <h3 className={styles.rulesTitle}>
                  Execução dos Cálculos
                </h3>
                <p className={styles.rulesText}>
                  O jogador deve utilizar o "Número Mágico" sorteado como o
                  valor inicial para resolver cada caixa.
                  <br />
                  <br />
                  <strong>Atenção:</strong> Cada caixa começa novamente com o
                  "Número Mágico" original. O resultado de uma caixa não é
                  usado na caixa seguinte.
                </p>

                <h3 className={styles.rulesTitle}>Caixas Duplas</h3>
                <p className={styles.rulesText}>
                  Algumas caixas possuem duas operações em sequência. A
                  primeira operação é aplicada ao "Número Mágico" e a segunda
                  é aplicada ao resultado da primeira. Digite apenas a resposta
                  final da caixa dupla.
                </p>

                <h3 className={styles.rulesTitle}>Modos de Jogo</h3>
                <p className={styles.rulesText}>
                  <strong>Modo Aleatório:</strong> Cria uma rodada rápida com
                  dificuldade escolhida automaticamente.
                  <br />• <strong>Modo Níveis:</strong> Possui 10 níveis com
                  diferentes operações, quantidades de caixas e metas.
                </p>

                <h3 className={styles.rulesTitle}>Fim da Rodada</h3>
                <p className={styles.rulesText}>
                  O botão "STOP" pode ser pressionado a qualquer momento,
                  mesmo que ainda existam caixas sem resposta. No computador,
                  pressionar "Enter" no último campo também encerra a rodada
                  automaticamente.
                </p>

                <h3 className={styles.rulesTitle}>
                  Pontuação e Resultado Final
                </h3>
                <p className={styles.rulesText}>
                  Ao encerrar a rodada, o jogo confere as respostas e exibe:
                  <br />• <strong>Correção:</strong> Uma verificação das
                  respostas dadas pelo jogador.
                  <br />• <strong>Acertos:</strong> O total de caixas resolvidas
                  corretamente. Uma caixa dupla vale um acerto.
                  <br />• <strong>Tempo:</strong> O tempo total decorrido para
                  a conclusão da <span onClick={unlockAllLevels} style={{ cursor: "text" }}>rodada.</span>
                </p>

                <h3 className={styles.rulesTitle}>Estrelas e Progressão</h3>
                <p className={styles.rulesText}>
                  No Modo Níveis, as estrelas são concedidas de acordo com o
                  tempo e a quantidade de acertos. Uma estrela conclui o nível,
                  mas são necessárias pelo menos duas estrelas para desbloquear
                  o próximo.
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
