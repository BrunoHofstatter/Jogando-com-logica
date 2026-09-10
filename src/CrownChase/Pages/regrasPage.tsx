import { useState } from "react";
import styles from "../styles/regras.module.css";
import { useNavigate } from "react-router-dom";
import { useTutorialCompleted } from "../../Shared/Components/DynamicTutorial";
import { useDifficultyLock } from "../../Shared/Hooks/useDifficultyLock";
import { ROUTES } from "../../routes";
import { CrownChasePieceVisual } from "../Components/piece";
import type { PieceType } from "../Logic/v2";


type GameMode = "pvp" | "ai";

const RULE_PIECES: ReadonlyArray<{ type: PieceType; label: string }> = [
  { type: "jumper", label: "Saltador" },
  { type: "killer", label: "Assassino" },
  { type: "king", label: "Rei" },
];

function CrownChaseRegras() {

  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState<GameMode>("ai");
  const [aiDifficulty, setAiDifficulty] = useState<1 | 2 | 3 | 4>(1);
  const [showDetailedRules, setShowDetailedRules] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [, resetTutorial] = useTutorialCompleted("crownchase_v1");

  const { isUnlocked, unlockAll, resetProgress } =
    useDifficultyLock("crownchase");

  const difficultyUnlocked = isUnlocked(aiDifficulty);

  function jogarStop() {
    if (gameMode === "ai" && !difficultyUnlocked) {
      return;
    }

    if (gameMode === "ai") {
      navigate(ROUTES.CROWN_CHASE_AI, { state: { difficulty: aiDifficulty } });
    } else {
      navigate(ROUTES.CROWN_CHASE_GAME);
    }
  }

  const goToOnlineLobby = () => {
    navigate(ROUTES.CROWN_CHASE_MP_LOBBY);
  };

  const startTutorial = () => {
    resetTutorial(); // Clear the "completed" flag
    if (gameMode === "ai") {
      // If selected difficulty is locked, default to 1 for tutorial or check logic
      // But typically tutorial forces its own flow. We'll just pass current.
      navigate(ROUTES.CROWN_CHASE_AI, { state: { difficulty: aiDifficulty } });
    } else {
      navigate(ROUTES.CROWN_CHASE_GAME);
    }
  };

  const toggleDifficulty = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setAiDifficulty((prev) => {
      if (prev === 1) return 2;
      if (prev === 2) return 3;
      if (prev === 3) return 4;
      return 1;
    });
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

  const handleCheat = () => {
    unlockAll();
    alert("Todas as dificuladades foram desbloqueadas");
  };

  const handleResetConfirm = () => {
    resetProgress();
    setShowResetConfirm(false);
    // Optional: Reset local state if needed (e.g. set difficulty back to 1)
    setAiDifficulty(1);
  };

  return (
    <div className={styles.regrasPage}>
      {/* Left Side - Rules */}

      <div className={styles.boxRegras}>
        <div className={styles.gameTitle}>Caça Coroa</div>
        <img
          src={`${import.meta.env.BASE_URL}crownchasePreview.png`}
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
                <h2>Regras Caça Coroa</h2>

                <h3 className={styles.rulesTitle}>Posição Inicial</h3>
                <div className={styles.boardDiv}>
                  <img
                    src={`${import.meta.env.BASE_URL}crownchaseBoard.png`}
                    className={styles.boardImage}
                  />
                  <ul className={styles.legend}>
                    {RULE_PIECES.map(({ type, label }) => (
                      <li key={type}>
                        <div className={styles.pieceImage}>
                          <CrownChasePieceVisual
                            piece={{ type, owner: 0 }}
                            fillContainer
                          />
                        </div>
                        -{">"} {label}
                      </li>
                    ))}
                  </ul>
                </div>

                <h3 className={styles.rulesTitle}>Início da Partida</h3>
                <p className={styles.rulesText}>
                  O jogo "Caça Coroa" é disputado em um tabuleiro 5x5.
                </p>
                <p className={styles.rulesText}>
                  Um jogador controla o Rei no canto inferior esquerdo. O outro
                  jogador controla o Rei no canto superior direito.
                </p>
                <p className={styles.rulesText}>
                  Cada jogador começa com{" "}
                  <span className={styles.rulesStrong}>
                    1 Rei, 2 Assassinos e 3 Saltadores
                  </span>
                  . O jogador azul começa a partida.
                </p>

                <h3 className={styles.rulesTitle}>Ordem dos Turnos</h3>
                <p className={styles.rulesText}>
                  Os jogadores jogam em turnos alternados.
                </p>
                <p className={styles.rulesText}>
                  Em cada turno, o jogador deve mover{" "}
                  <span className={styles.rulesStrong}>
                    exatamente uma peça
                  </span>
                  .
                </p>
                <p className={styles.rulesText}>
                  Se um jogador não tiver nenhum movimento possível, sua vez é
                  pulada automaticamente.
                </p>
                <p className={styles.rulesText}>
                  Se nenhum dos dois jogadores puder se mover, a partida termina
                  em empate.
                </p>

                <h3 className={styles.rulesTitle}>Modos de Jogo</h3>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Contra Computador:</span>{" "}
                  jogue nos níveis Muito Fácil, Fácil, Médio e Difícil. Vença um
                  nível para desbloquear o próximo.
                </p>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Dois Jogadores:</span>{" "}
                  duas pessoas jogam no mesmo dispositivo.
                </p>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Online:</span> jogue à
                  distância criando uma sala privada ou entrando com um código
                  de sala. Também é possível entrar em uma turma com o código
                  fornecido pelo professor e criar ou escolher uma sala aberta.
                </p>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Tutorial:</span> acompanhe
                  uma explicação interativa das peças e das informações do
                  tabuleiro.
                </p>

                <h3 className={styles.rulesTitle}> Rei </h3>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Movimento:</span> Não pode
                  se mover.
                </p>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Captura:</span> Se for
                  capturado, o jogo acaba imediatamente.
                </p>

                <h3 className={styles.rulesTitle}>
                  Assassino
                </h3>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Movimento:</span> Move{" "}
                  <span className={styles.rulesStrong}>1 casa</span> em qualquer
                  direção (horizontal, vertical ou diagonal).
                </p>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Captura:</span> Captura
                  entrando na casa ocupada por uma peça inimiga.
                </p>
                <p className={styles.rulesText}>
                  Pode capturar qualquer peça,{" "}
                  <span className={styles.rulesStrong}>inclusive o Rei</span>.
                </p>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Restrição:</span> Não pode
                  pular sobre outras peças.
                </p>

                <h3 className={styles.rulesTitle}>
                  Saltador
                </h3>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Movimento Básico:</span>{" "}
                  Move <span className={styles.rulesStrong}>1 casa</span> em
                  linha reta (para cima, para baixo ou para os lados) para uma
                  casa vazia.
                </p>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Salto:</span> Pula{" "}
                  <span className={styles.rulesStrong}>exatamente 1 peça</span>{" "}
                  adjacente (aliada ou inimiga) em linha reta, aterrissando duas
                  casas adiante.
                </p>
                <p className={styles.rulesText}>
                  A peça que foi pulada permanece no tabuleiro e não é
                  capturada.
                </p>
                <p className={styles.rulesText}>
                  A casa de destino no salto deve estar{" "}
                  <span className={styles.rulesStrong}>
                    vazia ou conter o Rei inimigo
                  </span>
                  .
                </p>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Captura:</span> Saltadores{" "}
                  <span className={styles.rulesStrong}>
                    só podem capturar o Rei
                  </span>{" "}
                  e não podem capturar outras peças.
                </p>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Restrição:</span> Não pode
                  saltar na diagonal nem realizar vários saltos no mesmo turno.
                </p>

                <h3 className={styles.rulesTitle}>
                  Regras de Movimento Gerais
                </h3>
                <p className={styles.rulesText}>
                  Nenhuma peça pode ocupar uma casa já ocupada por uma peça
                  aliada.
                </p>
                <p className={styles.rulesText}>
                  Apenas os Saltadores podem saltar sobre peças.
                </p>
                <p className={styles.rulesText}>
                  Um movimento termina quando a peça chega ao destino permitido.
                </p>

                <h3 className={styles.rulesTitle}>Fim de Jogo</h3>
                <p className={styles.rulesText}>
                  O jogo acaba imediatamente quando um Rei é capturado.
                </p>
                <p className={styles.rulesText}>
                  O jogador que capturar o Rei adversário é o <span onClick={handleCheat} style={{ cursor: 'text' }}>vencedor</span>.
                </p>
                <p className={styles.rulesText}>
                  Se os dois jogadores ficarem sem movimentos possíveis, a
                  partida termina em empate.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className={styles.modalOverlay}>
            <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.confirmText}>
                Tem certeza que deseja deletar todo o progresso?
              </div>
              <div className={styles.confirmButtons}>
                <button
                  className={`${styles.confirmBtn} ${styles.yesBtn}`}
                  onClick={handleResetConfirm}
                >
                  Sim
                </button>
                <button
                  className={`${styles.confirmBtn} ${styles.noBtn}`}
                  onClick={() => setShowResetConfirm(false)}
                >
                  Não
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CrownChaseRegras;
