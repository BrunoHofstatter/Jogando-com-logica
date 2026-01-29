import { useState } from "react";
import styles from "../styles/regras.module.css";
import { useNavigate } from "react-router-dom";
import { useTutorialCompleted } from "../Components/DynamicTutorial";
import { useDifficultyLock } from "../../Shared/Hooks/useDifficultyLock";

type GameMode = "pvp" | "ai";

function MathWarRegras() {
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState<GameMode>("ai");
  const [aiDifficulty, setAiDifficulty] = useState<1 | 2 | 3 | 4>(1);
  const [showDetailedRules, setShowDetailedRules] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [tutorialCompleted, resetTutorial] = useTutorialCompleted("mathwar_v1");
  const { isUnlocked, unlockAll, resetProgress } = useDifficultyLock("mathwar");

  const difficultyUnlocked = isUnlocked(aiDifficulty);

  function jogarStop() {
    if (gameMode === "ai" && !difficultyUnlocked) {
      return;
    }

    if (gameMode === "ai") {
      navigate("/mathwar-ai", { state: { difficulty: aiDifficulty } });
    } else {
      navigate("/mathwarPg");
    }
  }

  const startTutorial = () => {
    resetTutorial(); // Clear the "completed" flag
    if (gameMode === "ai") {
      // If locked, maybe default to 1? Or let them try. Tutorial usually force guided.
      navigate("/mathwar-ai", { state: { difficulty: aiDifficulty } });
    } else {
      navigate("/mathwarPg");
    }
  };

  const resetGameProgress = () => {
    resetProgress();
    setAiDifficulty(1);
    setShowResetConfirm(false);
  };

  const handleCheat = () => {
    unlockAll();
    alert("Todas as dificuldades foram desbloqueadas!");
  };

  const toggleDifficulty = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setAiDifficulty((prev) => (prev === 4 ? 1 : (prev + 1) as 1 | 2 | 3 | 4));
  };

  const getDifficultyName = (diff: number) => {
    switch (diff) {
      case 1: return "Muito Fácil";
      case 2: return "Fácil";
      case 3: return "Médio";
      case 4: return "Difícil";
      default: return "";
    }
  };

  const getTooltipText = () => {
    const prevDiffName = getDifficultyName(aiDifficulty - 1);
    const currDiffName = getDifficultyName(aiDifficulty);
    return `Ganhe da dificuldade ${prevDiffName} para desbloquear ${currDiffName}`;
  };

  return (
    <div className={styles.regrasPage}>
      {/* Left Side - Rules */}

      <div className={styles.boxRegras}>
        <div className={styles.gameTitle}>Guerra Matemática</div>
        <img
          src={`${import.meta.env.BASE_URL}mathwarPreview.png`}
          className={styles.preview}
        />
      </div>

      {/* Right Side - Game Controls */}
      <div className={styles.botoes}>
        <button
          className={`${styles.button} ${gameMode === 'ai' && !difficultyUnlocked ? styles.buttonDisabled : ''}`}
          onClick={jogarStop}
          disabled={gameMode === 'ai' && !difficultyUnlocked}
        >
          <span>Jogar</span>
        </button>

        {/* Mode selector */}
        <div className={styles['mode-select-rules']}>
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
                className={`${styles.difficultyButton} ${!difficultyUnlocked ? styles.locked : ''}`}
                onClick={toggleDifficulty}
              >
                {!difficultyUnlocked && <span>🔒 </span>}
                Nível: {getDifficultyName(aiDifficulty)}
                {!difficultyUnlocked && (
                  <div className={styles.difficultyTooltip}>
                    {getTooltipText()}
                  </div>
                )}
              </button>
            )}
          </div>
          <label>
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

        <button className={styles.tutorialButton} onClick={startTutorial}>
          <span>Tutorial</span>
        </button>
        <button
          className={styles.detailedRulesButton}
          onClick={() => setShowDetailedRules(true)}
        >
          Regras
        </button>
      </div>

      {
        showDetailedRules && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowDetailedRules(false)}
          >
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.resetProgressButton}
                onClick={() => setShowResetConfirm(true)}
              >
                Deletar progresso
              </button>

              <button
                className={styles.closeButton}
                onClick={() => setShowDetailedRules(false)}
              >
                X
              </button>

              <div className={styles.detailedRules}>
                <h2>Regras Guerra Matemática</h2>

                <h3 className={styles.rulesTitle}>Posição Inicial</h3>
                <div className={styles.boardDiv}>
                  <img
                    src={`${import.meta.env.BASE_URL}mathwarBoard.png`}
                    className={styles.boardImage}
                  />
                  <ul className={styles.legend}>
                    <li>
                      <img
                        src={`${import.meta.env.BASE_URL}mathwarNormal.png`}
                        className={styles.pieceImage}
                      />{" "}
                      -{">"} Peça Soma redonda
                    </li>
                    <li>
                      <img
                        src={`${import.meta.env.BASE_URL}mathwarSquare.png`}
                        className={styles.pieceImage}
                      />{" "}
                      -{">"} Peça Soma quadrada
                    </li>
                    <li>
                      <img
                        src={`${import.meta.env.BASE_URL}mathwarCaptain.png`}
                        className={styles.pieceImage}
                      />{" "}
                      -{">"} Capitão - pode ser Soma quadrada ou redonda
                    </li>
                  </ul>
                </div>

                <h3 className={styles.rulesTitle}>Objetivo</h3>
                <p className={styles.rulesText}>
                  O objetivo do jogo é capturar a peça{" "}
                  <span className={styles.rulesStrong}>Capitão</span> do oponente.
                </p>
                <p className={styles.rulesText}>
                  Se o Capitão for capturado, o jogador que o capturou vence imediatamente.
                </p>

                <h3 className={styles.rulesTitle}>Preparação e Peças</h3>

                <p className={styles.rulesText}>
                  Cada jogador começa com 10 peças divididas em dois tipos: 8
                  peças Soma redondas e 2 peças Soma quadradas.
                </p>

                <p className={styles.rulesSpan}>
                  Valores das Peças (Permanentes)
                </p>
                <p className={styles.rulesText}>
                  Cada peça recebe permanentemente um valor numérico de +2 a +4,
                  utilizado no cálculo da Energia.
                </p>
                <p className={styles.rulesText}>
                  Distribuição dos valores por jogador:
                </p>
                <ul>
                  <li>
                    <span className={styles.rulesStrong}>4 peças</span> com valor
                    +2
                  </li>
                  <li>
                    <span className={styles.rulesStrong}>3 peças</span> com valor
                    +3
                  </li>
                  <li>
                    <span className={styles.rulesStrong}>3 peças</span> com valor
                    +4
                  </li>
                </ul>

                <p className={styles.rulesSpan}>O Capitão</p>
                <p className={styles.rulesText}>
                  Uma peça é selecionada{" "}
                  <span className={styles.rulesStrong}>aleatoriamente</span> entre
                  as peças da fileira de trás para ser o Capitão.
                </p>
                <p className={styles.rulesText}>
                  O Capitão é marcado com uma cor de destaque e uma marca amarela.
                </p>
                <p className={styles.rulesText}>
                  Tanto as peças Soma quanto as peças Quadradas podem ser
                  Capitães.
                </p>

                <h3 className={styles.rulesTitle}>Turnos e Cálculo de Energia</h3>

                <p className={styles.rulesSpan}>Ordem dos Turnos</p>
                <p className={styles.rulesText}>
                  Os jogadores jogam em turnos alternados. Em cada turno, o
                  jogador deve mover{" "}
                  <span className={styles.rulesStrong}>exatamente uma peça</span>.
                </p>

                <p className={styles.rulesSpan}>Rolagem de Dados (Automática)</p>
                <p className={styles.rulesText}>
                  O dado é rolado a cada <span className={styles.rulesStrong}>3 turnos</span>.
                </p>
                <p className={styles.rulesText}>
                  no turno que rola o resultado dos <span className={styles.rulesStrong}>
                    2 dados de 5 faces (2d5)
                  </span> gera um número de 2 a 10.
                </p>

                <p className={styles.rulesSpan}>Cálculo da Energia</p>
                <p className={styles.rulesText}>
                  A Energia disponível para o turno é calculada com a peça
                  escolhida e o resultado dos dados.
                </p>
                <p className={styles.rulesText}>
                  Energia Total = Valor da peça (2–4) + Valor dos dados.
                </p>
                <blockquote className={styles.rulesText}>
                  Exemplo: Dados = 7, Peça = +4. Energia Total = 11.
                </blockquote>

                <p className={styles.rulesSpan}>Gasto de Energia</p>
                <p className={styles.rulesText}>
                  A Energia é gasta para mover e capturar:
                </p>
                <ul>
                  <li>
                    <span className={styles.rulesStrong}>Movimento:</span> Cada
                    passo = 2 de Energia.
                  </li>
                  <li>
                    <span className={styles.rulesStrong}>Captura:</span> Entrar em
                    casa ocupada por peça inimiga = +2 de Energia (além do custo
                    do passo).
                  </li>
                </ul>
                <p className={styles.rulesText}>
                  ⚠️ O <span className={styles.rulesStrong}>Capitão</span> gasta o dobro de energia para mover e capturar.
                </p>

                <p className={styles.rulesText}>
                  ⚠️ A Energia não acumula para o próximo turno.
                </p>
                <p className={styles.rulesText}>
                  ⚠️ Após realizar uma captura, o turno do jogador termina
                  imediatamente.
                </p>

                <h3 className={styles.rulesTitle}>Movimento das Peças</h3>

                <p className={styles.rulesText}>
                  Nenhuma peça pode pular sobre outras peças.
                </p>
                <p className={styles.rulesText}>
                  Nenhuma peça pode ocupar uma casa já ocupada por uma peça
                  aliada.
                </p>

                <p className={styles.rulesSpan}>Peça Soma redonda </p>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Movimento:</span> Move-se
                  apenas ortogonalmente (horizontalmente ou verticalmente). Não
                  pode se mover na diagonal.
                </p>

                <p className={styles.rulesSpan}>Peça Soma quadrada </p>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Movimento:</span> Move-se
                  apenas diagonalmente. Não pode se mover ortogonalmente.
                </p>

                <h3 className={styles.rulesTitle}>Fim de Jogo</h3>
                <p className={styles.rulesText}>
                  A única forma de vencer é{" "}
                  <span className={styles.rulesStrong}>
                    capturar o Capitão <span className={styles.rulesStrong} onClick={handleCheat} style={{ cursor: 'text' }}>inimigo</span>
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        )
      }

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmText}>Tem certeza?</div>
            <div className={styles.confirmText} style={{ fontSize: "1.5vw" }}>Isso apagará todo o seu progresso no jogo.</div>
            <div className={styles.confirmButtons}>
              <button onClick={resetGameProgress} className={`${styles.confirmBtn} ${styles.yesBtn}`}>Sim</button>
              <button onClick={() => setShowResetConfirm(false)} className={`${styles.confirmBtn} ${styles.noBtn}`}>Não</button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}

export default MathWarRegras;
