import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "../../routes";
import { useSPTTTMultiplayer } from "../Hooks/useSPTTTMultiplayer";
import styles from "../Style/multiplayerLobby.module.css";

type LobbyMode = "home" | "join";

export default function SPTTTMultiplayerLobbyPage() {
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
  } = useSPTTTMultiplayer();

  const [lobbyMode, setLobbyMode] = useState<LobbyMode>("home");
  const [nameInput, setNameInput] = useState(playerName);
  const [roomInput, setRoomInput] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");

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
    setNameInput(playerName);
  }, [playerName]);

  useEffect(() => {
    if ((connectionStatus === "playing" || connectionStatus === "ended") && roomCode) {
      navigate(ROUTES.SPTTT_MP_GAME, { replace: true });
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
      setCopyFeedback("Codigo copiado!");
      window.setTimeout(() => setCopyFeedback(""), 2000);
    } catch {
      setCopyFeedback("Nao foi possivel copiar.");
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
        <div className={styles.title}>Super Jogo da Velha Online</div>
        <img
          src={`${import.meta.env.BASE_URL}sptttPreview.png`}
          className={styles.preview}
          alt="Previa do jogo Super Jogo da Velha"
        />
      </div>

      <div className={styles.panel}>
        <div className={styles.card}>
          <div className={styles.heading}>Sala Privada</div>
          <p className={styles.description}>
            Crie uma sala e compartilhe o codigo com outro jogador.
          </p>

          <div className={styles.nameWrap}>
            <label className={styles.fieldLabel} htmlFor="spttt-online-name">
              Seu nome
            </label>
            <input
              id="spttt-online-name"
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
                <label className={styles.fieldLabel} htmlFor="spttt-online-code">
                  Codigo da sala
                </label>
                <input
                  id="spttt-online-code"
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
                    Copiar Codigo
                  </button>
                  {copyFeedback && <p className={styles.feedback}>{copyFeedback}</p>}
                </div>

                <div className={styles.waitingInfoColumn}>
                  <p className={styles.waitingText}>
                    Compartilhe este codigo para outro jogador entrar na sala.
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
              <div className={styles.waitingTitle}>Sala indisponivel</div>
              <p className={styles.waitingText}>
                {errorMessage ?? "A conexao com a sala foi encerrada."}
              </p>
              <button className={styles.primaryButton} onClick={handleLeaveRoom}>
                Voltar ao inicio
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
