import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useTutorialCompleted } from "../../Shared/Components/DynamicTutorial";
import { useDifficultyLock } from "../../Shared/Hooks/useDifficultyLock";
import { ROUTES } from "../../routes";
import styles from "../Style/RegrasSPTTT.module.css";

type GameMode = "pvp" | "ai";

function SPTTTRulesPage() {
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

  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState<GameMode>("ai");
  const [aiDifficulty, setAiDifficulty] = useState<1 | 2 | 3 | 4>(1);
  const [showDetailedRules, setShowDetailedRules] = useState(false);
  const [, resetTutorial] = useTutorialCompleted("spttt_v1");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { isUnlocked, resetProgress } = useDifficultyLock("spttt");

  function startGame() {
    if (gameMode === "ai") {
      if (!isUnlocked(aiDifficulty)) {
        return;
      }

      navigate(ROUTES.SPTTT_AI, { state: { difficulty: aiDifficulty } });
      return;
    }

    navigate(ROUTES.SPTTT_GAME);
  }

  const goToOnlineLobby = () => {
    navigate(ROUTES.SPTTT_MP_LOBBY);
  };

  const startTutorial = () => {
    resetTutorial();

    if (gameMode === "ai") {
      navigate(ROUTES.SPTTT_AI, { state: { difficulty: aiDifficulty } });
      return;
    }

    navigate(ROUTES.SPTTT_GAME);
  };

  const toggleDifficulty = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setAiDifficulty((previousDifficulty) =>
      previousDifficulty === 4 ? 1 : ((previousDifficulty + 1) as 1 | 2 | 3 | 4),
    );
  };

  const difficultyUnlocked = isUnlocked(aiDifficulty);

  const getDifficultyName = (level: number) => {
    switch (level) {
      case 1:
        return "Muito FÃ¡cil";
      case 2:
        return "FÃ¡cil";
      case 3:
        return "MÃ©dio";
      case 4:
        return "DifÃ­cil";
      default:
        return "Muito FÃ¡cil";
    }
  };

  const getTooltipText = () => {
    const previousLevel = aiDifficulty - 1;
    const previousName = getDifficultyName(previousLevel);
    const currentName = getDifficultyName(aiDifficulty);
    return `Ganhe da dificuldade ${previousName} para desbloquear ${currentName}`;
  };

  const handleResetProgress = () => {
    resetProgress();
    setAiDifficulty(1);
    setShowResetConfirm(false);
  };

  return (
    <div className={styles.regrasPage}>
      <div className={styles.boxRegras}>
        <div className={styles.gameTitle}>Super Jogo da Velha</div>
        <img
          src={`${import.meta.env.BASE_URL}sptttPreview.png`}
          className={styles.preview}
        />
      </div>

      <div className={styles.botoes}>
        <button
          className={`${styles.button} ${
            gameMode === "ai" && !difficultyUnlocked ? styles.buttonDisabled : ""
          }`}
          onClick={startGame}
          disabled={gameMode === "ai" && !difficultyUnlocked}
        >
          <span>Jogar</span>
        </button>

        <div className={styles["mode-select-rules"]}>
          <div className={styles.contraComputador}>
            <label>
              <input
                type="radio"
                name="gameMode"
                value="ai"
                checked={gameMode === "ai"}
                onChange={() => setGameMode("ai")}
              />
              Contra Computador
            </label>
            {gameMode === "ai" && (
              <button
                className={`${styles.difficultyButton} ${
                  !difficultyUnlocked ? styles.locked : ""
                }`}
                onClick={toggleDifficulty}
              >
                {!difficultyUnlocked && <span>ðŸ”’ </span>}
                NÃ­vel: {getDifficultyName(aiDifficulty)}
                {!difficultyUnlocked && (
                  <div className={styles.difficultyTooltip}>
                    {getTooltipText()}
                  </div>
                )}
              </button>
            )}
          </div>
          <label className={styles.contraJogador}>
            <input
              type="radio"
              name="gameMode"
              value="pvp"
              checked={gameMode === "pvp"}
              onChange={() => setGameMode("pvp")}
            />
            Dois Jogadores
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
      </div>

      {showDetailedRules && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowDetailedRules(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className={styles.closeButton}
              onClick={() => setShowDetailedRules(false)}
            >
              X
            </button>
            <button
              className={styles.resetProgressButton}
              onClick={() => setShowResetConfirm(true)}
            >
              Deletar progresso
            </button>

            <div className={styles.detailedRules}>
              <h2>Regras do Super Jogo da Velha</h2>

              <h3 className={styles.rulesTitle}>Como Jogar</h3>
              <p className={styles.rulesText}>
                InÃ­cio: O jogador <span className={styles.rulesStrong}>X</span> comeÃ§a
                a partida.
              </p>
              <p className={styles.rulesText}>
                <span className={styles.rulesSpan}>Jogada:</span> Em seu turno, o
                jogador escolhe uma casa em um dos{" "}
                <span className={styles.rulesStrong}>tabuleiros menores</span>{" "}
                disponÃ­veis e coloca o seu sÃ­mbolo ("X" ou "O").
              </p>
              <p className={styles.rulesText}>
                <span className={styles.rulesSpan}>O prÃ³ximo movimento:</span> A
                localizaÃ§Ã£o da casa escolhida{" "}
                <span className={styles.rulesStrong}>dentro</span> do tabuleiro
                menor determina em{" "}
                <span className={styles.rulesStrong}>
                  qual tabuleiro menor o prÃ³ximo jogador deve jogar
                </span>
                .
              </p>
              <p className={styles.rulesText}>
                <span className={styles.rulesSpan}>Exemplo:</span> Se vocÃª jogar no
                quadrado central (posiÃ§Ã£o 5) de um tabuleiro menor, o prÃ³ximo
                jogador serÃ¡ enviado para o tabuleiro menor que estÃ¡ na posiÃ§Ã£o
                central do tabuleiro principal.
              </p>

              <h3 className={styles.rulesTitle}>
                Jogando em Tabuleiros JÃ¡ Decididos
              </h3>
              <p className={styles.rulesText}>
                Se o prÃ³ximo jogador for direcionado para um tabuleiro menor que jÃ¡
                foi <span className={styles.rulesStrong}>vencido ou empatado</span>,
                ele ganha a liberdade de jogar em{" "}
                <span className={styles.rulesStrong}>
                  qualquer outro tabuleiro menor
                </span>{" "}
                que ainda esteja em andamento (aberto).
              </p>

              <h3 className={styles.rulesTitle}>Vencendo um Tabuleiro Menor</h3>
              <p className={styles.rulesText}>
                Um tabuleiro menor Ã© vencido quando um jogador consegue alinhar 3
                dos seus sÃ­mbolos (em linha, coluna ou diagonal).
              </p>
              <p className={styles.rulesText}>
                Esse tabuleiro Ã© entÃ£o marcado no tabuleiro principal com um{" "}
                <span className={styles.rulesStrong}>X grande</span> ou{" "}
                <span className={styles.rulesStrong}>O grande</span> e nÃ£o pode mais
                ser jogado.
              </p>

              <h3 className={styles.rulesTitle}>Vencendo o Jogo Geral</h3>
              <p className={styles.rulesText}>
                O objetivo Ã© conquistar{" "}
                <span className={styles.rulesStrong}>
                  3 tabuleiros menores em sequÃªncia
                </span>{" "}
                no tabuleiro gigante.
              </p>

              <h4 className={styles.winTitle}>VitÃ³ria por TrÃªs em Linha</h4>
              <p className={styles.winText}>
                Conquistar{" "}
                <span className={styles.rulesStrong}>
                  3 tabuleiros menores em sequÃªncia
                </span>{" "}
                no tabuleiro gigante (em linha, coluna ou diagonal).
              </p>

              <h3 className={styles.rulesTitle}>Empate</h3>
              <p className={styles.rulesText}>
                O jogo termina em empate se todos os tabuleiros menores forem
                preenchidos ou decididos e{" "}
                <span className={styles.rulesStrong}>nenhum jogador</span> conseguir
                formar 3 em linha no tabuleiro gigante.
              </p>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className={styles.modalOverlay}>
          <div
            className={styles.confirmModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.confirmText}>
              Tem certeza que deseja deletar todo o progresso?
            </div>
            <div className={styles.confirmButtons}>
              <button
                className={`${styles.confirmBtn} ${styles.yesBtn}`}
                onClick={handleResetProgress}
              >
                Sim
              </button>
              <button
                className={`${styles.confirmBtn} ${styles.noBtn}`}
                onClick={() => setShowResetConfirm(false)}
              >
                NÃ£o
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SPTTTRulesPage;
