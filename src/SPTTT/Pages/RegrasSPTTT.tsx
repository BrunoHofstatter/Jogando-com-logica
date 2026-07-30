import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useTutorialCompleted } from "../../Shared/Components/DynamicTutorial";
import { useDifficultyLock } from "../../Shared/Hooks/useDifficultyLock";
import { ROUTES } from "../../routes";
import styles from "../Style/RegrasSPTTT.module.css";

type GameMode = "pvp" | "ai";

function SPTTTRulesPage() {

  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState<GameMode>("ai");
  const [aiDifficulty, setAiDifficulty] = useState<1 | 2 | 3 | 4>(1);
  const [showDetailedRules, setShowDetailedRules] = useState(false);
  const [, resetTutorial] = useTutorialCompleted("spttt_v1");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { isUnlocked, unlockAll, resetProgress } = useDifficultyLock("spttt");

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
        return "Muito Fácil";
      case 2:
        return "Fácil";
      case 3:
        return "Médio";
      case 4:
        return "Difícil";
      default:
        return "Muito Fácil";
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

  const unlockAllDifficulties = () => {
    unlockAll();
    alert("Todas as dificuldades foram desbloqueadas!");
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
              <h2>
                Regras do
                <br />
                Super Jogo da Velha
              </h2>

              <h3 className={styles.rulesTitle}>Como Jogar</h3>
              <p className={styles.rulesText}>
                Início: O jogador <span className={styles.rulesStrong}>X</span> começa
                a partida.
              </p>
              <p className={styles.rulesText}>
                <span className={styles.rulesSpan}>Jogada:</span> Em seu turno, o
                jogador escolhe uma casa em um dos{" "}
                <span className={styles.rulesStrong}>tabuleiros menores</span>{" "}
                disponíveis e coloca o seu símbolo ("X" ou "O").
              </p>
              <p className={styles.rulesText}>
                <span className={styles.rulesSpan}>O próximo movimento:</span> A
                localização da casa escolhida{" "}
                <span className={styles.rulesStrong}>dentro</span> do tabuleiro
                menor determina em{" "}
                <span className={styles.rulesStrong}>
                  qual tabuleiro menor o próximo jogador deve jogar
                </span>
                .
              </p>
              <p className={styles.rulesText}>
                <span className={styles.rulesSpan}>Exemplo:</span> Se você jogar no
                quadrado central (posição 5) de um tabuleiro menor, o próximo
                jogador será enviado para o tabuleiro menor que está na posição
                central do tabuleiro principal.
              </p>

              <h3 className={styles.rulesTitle}>
                Jogando em Tabuleiros Já Decididos
              </h3>
              <p className={styles.rulesText}>
                Se o próximo jogador for direcionado para um tabuleiro menor que já
                foi <span className={styles.rulesStrong}>vencido ou empatado</span>,
                ele ganha a liberdade de jogar em{" "}
                <span className={styles.rulesStrong}>
                  qualquer outro tabuleiro menor
                </span>{" "}
                que ainda esteja em andamento (aberto).
              </p>

              <h3 className={styles.rulesTitle}>Vencendo um Tabuleiro Menor</h3>
              <p className={styles.rulesText}>
                Um tabuleiro menor é vencido quando um jogador consegue alinhar 3
                dos seus símbolos (em linha, coluna ou diagonal).
              </p>
              <p className={styles.rulesText}>
                Esse tabuleiro é então marcado no tabuleiro principal com um{" "}
                <span className={styles.rulesStrong}>X grande</span> ou{" "}
                <span className={styles.rulesStrong}>O grande</span> e não pode mais
                ser jogado.
              </p>

              <h3 className={styles.rulesTitle}>Vencendo o Jogo Geral</h3>
              <p className={styles.rulesText}>
                O objetivo é conquistar{" "}
                <span className={styles.rulesStrong}>
                  3 tabuleiros menores em sequência
                </span>{" "}
                no tabuleiro gigante.
              </p>

              <h3 className={styles.rulesTitle}>Empate</h3>
              <p className={styles.rulesText}>
                O jogo termina em empate se todos os tabuleiros menores forem
                preenchidos ou decididos e{" "}
                <span className={styles.rulesStrong}>nenhum jogador</span> conseguir
                formar 3 em linha no tabuleiro{" "}
                <span onClick={unlockAllDifficulties} style={{ cursor: "text" }}>
                  gigante.
                </span>
              </p>

              <h3 className={styles.rulesTitle}>Modos de Jogo</h3>
              <p className={styles.rulesText}>
                <span className={styles.rulesSpan}>Contra Computador:</span>{" "}
                jogue contra o computador nos níveis Muito Fácil, Fácil, Médio
                e Difícil. Ao vencer um nível, você desbloqueia o próximo.
              </p>
              <p className={styles.rulesText}>
                <span className={styles.rulesSpan}>Dois Jogadores:</span>{" "}
                duas pessoas jogam no mesmo dispositivo, alternando as jogadas
                de X e O.
              </p>
              <p className={styles.rulesText}>
                <span className={styles.rulesSpan}>Online:</span> duas pessoas
                jogam em dispositivos diferentes por meio de uma sala.
              </p>

              <h3 className={styles.rulesTitle}>Como Jogar Online</h3>
              <p className={styles.rulesText}>
                Digite seu nome e crie uma{" "}
                <span className={styles.rulesStrong}>sala privada</span> para
                receber um código de 4 caracteres. Compartilhe esse código com
                o outro jogador, que poderá usá-lo para entrar na sala.
              </p>
              <p className={styles.rulesText}>
                Você também pode entrar em uma sala privada criada por outra
                pessoa usando o código recebido.
              </p>
              <p className={styles.rulesText}>
                Para jogar com sua turma, entre com o{" "}
                <span className={styles.rulesStrong}>código da turma</span>. Lá,
                você pode criar uma sala visível para a turma ou entrar em uma
                das salas abertas, identificadas como “Sala de nome”.
              </p>
              <p className={styles.rulesText}>
                As regras do tabuleiro e da vitória são as mesmas em todos os
                modos. Depois de uma partida online, um jogador pode pedir uma
                revanche; a nova partida começa quando o outro aceitar. Se um
                jogador sair ou perder a conexão, a sala poderá ser encerrada.
              </p>

              <h3 className={styles.rulesTitle}>Tutorial e Progresso</h3>
              <p className={styles.rulesText}>
                O botão <span className={styles.rulesStrong}>Tutorial</span>{" "}
                apresenta as partes do tabuleiro e as regras principais durante
                uma partida.
              </p>
              <p className={styles.rulesText}>
                O botão{" "}
                <span className={styles.rulesStrong}>Deletar progresso</span>{" "}
                bloqueia novamente as dificuldades do computador que foram
                desbloqueadas. As regras e os modos de jogo não são apagados.
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
                Não
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SPTTTRulesPage;
