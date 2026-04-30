import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "../../routes";
import SPTTT from "../Components/SPTTT";
import { useSPTTTMultiplayer } from "../Hooks/useSPTTTMultiplayer";
import styles from "../Style/multiplayerGame.module.css";

export default function SPTTTMultiplayerGamePage() {
  const navigate = useNavigate();
  const [isLeaveConfirmationOpen, setIsLeaveConfirmationOpen] = useState(false);
  const {
    connectionStatus,
    roomCode,
    playerName,
    playerSeat,
    playerMark,
    players,
    gameState,
    errorMessage,
    opponentDisconnected,
    rematchPending,
    rematchRequestedBy,
    submitMove,
    requestRematch,
    leaveRoom,
  } = useSPTTTMultiplayer();

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

  useEffect(() => {
    if (!roomCode) {
      navigate(ROUTES.SPTTT_MP_LOBBY, { replace: true });
    }
  }, [navigate, roomCode]);

  const opponent = players.find((candidate) => candidate.seat !== playerSeat) ?? null;
  const statusMessage = opponentDisconnected
    ? "Oponente desconectado"
    : connectionStatus === "disconnected"
      ? "Conexao encerrada"
      : null;

  const playAgainLabel =
    rematchRequestedBy !== null && rematchRequestedBy !== playerSeat
      ? "Aceitar revanche"
      : rematchPending
        ? "Aguardando revanche..."
        : "Pedir revanche";

  const handleLeaveRoom = () => {
    leaveRoom({ preserveName: true });
    navigate(ROUTES.SPTTT_MP_LOBBY, { replace: true });
  };

  const handleLeaveRoomRequest = () => {
    setIsLeaveConfirmationOpen(true);
  };

  const handleCancelLeaveRoom = () => {
    setIsLeaveConfirmationOpen(false);
  };

  const handleConfirmLeaveRoom = () => {
    setIsLeaveConfirmationOpen(false);
    handleLeaveRoom();
  };

  if (!gameState || playerSeat === null || playerMark === null) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingCard}>
          <h1 className={styles.loadingTitle}>Preparando a partida...</h1>
          <p className={styles.loadingText}>
            Aguarde alguns instantes enquanto a sala e carregada.
          </p>
          <button className={styles.leaveButton} onClick={handleLeaveRoom}>
            Voltar para a sala
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.roomBanner}>
        <div className={styles.roomInfo}>
          <span className={styles.roomCode}>Sala {roomCode}</span>
          <span className={styles.roomDetail}>
            Voce: {playerName || "Jogador"} ({playerMark})
          </span>
          <span className={styles.roomDetail}>
            Oponente: {opponent?.name ?? "Aguardando..."}
            {opponent?.mark ? ` (${opponent.mark})` : ""}
          </span>
        </div>

        <button className={styles.leaveButton} onClick={handleLeaveRoomRequest}>
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
                onClick={handleCancelLeaveRoom}
              >
                Nao
              </button>
              <button
                className={`${styles.confirmationButton} ${styles.confirmationConfirm}`}
                onClick={handleConfirmLeaveRoom}
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && <div className={styles.alertBox}>{errorMessage}</div>}

      <SPTTT
        mode="remote"
        gameState={gameState}
        onMoveIntent={submitMove}
        playerMark={playerMark}
        interactionLocked={connectionStatus !== "playing" || opponentDisconnected}
        onPlayAgain={requestRematch}
        onPlayAgainDisabled={opponentDisconnected || rematchPending}
        playAgainLabel={playAgainLabel}
        statusMessage={statusMessage}
        onMenu={handleLeaveRoomRequest}
      />
    </>
  );
}
