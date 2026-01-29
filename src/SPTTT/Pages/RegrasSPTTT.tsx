import { useState } from "react";
import styles from "../Style/RegrasSPTTT.module.css";
import { useNavigate } from "react-router-dom";
import { useTutorialCompleted } from "../Components/DynamicTutorial";
import { useDifficultyLock } from "../../Shared/Hooks/useDifficultyLock";

type GameMode = "pvp" | "ai";

function JogoStop() {
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState<GameMode>("ai");
  const [aiDifficulty, setAiDifficulty] = useState<1 | 2 | 3 | 4>(1);
  const [showDetailedRules, setShowDetailedRules] = useState(false);
  const [tutorialCompleted, resetTutorial] =
    useTutorialCompleted("spttt_v1");

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { isUnlocked, unlockNext, resetProgress, unlockAll } = useDifficultyLock("spttt");

  function startGame() {
    if (gameMode === "ai") {
      if (!isUnlocked(aiDifficulty)) return;
      navigate("/spttt-ai", { state: { winCondition: "line", difficulty: aiDifficulty } });
    } else {
      navigate("/jogospttt", { state: { winCondition: "line" } });
    }
  }

  const startTutorial = () => {
    resetTutorial(); // Clear the "completed" flag
    if (gameMode === "ai") {
      navigate("/spttt-ai", { state: { winCondition: "line", difficulty: aiDifficulty } });
    } else {
      navigate("/jogospttt", { state: { winCondition: "line" } });
    }
  };

  const toggleDifficulty = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setAiDifficulty((prev) => {
      const next = prev === 4 ? 1 : (prev + 1 as 1 | 2 | 3 | 4);
      return next;
    });
  };

  const difficultyUnlocked = isUnlocked(aiDifficulty);

  const getDifficultyName = (level: number) => {
    switch (level) {
      case 1: return "Muito Fácil";
      case 2: return "Fácil";
      case 3: return "Médio";
      case 4: return "Difícil";
      default: return "Muito Fácil";
    }
  };

  const getTooltipText = () => {
    const prevLevel = aiDifficulty - 1;
    const prevName = getDifficultyName(prevLevel);
    const currentName = getDifficultyName(aiDifficulty);
    return `Ganhe da dificuldade ${prevName} para desbloquear ${currentName}`;
  };

  const handleResetProgress = () => {
    resetProgress();
    setAiDifficulty(1);
    setShowResetConfirm(false);
  };

  return (
    <div className={styles.regrasPage}>
      {/* Left Side - Rules */}

      <div className={styles.boxRegras}>
        <div className={styles.gameTitle}>Super Jogo da Velha</div>
        <img
          src={`${import.meta.env.BASE_URL}sptttPreview.png`}
          className={styles.preview}
        />
      </div>

      {/* Right Side - Game Controls */}
      <div className={styles.botoes}>
        <button
          className={`${styles.button} ${gameMode === "ai" && !difficultyUnlocked ? styles.playButtonDisabled : ''}`}
          onClick={startGame}
          disabled={gameMode === "ai" && !difficultyUnlocked}
        >
          <span>Jogar</span>
        </button>


        {/* Game mode selector */}
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

      {showDetailedRules && (
        <div className={styles.modalOverlay} onClick={() => setShowDetailedRules(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
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
              <p className={styles.rulesText}>Início: O jogador <strong>X</strong> começa a partida.</p>
              <p className={styles.rulesText}>Jogada: Em seu turno, o jogador escolhe uma casa em um dos <strong>tabuleiros menores</strong> disponíveis e coloca o seu símbolo ("X" ou "O").</p>
              <p className={styles.rulesText}>Direcionamento o próximo movimento: A localização da casa escolhida <em>dentro</em> do tabuleiro menor determina em <em>qual tabuleiro menor o próximo jogador deve jogar</em>.</p>
              <p className={styles.rulesText}>Exemplo:Se você jogar no quadrado central (posição 5) de um tabuleiro menor, o próximo jogador será enviado para o tabuleiro menor que está na posição central do tabuleiro principal.</p>



              <h3 className={styles.rulesTitle}>Jogando em Tabuleiros Já Decididos</h3>
              <p className={styles.rulesText}>Se o próximo jogador for direcionado para um tabuleiro menor que já foi <strong>vencido ou empatado</strong>, ele ganha a liberdade de jogar em <strong>qualquer outro tabuleiro menor</strong> que ainda esteja em andamento (aberto).</p>



              <h3 className={styles.rulesTitle}>Vencendo um Tabuleiro Menor</h3>
              <p className={styles.rulesText}>Um tabuleiro menor é vencido quando um jogador consegue alinhar 3 dos seus símbolos (em linha, coluna ou diagonal).</p>
              <p className={styles.rulesText}>Esse tabuleiro é então marcado no tabuleiro principal com um <strong>X grande</strong> ou <strong>O grande</strong> e não pode mais ser jogado.</p>



              <h3 className={styles.rulesTitle}>Vencendo o Jogo Geral</h3>
              <p className={styles.rulesText}>Existem <strong>duas maneiras</strong> de vencer a partida. O jogo termina imediatamente quando um jogador atinge uma delas:</p>


              <h4 className={styles.winTitle}>Vitória Estratégica (Três em Linha)</h4>
              <p className={styles.winText}>Conquistar <strong>3 tabuleiros menores em sequência</strong> no tabuleiro gigante (em linha, coluna ou diagonal).</p>



              <h4 className={styles.winTitle}>Vitória por Pontos (Maioria)</h4>
              <p className={styles.winText}>Conquistar a <strong>maior quantidade de tabuleiros menores</strong>. Este é o critério de desempate final se ninguém conseguir uma vitória estratégica. O jogador com mais tabuleiros conquistados ao final da partida é declarado vencedor.</p>




              <h3 className={styles.rulesTitle}>Empate</h3>
              <p className={styles.rulesText}>O jogo termina em empate se todos os tabuleiros menores forem preenchidos ou decididos e <strong>nenhum jogador</strong> tiver conseguido uma <strong>Vitória Estratégica (três em linha)</strong>. Em caso de empate na quantidade de tabuleiros, a partida é considerada <span onClick={() => { unlockAll(); alert("Todas as dificuldades foram desbloqueadas!"); }}>empatada</span>.</p>

            </div>
          </div>
        </div>
      )}

      {/* Reset Progress Confirmation Modal */}
      {showResetConfirm && (
        <div className={styles.confirmModalOverlay}>
          <div className={styles.confirmModalContent}>
            <div className={styles.confirmText}>Tem certeza?</div>
            <div className={styles.confirmText} style={{ fontSize: "1.5vw" }}>Isso apagará todo o seu progresso no jogo.</div>
            <div className={styles.confirmButtons}>
              <button onClick={handleResetProgress} className={`${styles.confirmBtn} ${styles.yesBtn}`}>Sim</button>
              <button onClick={() => setShowResetConfirm(false)} className={`${styles.confirmBtn} ${styles.noBtn}`}>Não</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default JogoStop;