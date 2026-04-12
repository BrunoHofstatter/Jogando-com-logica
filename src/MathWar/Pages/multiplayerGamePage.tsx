import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "../../routes";
import Board from "../Components/board-component";
import { useMathWarMultiplayer } from "../Hooks/useMathWarMultiplayer";
import styles from "../styles/multiplayerGame.module.css";

export default function MathWarMultiplayerGamePage() {
  const navigate = useNavigate();
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
  } = useMathWarMultiplayer();

  useEffect(() => {
    document.body.style.backgroundColor = "#adfad2";
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", "#adfad2");
  }, []);

  useEffect(() => {
    if (!roomCode) {
      navigate(ROUTES.MATH_WAR_MP_LOBBY, { replace: true });
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
    navigate(ROUTES.MATH_WAR_MP_LOBBY, { replace: true });
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

        <button className={styles.leaveButton} onClick={handleLeaveRoom}>
          Sair da Sala
        </button>
      </div>

      {errorMessage && (
        <div className={styles.alertBox}>
          {errorMessage}
        </div>
      )}

      <Board
        mode="remote"
        gameState={gameState}
        onMoveIntent={submitMove}
        playerSeat={playerSeat}
        interactionLocked={connectionStatus !== "playing" || opponentDisconnected}
        onPlayAgain={requestRematch}
        onPlayAgainDisabled={opponentDisconnected || rematchPending}
        playAgainLabel={playAgainLabel}
        statusMessage={statusMessage}
        onMenu={handleLeaveRoom}
      />
    </>
  );
}
