import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "../../routes";
import Board from "../Components/board-component";
import { useCrownChaseMultiplayer } from "../Hooks/useCrownChaseMultiplayer";
import styles from "../styles/multiplayerGame.module.css";

export default function CrownChaseMultiplayerGamePage() {
  const navigate = useNavigate();
  const [isLeaveConfirmationOpen, setIsLeaveConfirmationOpen] = useState(false);
  const {
    connectionStatus,
    roomCode,
    playerName,
    playerSeat,
    players,
    gameState,
    errorMessage,
    opponentDisconnected,
    rematchPending,
    rematchRequestedBy,
    submitMove,
    requestRematch,
    leaveRoom,
  } = useCrownChaseMultiplayer();


  useEffect(() => {
    if (!roomCode) {
      navigate(ROUTES.CROWN_CHASE_MP_LOBBY, { replace: true });
    }
  }, [navigate, roomCode]);

  const opponent = players.find((candidate) => candidate.seat !== playerSeat) ?? null;
  const statusMessage = opponentDisconnected
    ? "Oponente desconectado"
    : connectionStatus === "disconnected"
      ? "Conexão encerrada"
      : null;

  const playAgainLabel =
    rematchRequestedBy !== null && rematchRequestedBy !== playerSeat
      ? "Aceitar revanche"
      : rematchPending
        ? "Aguardando revanche..."
        : "Pedir revanche";

  const handleLeaveRoom = () => {
    leaveRoom({ preserveName: true });
    navigate(ROUTES.CROWN_CHASE_MP_LOBBY, { replace: true });
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

  if (!gameState || playerSeat === null) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingCard}>
          <h1 className={styles.loadingTitle}>Preparando a partida...</h1>
          <p className={styles.loadingText}>
            Aguarde alguns instantes enquanto a sala é carregada.
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
                Não
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

      <Board
        onlineHeader={
          <div className={styles.onlineHeaderContent}>
            <div className={styles.roomBanner}>
              <div className={styles.roomInfo}>
                <span className={styles.roomCode}>Sala {roomCode}</span>
                <span className={styles.roomDetail}>
                  Você: {playerName || "Jogador"} ({playerSeat === 0 ? "vermelho" : "azul"})
                </span>
                <span className={styles.roomDetail}>
                  Oponente: {opponent?.name ?? "Aguardando..."}
                </span>
              </div>

              <button className={styles.leaveButton} onClick={handleLeaveRoomRequest}>
                Sair da Sala
              </button>
            </div>
            {errorMessage && <div className={styles.alertBox}>{errorMessage}</div>}
          </div>
        }
        mode="remote"
        gameState={gameState}
        onMoveIntent={submitMove}
        playerSeat={playerSeat}
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
