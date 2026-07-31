import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "../../routes";
import { useCacaSomaMultiplayer } from "../Hooks/useCacaSomaMultiplayer";
import type { CacaSomaRoundResult, TeamId } from "../Logic/v2";
import baseStyles from "../styles/levelGame.module.css";
import styles from "../styles/multiplayerGame.module.css";

function formatSeconds(ms: number): string {
  return `${Math.max(0, Math.ceil(ms / 1000))}s`;
}

const TEAM_LABELS: Record<TeamId, string> = {
  0: "Equipe Laranja",
  1: "Equipe Azul",
};

function getRoundResultTitle(result: CacaSomaRoundResult): string {
  if (result.winner === null) {
    return result.reason === "tied_correct" ? "Empate na rodada!" : "Ninguém pontuou!";
  }

  const teamName = TEAM_LABELS[result.winner];
  if (result.reason === "one_correct") {
    return `${teamName} acertou!`;
  }

  if (result.reason === "faster_correct") {
    return `${teamName} foi mais rápida!`;
  }

  return `${teamName} venceu a rodada!`;
}

function getRoundResultSubtitle(result: CacaSomaRoundResult): string {
  if (result.reason === "faster_correct") {
    return "Ponto para quem respondeu certo primeiro.";
  }

  if (result.reason === "one_correct") {
    return "Só uma equipe acertou a soma.";
  }

  if (result.reason === "tied_correct") {
    return "As duas equipes acertaram no mesmo tempo.";
  }

  return "As equipes não acertaram desta vez.";
}

function formatElapsedTime(elapsedMs: number | null): string {
  if (elapsedMs === null) {
    return "-";
  }

  return `${Math.max(0, Math.round(elapsedMs / 1000))}s`;
}

function getDisplayElapsedMs(result: CacaSomaRoundResult): [number | null, number | null] {
  const displayTimes = result.teams.map((team) => (
    team.elapsedMs === null ? null : Math.max(0, Math.round(team.elapsedMs / 1000) * 1000)
  )) as [number | null, number | null];

  if (
    result.reason === "faster_correct" &&
    result.winner !== null &&
    displayTimes[0] !== null &&
    displayTimes[1] !== null &&
    displayTimes[0] === displayTimes[1]
  ) {
    const loser = result.winner === 0 ? 1 : 0;
    const winnerDisplayTime = displayTimes[result.winner];
    if (winnerDisplayTime !== null) {
      displayTimes[loser] = winnerDisplayTime + 1000;
    }
  }

  return displayTimes;
}

export default function CacaSomaMultiplayerGamePage() {
  const navigate = useNavigate();
  const [isLeaveConfirmationOpen, setIsLeaveConfirmationOpen] = useState(false);
  const [timeNow, setTimeNow] = useState(() => Date.now());
  const [rollingMagicNumber, setRollingMagicNumber] = useState(10);
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
    serverTimeOffsetMs,
    submitAction,
    requestRematch,
    leaveRoom,
  } = useCacaSomaMultiplayer();


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

  const currentRound = gameState?.currentRound ?? null;
  const roundPhase = currentRound?.phase ?? "playing";
  const localTeam = localTeamId !== null && gameState ? gameState.teams[localTeamId] : null;
  const localSubmission =
    localTeamId !== null && currentRound ? currentRound.submissions[localTeamId] : null;
  const teamSize = gameState?.config.teamSize ?? (settings?.mode === "1v1" ? 1 : 2);

  const playersByTeam = useMemo(
    () => [
      players
        .filter((player) => player.team === 0)
        .sort((left, right) => left.playerIndex - right.playerIndex),
      players
        .filter((player) => player.team === 1)
        .sort((left, right) => left.playerIndex - right.playerIndex),
    ],
    [players],
  );

  const selectedByLocalPlayer =
    localPlayerIndex !== null && localTeam ? localTeam.players[localPlayerIndex].selectedCellIds : [];
  const selectedByTeammate =
    teamSize === 2 && localPlayerIndex !== null && localTeam
      ? localTeam.players[localPlayerIndex === 0 ? 1 : 0]?.selectedCellIds ?? []
      : [];
  const localPlayerReady =
    localPlayerIndex !== null && localTeam ? localTeam.players[localPlayerIndex].ready : false;
  const teammateReady =
    teamSize === 2 && localPlayerIndex !== null && localTeam
      ? localTeam.players[localPlayerIndex === 0 ? 1 : 0]?.ready ?? false
      : false;

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
    roundPhase === "playing" &&
    localTeam !== null &&
    localSubmission === null;

  const localSelectionLimit =
    localPlayerIndex !== null && gameState
      ? gameState.config.selectionLimits[localPlayerIndex] ?? 1
      : 1;
  const localAllowedSelectionCounts = gameState?.config.allowedSelectionCounts ?? [localSelectionLimit];
  const hasValidLocalSelection = teamSize === 1
    ? localAllowedSelectionCounts.includes(selectedByLocalPlayer.length)
    : selectedByLocalPlayer.length === localSelectionLimit;

  const isReadyButtonDisabled =
    !isRoundPlayable ||
    (!localPlayerReady && !hasValidLocalSelection);

  const targetNumber =
    currentRound && localTeamId !== null ? currentRound.targetNumbers[localTeamId] : null;
  const rollingRange = gameState?.config.difficulty.targetRange ?? { min: 10, max: 70 };
  const serverTimeNow = timeNow + serverTimeOffsetMs;
  const remainingMs = currentRound
    ? roundPhase === "playing"
      ? currentRound.deadlineAtMs - serverTimeNow
      : currentRound.deadlineAtMs - currentRound.playStartsAtMs
    : 0;
  const phaseRemainingMs = currentRound ? currentRound.phaseEndsAtMs - serverTimeNow : 0;
  const roundNumber = currentRound?.number ?? gameState?.history.length ?? 0;
  const overlayCountdown = Math.max(1, Math.ceil(phaseRemainingMs / 1000));
  const previousRoundResult = gameState && gameState.history.length > 0
    ? gameState.history[gameState.history.length - 1]
    : null;
  const isResultCountdown = roundPhase === "countdown" && previousRoundResult !== null;
  const resultDisplayTimes = previousRoundResult ? getDisplayElapsedMs(previousRoundResult) : null;

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
      : roundPhase !== "playing"
        ? "Aguarde a rodada começar"
      : teamSize === 1
        ? localAllowedSelectionCounts.length > 1
          ? `Escolha 2 ou 3 números e clique em Pronto`
          : `Escolha ${localSelectionLimit} números e clique em Pronto`
        : "Escolha o seu número e clique em Pronto";

  const displayedMagicNumber = roundPhase === "playing"
    ? targetNumber ?? "-"
    : roundPhase === "rolling"
      ? rollingMagicNumber
      : "-";

  useEffect(() => {
    if (roundPhase !== "rolling") {
      return;
    }

    setRollingMagicNumber(rollingRange.min);
    const interval = window.setInterval(() => {
      setRollingMagicNumber((currentValue) => (
        currentValue >= rollingRange.max ? rollingRange.min : currentValue + 7
      ));
    }, 80);

    return () => {
      window.clearInterval(interval);
    };
  }, [rollingRange.max, rollingRange.min, roundPhase, currentRound?.number]);

  const handleLeaveRoom = () => {
    leaveRoom({ preserveName: true });
    navigate(ROUTES.CACA_SOMA_MP_LOBBY, { replace: true });
  };

  const handleCellClick = (cellId: number) => {
    if (!isRoundPlayable) {
      return;
    }

    if (teamSize === 1) {
      const nextSelection = localSelectedCells.has(cellId)
        ? selectedByLocalPlayer.filter((selectedCellId) => selectedCellId !== cellId)
        : selectedByLocalPlayer.length < localSelectionLimit
          ? [...selectedByLocalPlayer, cellId]
          : selectedByLocalPlayer;

      submitAction({
        type: "set_player_selection",
        cellIds: nextSelection,
      });
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
        <div className={`${baseStyles.leftPanel} ${styles.leftPanelOnline}`}>
          <div className={baseStyles.controlsBox}>
            <div className={styles.scoreTrackers}>
              <div className={styles.teamTracker}>
                <div className={baseStyles.roundTracker}>
                  {Array.from({ length: matchTargetScore }, (_, index) => (
                    <span
                      key={`team-a-${index}`}
                      className={`${baseStyles.roundDot} ${styles.scoreDot} ${styles.scoreDotOrange} ${
                        index < (gameState?.teams[0].score ?? 0) ? styles.scoreDotFilled : ""
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.teamTracker}>
                <div className={baseStyles.roundTracker}>
                  {Array.from({ length: matchTargetScore }, (_, index) => (
                    <span
                      key={`team-b-${index}`}
                      className={`${baseStyles.roundDot} ${styles.scoreDot} ${styles.scoreDotBlue} ${
                        index < (gameState?.teams[1].score ?? 0) ? styles.scoreDotFilled : ""
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
                  {displayedMagicNumber}
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

          </div>

          <div className={styles.standaloneTimer}>{formatSeconds(remainingMs)}</div>

          <div className={styles.infoPanel}>
            <div className={styles.compactHeader}>
              <span className={styles.roomCode}>Sala {roomCode}</span>
              <span className={styles.roundLabel}>Rodada {roundNumber}</span>
            </div>

            <div className={styles.playersStrip}>
              {playersByTeam.map((teamPlayers, teamIndex) => (
                <div
                  key={`team-${teamIndex}`}
                  className={`${styles.playerTeamColumn} ${
                    teamIndex === 0 ? styles.playerTeamOrange : styles.playerTeamBlue
                  }`}
                >
                  {teamPlayers.map((player) => (
                    <div
                      key={`${player.team}-${player.playerIndex}-${player.seat}`}
                      className={`${styles.playerPill} ${player.seat === playerSeat ? styles.playerPillActive : ""}`}
                    >
                      <span
                        className={`${styles.connectionDot} ${
                          player.connected ? styles.connectionDotOn : styles.connectionDotOff
                        }`}
                      />
                      <span className={styles.playerPillName}>{player.name}</span>
                    </div>
                  ))}
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
                  className={`${baseStyles.celula} ${styles.cellShell} ${cellClassName} ${isLocked || isTeammate ? styles.cellDisabled : ""}`}
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

      {currentRound && roundPhase !== "playing" && !roomInterrupted && gameState?.status !== "ended" && (
        <div className={styles.roundOverlay}>
          <div className={styles.roundOverlayCard}>
            <div className={styles.roundOverlayTitle}>
              {isResultCountdown && previousRoundResult
                ? getRoundResultTitle(previousRoundResult)
                : currentRound.number === 1
                  ? "A partida vai começar!"
                  : `Rodada ${currentRound.number}`}
            </div>
            <div className={styles.roundOverlayText}>
              {roundPhase === "countdown"
                ? isResultCountdown && previousRoundResult
                  ? getRoundResultSubtitle(previousRoundResult)
                  : "Prepare-se..."
                : "Número mágico..."}
            </div>
            {roundPhase === "countdown" && (
              <div className={styles.roundOverlayScoreboard}>
                {([0, 1] as const).map((teamId) => (
                  <div
                    key={`overlay-score-${teamId}`}
                    className={`${styles.roundOverlayTeamScore} ${
                      teamId === 0 ? styles.roundOverlayTeamOrange : styles.roundOverlayTeamBlue
                    }`}
                  >
                    <span className={styles.roundOverlayTeamLabel}>
                      {teamId === 0 ? "Laranja" : "Azul"}
                    </span>
                    <div className={styles.roundOverlayDots}>
                      {Array.from({ length: matchTargetScore }, (_, index) => {
                        const teamScore = gameState?.teams[teamId].score ?? 0;
                        const isFilled = index < teamScore;
                        const isNewPoint =
                          isResultCountdown &&
                          previousRoundResult?.winner === teamId &&
                          index === teamScore - 1;

                        return (
                          <span
                            key={`overlay-dot-${teamId}-${index}`}
                            className={`${baseStyles.roundDot} ${styles.scoreDot} ${
                              teamId === 0 ? styles.scoreDotOrange : styles.scoreDotBlue
                            } ${isFilled ? styles.scoreDotFilled : ""} ${
                              isNewPoint ? styles.scoreDotJustScored : ""
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isResultCountdown && previousRoundResult && resultDisplayTimes && (
              <div className={styles.roundOverlayTimes}>
                {([0, 1] as const).map((teamId) => (
                  <span
                    key={`overlay-time-${teamId}`}
                    className={`${styles.roundOverlayTimePill} ${
                      previousRoundResult.winner === teamId ? styles.roundOverlayTimeWinner : ""
                    }`}
                  >
                    {teamId === 0 ? "Laranja" : "Azul"}:{" "}
                    {previousRoundResult.teams[teamId].submitted
                      ? formatElapsedTime(resultDisplayTimes[teamId])
                      : "sem resposta"}
                  </span>
                ))}
              </div>
            )}
            {roundPhase === "countdown" && (
              <div className={styles.roundOverlayNextText}>
                {currentRound.number === 1 ? "Começa em" : `Rodada ${currentRound.number} em`}
              </div>
            )}
            <div className={styles.roundOverlayValue}>
              {roundPhase === "countdown" ? overlayCountdown : rollingMagicNumber}
            </div>
          </div>
        </div>
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
