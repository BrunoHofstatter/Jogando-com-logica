import {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "../../routes";
import CalculationCell from "../Components/CalculationCell";
import VirtualKeyboard from "../Components/VirtualKeyboard";
import {
  leaveStopMultiplayerRoom,
  useStopMultiplayer,
} from "../Hooks/useStopMultiplayer";
import { isTouchDevice } from "../Logic/domUtils";
import { formatTime } from "../Logic/gameLogic";
import {
  areAllStopAnswersFilled,
  getFirstBlankStopAnswerIndex,
} from "../Logic/stopRound";
import stopStyles from "../styles/StopGame.module.css";
import styles from "../styles/multiplayerGame.module.css";

function formatConnectionStatus(status: string): string {
  switch (status) {
    case "playing":
      return "Conectado";
    case "waiting":
      return "Na sala";
    case "connecting":
      return "Conectando";
    case "ended":
      return "Partida encerrada";
    case "disconnected":
      return "Desconectado";
    default:
      return "Offline";
  }
}

export default function StopMultiplayerGamePage() {
  const navigate = useNavigate();
  const [isLeaveConfirmationOpen, setIsLeaveConfirmationOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  const [activeInputRect, setActiveInputRect] = useState<DOMRect | null>(null);
  const [timeNow, setTimeNow] = useState(() => Date.now());
  const lastSubmittedSignatureRef = useRef<string | null>(null);

  const {
    roomCode,
    playerId,
    state,
    errorMessage,
    connectionStatus,
    submitAnswerSnapshot,
    pressStop,
    requestRematch,
  } = useStopMultiplayer();

  useEffect(() => {
    document.body.style.backgroundColor = "#ffbaba";

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }

    metaThemeColor.setAttribute("content", "#ffbaba");
  }, []);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  useEffect(() => {
    if (!roomCode) {
      navigate(ROUTES.STOP_MP_LOBBY, { replace: true });
    }
  }, [navigate, roomCode]);

  useEffect(() => {
    if (roomCode && state?.status === "lobby") {
      navigate(ROUTES.STOP_MP_LOBBY, { replace: true });
    }
  }, [navigate, roomCode, state?.status]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeNow(Date.now());
    }, 200);

    return () => window.clearInterval(interval);
  }, []);

  const currentRound = state?.currentRound ?? null;
  const boxCount = currentRound?.round.boxes.length ?? 0;
  const roundSignature = currentRound
    ? `${currentRound.roundNumber}-${currentRound.round.magicNumber}-${boxCount}`
    : "no-round";

  const inputRefs = useMemo(
    () => Array.from({ length: boxCount }, () => createRef<HTMLInputElement>()),
    [boxCount],
  );

  useEffect(() => {
    const nextAnswers = Array.from({ length: boxCount }, () => "");
    setAnswers(nextAnswers);
    setShowKeyboard(false);
    setActiveInputIndex(null);
    setActiveInputRect(null);
    lastSubmittedSignatureRef.current = null;
  }, [boxCount, roundSignature]);

  const localPlayer = useMemo(
    () => state?.players.find((player) => player.id === playerId) ?? null,
    [playerId, state],
  );

  const localRoundResult = useMemo(() => {
    if (!currentRound || !playerId) {
      return null;
    }

    return currentRound.resultsByPlayerId[playerId] ?? null;
  }, [currentRound, playerId]);

  const canStopRound =
    currentRound?.phase === "playing" && areAllStopAnswersFilled(answers);
  const elapsedSeconds = currentRound
    ? Math.max(0, Math.floor((timeNow - currentRound.startedAt) / 1000))
    : 0;
  const remainingPhaseSeconds = currentRound
    ? Math.max(0, Math.ceil((currentRound.phaseEndsAt - timeNow) / 1000))
    : 0;

  useEffect(() => {
    if (!currentRound || currentRound.phase !== "playing") {
      return;
    }

    const signature = JSON.stringify(answers);
    if (signature === lastSubmittedSignatureRef.current) {
      return;
    }

    lastSubmittedSignatureRef.current = signature;
    submitAnswerSnapshot(answers);
  }, [answers, currentRound, submitAnswerSnapshot]);

  const handleLeaveRoom = () => {
    leaveStopMultiplayerRoom({ preserveName: true });
    navigate(ROUTES.STOP_MP_LOBBY, { replace: true });
  };

  const pushAnswerSnapshot = useCallback(
    (nextAnswers: string[]) => {
      if (!currentRound || currentRound.phase !== "playing") {
        return;
      }

      const signature = JSON.stringify(nextAnswers);
      lastSubmittedSignatureRef.current = signature;
      submitAnswerSnapshot(nextAnswers);
    },
    [currentRound, submitAnswerSnapshot],
  );

  const handleInputFocus = useCallback(
    (index: number, element: HTMLInputElement) => {
      if (!isTouch || currentRound?.phase !== "playing") {
        return;
      }

      setActiveInputIndex(index);
      setActiveInputRect(element.getBoundingClientRect());
      setShowKeyboard(true);
    },
    [currentRound?.phase, isTouch],
  );

  const focusInputAt = useCallback(
    (index: number) => {
      const input = inputRefs[index]?.current;
      if (!input) {
        return;
      }

      input.focus();
      if (isTouch) {
        handleInputFocus(index, input);
      }
    },
    [handleInputFocus, inputRefs, isTouch],
  );

  const handleStop = useCallback(() => {
    if (!currentRound || currentRound.phase !== "playing") {
      return;
    }

    if (!canStopRound) {
      const blankIndex = getFirstBlankStopAnswerIndex(answers);
      if (blankIndex !== -1) {
        focusInputAt(blankIndex);
      }
      return;
    }

    setShowKeyboard(false);
    setActiveInputIndex(null);
    pressStop(answers);
  }, [answers, canStopRound, currentRound, focusInputAt, pressStop]);

  const handleEnter = useCallback(
    (currentIndex: number) => {
      if (!currentRound) {
        return;
      }

      if (currentIndex < currentRound.round.boxes.length - 1) {
        focusInputAt(currentIndex + 1);
        return;
      }

      handleStop();
    },
    [currentRound, focusInputAt, handleStop],
  );

  useEffect(() => {
    if (!currentRound || currentRound.phase !== "playing") {
      return;
    }

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      const currentInput = document.activeElement as HTMLInputElement | null;
      const currentIndex = inputRefs.findIndex(
        (ref) => ref.current === currentInput,
      );

      if (currentIndex !== -1) {
        handleEnter(currentIndex);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [currentRound, handleEnter, inputRefs]);

  const handleAnswerChange = (index: number, value: string) => {
    if (!currentRound || currentRound.phase !== "playing") {
      return;
    }

    setAnswers((currentAnswers) => {
      const nextAnswers = currentAnswers.map((answer, currentIndex) =>
        currentIndex === index ? value : answer,
      );
      pushAnswerSnapshot(nextAnswers);
      return nextAnswers;
    });
  };

  const handleVirtualInput = (value: string) => {
    if (activeInputIndex === null || currentRound?.phase !== "playing") {
      return;
    }

    setAnswers((currentAnswers) => {
      const nextAnswers = currentAnswers.map((answer, index) =>
        index === activeInputIndex ? answer + value : answer,
      );
      pushAnswerSnapshot(nextAnswers);
      return nextAnswers;
    });
  };

  const handleVirtualBackspace = () => {
    if (activeInputIndex === null || currentRound?.phase !== "playing") {
      return;
    }

    setAnswers((currentAnswers) => {
      const nextAnswers = currentAnswers.map((answer, index) =>
        index === activeInputIndex ? answer.slice(0, -1) : answer,
      );
      pushAnswerSnapshot(nextAnswers);
      return nextAnswers;
    });
  };

  const handleVirtualNext = () => {
    if (activeInputIndex !== null) {
      handleEnter(activeInputIndex);
    }
  };

  const handleCloseKeyboard = () => {
    setShowKeyboard(false);
    setActiveInputIndex(null);
  };

  const winningPlayers = useMemo(
    () =>
      state?.players.filter((player) => state.winnerPlayerIds.includes(player.id)) ?? [],
    [state],
  );
  const sortedPlayers = useMemo(
    () =>
      [...(state?.players ?? [])].sort((firstPlayer, secondPlayer) => {
        if (secondPlayer.totalScore !== firstPlayer.totalScore) {
          return secondPlayer.totalScore - firstPlayer.totalScore;
        }

        return firstPlayer.joinedAt - secondPlayer.joinedAt;
      }),
    [state?.players],
  );
  const rematchVotes = state?.rematchPlayerIds.length ?? 0;
  const hasLocalRematchVote =
    playerId !== null && state !== null
      ? state.rematchPlayerIds.includes(playerId)
      : false;
  const statusLabel =
    currentRound?.phase === "countdown"
      ? "Próxima rodada"
      : currentRound?.phase === "playing"
        ? "Rodada em andamento"
        : currentRound?.phase === "locked"
          ? "STOP acionado"
          : "Resultado da rodada";
  const statusDetail =
    currentRound?.phase === "countdown"
      ? `Rodada ${currentRound.roundNumber} | Começa em ${formatTime(remainingPhaseSeconds)}`
      : currentRound
        ? `Rodada ${currentRound.roundNumber} | Tempo: ${formatTime(elapsedSeconds)}`
        : "";

  if (!state || !roomCode) {
    return (
      <div className={styles.page}>
        <div className={styles.centerCard}>
          <h1 className={styles.title}>Preparando a sala...</h1>
          <p className={styles.text}>
            Aguarde enquanto a partida online do Stop é carregada.
          </p>
          <button className={styles.leaveButton} onClick={handleLeaveRoom}>
            Voltar para a sala
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.banner}>
        <div className={styles.bannerInfo}>
          <span className={styles.roomCode}>Sala {roomCode}</span>
          <span className={styles.roomDetail}>
            Você: {localPlayer?.name ?? "Jogador"}
          </span>
          <span className={styles.roomDetail}>
            Rodada {Math.min(state.currentRoundNumber || 1, state.settings.roundCount)}
            /{state.settings.roundCount}
          </span>
          <span className={styles.roomDetail}>
            Conexão: {formatConnectionStatus(connectionStatus)}
          </span>
        </div>

        <button
          className={styles.leaveButton}
          onClick={() => setIsLeaveConfirmationOpen(true)}
        >
          Sair da Sala
        </button>
      </div>

      {isLeaveConfirmationOpen && (
        <div className={styles.confirmationOverlay}>
          <div className={styles.confirmationCard}>
            <p className={styles.confirmationText}>
              Tem certeza que deseja sair da sala?
            </p>
            <div className={styles.confirmationActions}>
              <button
                className={`${styles.confirmationButton} ${styles.confirmationCancel}`}
                onClick={() => setIsLeaveConfirmationOpen(false)}
              >
                Não
              </button>
              <button
                className={`${styles.confirmationButton} ${styles.confirmationConfirm}`}
                onClick={handleLeaveRoom}
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && <div className={styles.alertBox}>{errorMessage}</div>}

      <main className={styles.gameArea}>
          {state.status === "ended" ? (
            <div className={styles.finalCard}>
              <h1 className={styles.title}>Partida Encerrada</h1>
              <p className={styles.text}>
                {winningPlayers.length > 1
                  ? `Empate entre ${winningPlayers.map((player) => player.name).join(", ")}.`
                  : `${winningPlayers[0]?.name ?? "Jogador"} venceu a partida.`}
              </p>
              <p className={styles.text}>
                {rematchVotes} de {state.players.length} jogadores querem jogar novamente.
              </p>

              <div className={styles.finalRanking}>
                {sortedPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className={`${styles.finalRow} ${
                      state.winnerPlayerIds.includes(player.id) ? styles.finalWinner : ""
                    }`}
                  >
                    <span>
                      #{index + 1} {player.name}
                    </span>
                    <span>{player.totalScore} pts</span>
                  </div>
                ))}
              </div>

              <button
                className={styles.leaveButton}
                onClick={requestRematch}
                disabled={Boolean(hasLocalRematchVote)}
              >
                {hasLocalRematchVote ? "Esperando outros jogadores..." : "Jogar Novamente"}
              </button>
              <button className={styles.leaveButton} onClick={handleLeaveRoom}>
                Voltar para a sala online
              </button>
            </div>
          ) : currentRound ? (
            <div className={styles.roundStage}>
              <div className={styles.statusRow}>
                <span className={styles.statusText}>{statusLabel}</span>
                <span className={styles.statusText}>{statusDetail}</span>
              </div>

              <div className={styles.playSurface}>
                <div className={styles.magicColumn}>
                  <div className={stopStyles.numeroCaixa}>
                    <span className={stopStyles.numeroO}>
                      {currentRound.round.magicNumber}
                    </span>
                  </div>

                  {currentRound.phase === "playing" ? (
                    <button
                      data-target="stopbutton"
                      className={stopStyles.pararJogo}
                      onClick={handleStop}
                    >
                      STOP
                    </button>
                  ) : currentRound.phase === "countdown" ? (
                    <div className={styles.roundSummary}>
                      <div className={styles.roundSummaryLabel}>Começa em</div>
                      <div className={styles.roundSummaryValue}>
                        {remainingPhaseSeconds}
                      </div>
                      <div className={styles.roundSummaryMeta}>Prepare-se</div>
                    </div>
                  ) : (
                    <div className={styles.roundSummary}>
                      <div className={styles.roundSummaryLabel}>Pontos</div>
                      <div className={styles.roundSummaryValue}>
                        {localRoundResult?.totalPoints ?? 0}
                      </div>
                      <div className={styles.roundSummaryMeta}>
                        Acertos: {localRoundResult?.correctCount ?? 0}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.gridColumn}>
                  <div className={stopStyles.tabelaWrap}>
                    <div
                      data-target="board"
                      className={stopStyles.tabela}
                      data-rows={Math.ceil(currentRound.round.boxes.length / 2)}
                      style={
                        { "--columns": currentRound.round.columns } as React.CSSProperties
                      }
                    >
                      {currentRound.round.boxes.map((box, index) => (
                        <CalculationCell
                          key={box.id}
                          box={box}
                          value={answers[index] ?? ""}
                          showFeedback={currentRound.phase !== "playing"}
                          result={localRoundResult?.boxResults[index]}
                          inputRef={inputRefs[index]}
                          onChange={(value) => handleAnswerChange(index, value)}
                          onFocus={(event) => handleInputFocus(index, event.target)}
                          isTouch={isTouch}
                          isLocked={currentRound.phase !== "playing"}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {currentRound.phase === "countdown" && (
                <div className={styles.phaseOverlay}>
                  <div className={styles.stopOverlayCard}>
                    <span className={styles.stopOverlayTitle}>
                      Rodada {currentRound.roundNumber}
                    </span>
                    <span className={styles.stopOverlayText}>
                      Começa em {remainingPhaseSeconds}...
                    </span>
                  </div>
                </div>
              )}

              {currentRound.phase === "locked" && (
                <div className={styles.phaseOverlay}>
                  <div className={styles.stopOverlayCard}>
                    <span className={styles.stopOverlayTitle}>STOP</span>
                    <span className={styles.stopOverlayText}>
                      {currentRound.stoppedByPlayerId
                        ? `${state.players.find(
                            (player) => player.id === currentRound.stoppedByPlayerId,
                          )?.name ?? "Um jogador"} apertou STOP`
                        : "A rodada foi encerrada"}
                    </span>
                  </div>
                </div>
              )}

              {currentRound.phase === "results" && (
                <div className={styles.phaseOverlay}>
                  <div className={styles.resultsCard}>
                    <h2 className={styles.sectionTitle}>Resultado da Rodada</h2>
                    <div className={styles.resultsGrid}>
                      <div className={styles.resultTile}>
                        <span>Pontos</span>
                        <div>{localRoundResult?.totalPoints ?? 0}</div>
                      </div>
                      <div className={styles.resultTile}>
                        <span>Acertos</span>
                        <div>{localRoundResult?.correctCount ?? 0}</div>
                      </div>
                      <div className={styles.resultTile}>
                        <span>Erros</span>
                        <div>{localRoundResult?.wrongCount ?? 0}</div>
                      </div>
                      <div className={styles.resultTile}>
                        <span>Em branco</span>
                        <div>{localRoundResult?.blankCount ?? 0}</div>
                      </div>
                    </div>
                    <p className={styles.text}>
                      {state.currentRoundNumber >= state.settings.roundCount
                        ? `Placar final em ${remainingPhaseSeconds}...`
                        : `Próxima rodada em ${remainingPhaseSeconds}...`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.centerCard}>
              <h1 className={styles.title}>Aguardando rodada...</h1>
              <p className={styles.text}>
                A próxima rodada será carregada automaticamente.
              </p>
            </div>
          )}
      </main>

      <VirtualKeyboard
        isVisible={showKeyboard && currentRound?.phase === "playing"}
        targetRect={activeInputRect}
        onInput={handleVirtualInput}
        onDelete={handleVirtualBackspace}
        onNext={handleVirtualNext}
        onClose={handleCloseKeyboard}
      />
    </div>
  );
}
