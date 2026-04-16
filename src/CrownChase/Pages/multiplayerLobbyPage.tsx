import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "../../routes";
import { useCrownChaseMultiplayer } from "../Hooks/useCrownChaseMultiplayer";
import styles from "../styles/multiplayerLobby.module.css";

type LobbyMode = "home" | "join";

export default function CrownChaseMultiplayerLobbyPage() {
  const navigate = useNavigate();
  const {
    connectionStatus,
    roomCode,
    playerName,
    playerSeat,
    players,
    errorMessage,
    createRoom,
    joinRoom,
    leaveRoom,
  } = useCrownChaseMultiplayer();

  const [lobbyMode, setLobbyMode] = useState<LobbyMode>("home");
  const [nameInput, setNameInput] = useState(playerName);
  const [roomInput, setRoomInput] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");

  useEffect(() => {
    document.body.style.backgroundColor = "#d9b6fe";

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }

    metaThemeColor.setAttribute("content", "#d9b6fe");
  }, []);

  useEffect(() => {
    setNameInput(playerName);
  }, [playerName]);

  useEffect(() => {
    if ((connectionStatus === "playing" || connectionStatus === "ended") && roomCode) {
      navigate(ROUTES.CROWN_CHASE_MP_GAME, { replace: true });
    }
  }, [connectionStatus, navigate, roomCode]);

  const opponent = players.find((candidate) => candidate.seat !== playerSeat) ?? null;
  const isBusy = connectionStatus === "connecting";
  const isWaiting = connectionStatus === "waiting" && roomCode !== null;
  const isDisconnected = connectionStatus === "disconnected" && roomCode !== null;

  const handleCreateRoom = () => {
    createRoom(nameInput);
  };

  const handleJoinRoom = () => {
    joinRoom(roomInput, nameInput);
  };

  const handleCopyCode = async () => {
    if (!roomCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(roomCode);
      setCopyFeedback("Código copiado!");
      window.setTimeout(() => setCopyFeedback(""), 2000);
    } catch {
      setCopyFeedback("Não foi possível copiar.");
      window.setTimeout(() => setCopyFeedback(""), 2000);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom({ preserveName: true });
    setLobbyMode("home");
    setRoomInput("");
    setCopyFeedback("");
  };

  return (
    <div className={styles.page}>
      <div className={styles.previewColumn}>
        <div className={styles.title}>Caça Coroa Online</div>
        <img
          src={`${import.meta.env.BASE_URL}crownchasePreview.png`}
          className={styles.preview}
          alt="Prévia do jogo Caça Coroa"
        />
      </div>

      <div className={styles.panel}>
        <div className={styles.card}>
          <div className={styles.heading}>Sala Privada</div>
          <p className={styles.description}>
            Crie uma sala e compartilhe o código com outro jogador.
          </p>

          <div className={styles.nameWrap}>
            <label className={styles.fieldLabel} htmlFor="crown-chase-online-name">
              Seu nome
            </label>
            <input
              id="crown-chase-online-name"
              className={styles.input}
              value={nameInput}
              maxLength={20}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder="Digite seu nome"
            />
          </div>

          {!isWaiting && !isDisconnected && (
            <div className={styles.actions}>
              <button
                className={styles.primaryButton}
                onClick={handleCreateRoom}
                disabled={isBusy}
              >
                {isBusy && lobbyMode === "home" ? "Conectando..." : "Criar Sala"}
              </button>

              <button
                className={styles.secondaryButton}
                onClick={() =>
                  setLobbyMode((currentMode) =>
                    currentMode === "join" ? "home" : "join",
                  )
                }
                disabled={isBusy}
              >
                {lobbyMode === "join" ? "Voltar" : "Entrar em Sala"}
              </button>
            </div>
          )}

          {lobbyMode === "join" && !isWaiting && !isDisconnected && (
            <div className={styles.joinBox}>
            <div className={styles.nameWrap}>
              <label className={styles.fieldLabel} htmlFor="crown-chase-online-code">
                Código da sala
              </label>
              <input
                id="crown-chase-online-code"
                className={styles.input}
                value={roomInput}
                maxLength={4}
                onChange={(event) => setRoomInput(event.target.value.toUpperCase())}
                placeholder="AB12"
              />
            </div>

              <button
                className={styles.primaryButton}
                onClick={handleJoinRoom}
                disabled={isBusy}
              >
                {isBusy ? "Entrando..." : "Entrar"}
              </button>
            </div>
          )}

          {isWaiting && (
            <div className={styles.waitingBox}>
              <div className={styles.waitingTitle}>Aguardando oponente...</div>

              <div className={styles.waitingLayout}>
                <div className={styles.waitingCodeColumn}>
                  <div className={styles.codeBox}>{roomCode}</div>
                  <button className={styles.secondaryButton} onClick={handleCopyCode}>
                    Copiar Código
                  </button>
                  {copyFeedback && <p className={styles.feedback}>{copyFeedback}</p>}
                </div>

                <div className={styles.waitingInfoColumn}>
                  <p className={styles.waitingText}>
                    Compartilhe este código para outro jogador entrar na sala.
                  </p>
                  {opponent && (
                    <p className={styles.waitingText}>
                      Oponente conectado: {opponent.name}
                    </p>
                  )}
                  <button className={styles.leaveButton} onClick={handleLeaveRoom}>
                    Cancelar Sala
                  </button>
                </div>
              </div>
            </div>
          )}

          {isDisconnected && (
            <div className={styles.waitingBox}>
              <div className={styles.waitingTitle}>Sala indisponível</div>
              <p className={styles.waitingText}>
                {errorMessage ?? "A conexão com a sala foi encerrada."}
              </p>
              <button className={styles.primaryButton} onClick={handleLeaveRoom}>
                Voltar ao início
              </button>
            </div>
          )}

          {errorMessage && !isDisconnected && (
            <p className={styles.errorText}>{errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
