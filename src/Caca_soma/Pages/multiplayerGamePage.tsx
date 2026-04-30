import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "../../routes";
import { useCacaSomaMultiplayer } from "../Hooks/useCacaSomaMultiplayer";
import baseStyles from "../styles/levelGame.module.css";
import styles from "../styles/multiplayerGame.module.css";

function formatSeconds(ms: number): string {
  return `${Math.max(0, ms / 1000).toFixed(1)}s`;
}

export default function CacaSomaMultiplayerGamePage() {
  const navigate = useNavigate();
  const [isLeaveConfirmationOpen, setIsLeaveConfirmationOpen] = useState(false);
  const [timeNow, setTimeNow] = useState(() => Date.now());
  const {
    connectionStatus,
    roomCode,
    playerSeat,
    players,
    settings,
    gameState,
    errorMessage,
    roomInterrupted,
    rematchPending,
    rematchRequestedBy,
    submitAction,
    requestRematch,
    leaveRoom,
  } = useCacaSomaMultiplayer();

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

  useEffect(() => {
    if (!roomCode) {
      navigate(ROUTES.CACA_SOMA_MP_LOBBY, { replace: true });
    }
  }, [navigate, roomCode]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeNow(Date.now());
    }, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const localPlayer = useMemo(
    () => players.find((candidate) => candidate.seat === playerSeat) ?? null,
    [playerSeat, players],
  );

  const localTeamId = localPlayer?.team ?? null;
  const localPlayerIndex = localPlayer?.playerIndex ?? null;

  const playerSlots = useMemo(
    () => [
      {
        key: "a1",
        label: "A1",
        player: players.find((candidate) => candidate.team === 0 && candidate.playerIndex === 0) ?? null,
      },
      {
        key: "a2",
        label: "A2",
        player: players.find((candidate) => candidate.team === 0 && candidate.playerIndex === 1) ?? null,
      },
      {
        key: "b1",
        label: "B1",
        player: players.find((candidate) => candidate.team === 1 && candidate.playerIndex === 0) ?? null,
      },
      {
        key: "b2",
        label: "B2",
        player: players.find((candidate) => candidate.team === 1 && candidate.playerIndex === 1) ?? null,
      },
    ],
    [players],
  );

  const currentRound = gameState?.currentRound ?? null;
  const localTeam = localTeamId !== null && gameState ? gameState.teams[localTeamId] : null;
  const localSubmission =
    localTeamId !== null && currentRound ? currentRound.submissions[localTeamId] : null;

  const selectedByLocalPlayer =
    localPlayerIndex !== null && localTeam ? localTeam.players[localPlayerIndex].selectedCellIds : [];
  const selectedByTeammate =
    localPlayerIndex !== null && localTeam ? localTeam.players[localPlayerIndex === 0 ? 1 : 0].selectedCellIds : [];
  const localPlayerReady =
    localPlayerIndex !== null && localTeam ? localTeam.players[localPlayerIndex].ready : false;
  const teammateReady =
    localPlayerIndex !== null && localTeam ? localTeam.players[localPlayerIndex === 0 ? 1 : 0].ready : false;

  const matchTargetScore = gameState?.config.targetScore ?? settings?.targetScore ?? 3;
  const boardSize = gameState?.config.difficulty.boardSize
    ?? (settings?.difficultyId === "easy"
      ? 5
      : settings?.difficultyId === "hard"
        ? 10
        : 7);
  const boardValues = gameState?.boardValues
    ?? Array.from({ length: boardSize * boardSize }, (_, index) => index + 1);

  const lockedCells = new Set(localTeam?.lockedCellIds ?? []);
  const localSelectedCells = new Set(selectedByLocalPlayer);
  const teammateSelectedCells = new Set(selectedByTeammate);

  const isRoundPlayable =
    connectionStatus === "playing" &&
    !roomInterrupted &&
    currentRound !== null &&
    localTeam !== null &&
    localSubmission === null;

  const isReadyButtonDisabled =
    !isRoundPlayable || selectedByLocalPlayer.length === 0;

  const targetNumber =
    currentRound && localTeamId !== null ? currentRound.targetNumbers[localTeamId] : null;
  const remainingMs = currentRound ? currentRound.deadlineAtMs - timeNow : 0;
  const roundNumber = currentRound?.number ?? gameState?.history.length ?? 0;

  const readyButtonLabel = localPlayerReady ? "Cancelar Pronto" : "Pronto";
  const playAgainLabel =
    rematchRequestedBy !== null && rematchRequestedBy !== playerSeat
      ? "Aceitar revanche"
      : rematchPending
        ? "Aguardando revanche..."
        : "Pedir revanche";

  const topInstruction = roomInterrupted
    ? "A sala foi interrompida"
    : localSubmission
      ? "Resposta enviada"
      : "Escolha o seu número e clique em Pronto";

  const handleLeaveRoom = () => {
    leaveRoom({ preserveName: true });
    navigate(ROUTES.CACA_SOMA_MP_LOBBY, { replace: true });
  };

  const handleCellClick = (cellId: number) => {
    if (!isRoundPlayable) {
      return;
    }

    submitAction({
      type: "set_player_selection",
      cellIds: localSelectedCells.has(cellId) ? [] : [cellId],
    });
  };

  const handleReadyToggle = () => {
    if (isReadyButtonDisabled) {
      return;
    }

    submitAction({
      type: "set_player_ready",
      ready: !localPlayerReady,
    });
  };

  if (!roomCode || playerSeat === null || localPlayer === null) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingCard}>
          <h1 className={styles.loadingTitle}>Preparando a partida...</h1>
          <p className={styles.loadingText}>
            Aguarde alguns instantes enquanto a sala é carregada.
          </p>
          <button className={styles.loadingButton} onClick={handleLeaveRoom}>
            Voltar para a sala
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={baseStyles.container}>
        <div className={baseStyles.leftPanel}>
          <div className={baseStyles.controlsBox}>
            <div className={styles.scoreTrackers}>
              <div className={styles.teamTracker}>
                <span className={`${styles.teamTrackerLabel} ${localTeamId === 0 ? styles.teamTrackerLabelActive : ""}`}>
                  Equipe A
                </span>
                <div className={baseStyles.roundTracker}>
                  {Array.from({ length: matchTargetScore }, (_, index) => (
                    <span
                      key={`team-a-${index}`}
                      className={`${baseStyles.roundDot} ${
                        index < (gameState?.teams[0].score ?? 0) ? baseStyles.roundDotCompleted : ""
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.teamTracker}>
                <span className={`${styles.teamTrackerLabel} ${localTeamId === 1 ? styles.teamTrackerLabelActive : ""}`}>
                  Equipe B
                </span>
                <div className={baseStyles.roundTracker}>
                  {Array.from({ length: matchTargetScore }, (_, index) => (
                    <span
                      key={`team-b-${index}`}
                      className={`${baseStyles.roundDot} ${
                        index < (gameState?.teams[1].score ?? 0) ? baseStyles.roundDotCompleted : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className={baseStyles.magicAndButton}>
              <div className={baseStyles.magicNumberContainer}>
                <div className={baseStyles.magicNumberTextColumn}>
                  <span className={baseStyles.magicNumberTitle}>Número</span>
                  <span className={baseStyles.magicNumberTitle}>Mágico</span>
                </div>
                <div className={baseStyles.magicNumberDisplay}>
                  {targetNumber ?? "-"}
                </div>
              </div>

              {gameState?.status === "ended" ? (
                <button
                  className={`${baseStyles.gameButton} ${styles.readyButton}`}
                  onClick={requestRematch}
                  disabled={roomInterrupted || rematchPending}
                >
                  {playAgainLabel}
                </button>
              ) : localSubmission || roomInterrupted ? (
                <div className={baseStyles.instructionText}>{topInstruction}</div>
              ) : (
                <button
                  className={`${baseStyles.gameButton} ${localPlayerReady ? styles.cancelReadyButton : styles.readyButton}`}
                  onClick={handleReadyToggle}
                  disabled={isReadyButtonDisabled}
                >
                  {readyButtonLabel}
                </button>
              )}
            </div>

            <div className={baseStyles.timerDisplay}>
              <span className={baseStyles.timerLabel}>Tempo Restante:</span>
              <span className={baseStyles.timerValue}>{formatSeconds(remainingMs)}</span>
            </div>
          </div>

          <div className={styles.infoPanel}>
            <div className={styles.compactHeader}>
              <span className={styles.roomCode}>Sala {roomCode}</span>
              <span className={styles.roundLabel}>Rodada {roundNumber}</span>
            </div>

            <div className={styles.playersStrip}>
              {playerSlots.map(({ key, label, player }) => (
                <div
                  key={key}
                  className={`${styles.playerPill} ${player?.seat === playerSeat ? styles.playerPillActive : ""}`}
                >
                  <span className={styles.playerPillTop}>
                    <span className={styles.playerPillLabel}>{label}</span>
                    <span
                      className={`${styles.connectionDot} ${
                        player?.connected ? styles.connectionDotOn : styles.connectionDotOff
                      }`}
                    />
                  </span>
                  <span className={styles.playerPillName}>{player?.name ?? "-"}</span>
                </div>
              ))}
            </div>

            {roomInterrupted && (
              <div className={styles.compactNotice}>
                Um jogador saiu ou desconectou.
              </div>
            )}

            <button className={styles.leaveRoomButton} onClick={() => setIsLeaveConfirmationOpen(true)}>
              Sair da Sala
            </button>
          </div>
        </div>

        <div className={baseStyles.rightPanel}>
          <div
            className={baseStyles.board}
            style={{
              gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
              // @ts-expect-error CSS custom property
              "--board-size": boardSize,
            }}
          >
            {boardValues.map((value, cellId) => {
              const isLocked = lockedCells.has(cellId);
              const isMine = localSelectedCells.has(cellId);
              const isTeammate = teammateSelectedCells.has(cellId);

              const cellClassName = isLocked
                ? baseStyles.cellCorrect
                : isMine
                  ? baseStyles.cellSelected
                  : isTeammate
                    ? styles.cellTeammate
                    : baseStyles.cellDefault;

              return (
                <div
                  key={cellId}
                  className={`${baseStyles.celula} ${styles.cellShell} ${cellClassName} ${!isRoundPlayable || isLocked || isTeammate ? styles.cellDisabled : ""}`}
                  onClick={() => handleCellClick(cellId)}
                >
                  <span>{value}</span>
                  {isTeammate && teammateReady && (
                    <span className={styles.teammateReadyBadge}>✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className={styles.alertBox}>{errorMessage}</div>
      )}

      {gameState?.status === "ended" && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalTitle}>Partida Encerrada</div>
            <p className={styles.modalText}>
              {gameState.winner === null
                ? "A partida terminou empatada."
                : gameState.winner === localTeamId
                  ? "Sua equipe venceu!"
                  : "A outra equipe venceu."}
            </p>
            <div className={styles.modalScore}>
              <span>Equipe A: {gameState.teams[0].score}</span>
              <span>Equipe B: {gameState.teams[1].score}</span>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.modalPrimaryButton}
                onClick={requestRematch}
                disabled={roomInterrupted || rematchPending}
              >
                {playAgainLabel}
              </button>
              <button className={styles.modalSecondaryButton} onClick={handleLeaveRoom}>
                Voltar para a sala
              </button>
            </div>
          </div>
        </div>
      )}

      {isLeaveConfirmationOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalTitle}>Sair da Sala</div>
            <p className={styles.modalText}>Tem certeza que deseja sair da sala?</p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalSecondaryButton}
                onClick={() => setIsLeaveConfirmationOpen(false)}
              >
                Não
              </button>
              <button className={styles.modalPrimaryButton} onClick={handleLeaveRoom}>
                Sim
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
