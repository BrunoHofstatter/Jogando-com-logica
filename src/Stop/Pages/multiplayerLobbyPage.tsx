import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "../../routes";
import { difficulties, type DifficultyKey } from "../Logic/gameConfig";
import { useStopMultiplayer } from "../Hooks/useStopMultiplayer";
import styles from "../styles/multiplayerLobby.module.css";

type LobbyMode = "home" | "join";

const DIFFICULTY_OPTIONS = Object.keys(difficulties) as DifficultyKey[];
const ROUND_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);
const PLAYER_LIMIT_OPTIONS = Array.from({ length: 7 }, (_, index) => index + 2);

export default function StopMultiplayerLobbyPage() {
  const navigate = useNavigate();
  const {
    connectionStatus,
    roomCode,
    playerName,
    playerId,
    state,
    errorMessage,
    createRoom,
    joinRoom,
    updateRoomSettings,
    startMatch,
    leaveRoom,
  } = useStopMultiplayer();

  const [lobbyMode, setLobbyMode] = useState<LobbyMode>("home");
  const [nameInput, setNameInput] = useState(playerName);
  const [roomInput, setRoomInput] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");

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
    setNameInput(playerName);
  }, [playerName]);

  useEffect(() => {
    if ((connectionStatus === "playing" || connectionStatus === "ended") && roomCode) {
      navigate(ROUTES.STOP_MP_GAME, { replace: true });
    }
  }, [connectionStatus, navigate, roomCode]);

  const localPlayer = useMemo(
    () => state?.players.find((player) => player.id === playerId) ?? null,
    [playerId, state],
  );
  const isHost = localPlayer?.isHost === true;
  const isBusy = connectionStatus === "connecting";
  const isInRoom = roomCode !== null && state !== null && state.status === "lobby";
  const isDisconnected = connectionStatus === "disconnected" && roomCode !== null;
  const canStart = isHost && (state?.players.length ?? 0) >= 2;

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

  const handleDifficultyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateRoomSettings({
      difficulty: event.target.value as DifficultyKey,
    });
  };

  const handleRoundsChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateRoomSettings({
      roundCount: Number(event.target.value),
    });
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateRoomSettings({
      playerLimit: Number(event.target.value),
    });
  };

  const handleProgressiveChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateRoomSettings({
      progressiveDifficulty: event.target.checked,
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.previewColumn}>
        <div className={styles.title}>Stop Matemático Online</div>
        <img
          src={`${import.meta.env.BASE_URL}stopPreview.png`}
          className={styles.preview}
          alt="Prévia do jogo Stop Matemático"
        />
      </div>

      <div className={styles.panel}>
        <div className={styles.card}>
          <div className={styles.heading}>Sala Privada</div>
          <p className={styles.description}>
            Crie uma sala, ajuste as regras e compartilhe o código com a turma.
          </p>

          {!isInRoom && !isDisconnected && (
            <>
              <div className={styles.nameWrap}>
                <label className={styles.fieldLabel} htmlFor="stop-online-name">
                  Seu nome
                </label>
                <input
                  id="stop-online-name"
                  className={styles.input}
                  value={nameInput}
                  maxLength={20}
                  onChange={(event) => setNameInput(event.target.value)}
                  placeholder="Digite seu nome"
                />
              </div>

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
            </>
          )}

          {lobbyMode === "join" && !isInRoom && !isDisconnected && (
            <div className={styles.joinBox}>
              <div className={styles.nameWrap}>
                <label className={styles.fieldLabel} htmlFor="stop-online-code">
                  Código da sala
                </label>
                <input
                  id="stop-online-code"
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

          {isInRoom && state && (
            <div className={styles.waitingBox}>
              <div className={styles.waitingTitle}>Sala pronta para começar</div>

              <div className={styles.waitingLayout}>
                <div className={styles.waitingCodeColumn}>
                  <div className={styles.codeBox}>{roomCode}</div>
                  <button className={styles.secondaryButton} onClick={handleCopyCode}>
                    Copiar Código
                  </button>
                  {copyFeedback && <p className={styles.feedback}>{copyFeedback}</p>}
                  <div className={styles.statusPill}>
                    Jogadores: {state.players.length}/{state.settings.playerLimit}
                  </div>
                </div>

                <div className={styles.waitingInfoColumn}>
                  <div className={styles.roomGrid}>
                    <div className={styles.playersBox}>
                      <div className={styles.sectionTitle}>Jogadores</div>
                      <div className={styles.playerList}>
                        {state.players.map((player) => (
                          <div key={player.id} className={styles.playerItem}>
                            <div className={styles.playerNameRow}>
                              <span>{player.name}</span>
                              {player.isHost && (
                                <span className={styles.hostBadge}>Anfitrião</span>
                              )}
                            </div>
                            <span className={styles.playerMeta}>
                              {player.connected ? "Conectado" : "Desconectado"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={styles.settingsBox}>
                      <div className={styles.sectionTitle}>Configurações</div>

                      <label className={styles.settingRow}>
                        <span className={styles.settingLabel}>Dificuldade</span>
                        <select
                          className={styles.settingControl}
                          value={state.settings.difficulty}
                          onChange={handleDifficultyChange}
                          disabled={!isHost}
                        >
                          {DIFFICULTY_OPTIONS.map((difficulty) => (
                            <option key={difficulty} value={difficulty}>
                              {difficulty.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className={styles.settingRow}>
                        <span className={styles.settingLabel}>Rodadas</span>
                        <select
                          className={styles.settingControl}
                          value={state.settings.roundCount}
                          onChange={handleRoundsChange}
                          disabled={!isHost}
                        >
                          {ROUND_OPTIONS.map((roundCount) => (
                            <option key={roundCount} value={roundCount}>
                              {roundCount}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className={styles.settingRow}>
                        <span className={styles.settingLabel}>Limite</span>
                        <select
                          className={styles.settingControl}
                          value={state.settings.playerLimit}
                          onChange={handleLimitChange}
                          disabled={!isHost}
                        >
                          {PLAYER_LIMIT_OPTIONS.map((playerLimit) => (
                            <option key={playerLimit} value={playerLimit}>
                              {playerLimit}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className={`${styles.settingRow} ${styles.checkboxRow}`}>
                        <span className={styles.settingLabel}>Dificuldade progressiva</span>
                        <input
                          className={styles.checkbox}
                          type="checkbox"
                          checked={state.settings.progressiveDifficulty}
                          onChange={handleProgressiveChange}
                          disabled={!isHost}
                        />
                      </label>
                    </div>
                  </div>

                  <div className={styles.noticeBox}>
                    {isHost
                      ? "Você é o anfitrião. Ajuste as configurações e comece quando quiser."
                      : "Aguardando o anfitrião ajustar as configurações e iniciar a partida."}
                  </div>

                  <div className={styles.waitingActions}>
                    {isHost && (
                      <button
                        className={styles.primaryButton}
                        onClick={startMatch}
                        disabled={!canStart}
                      >
                        {canStart ? "Começar Partida" : "Aguardando jogadores"}
                      </button>
                    )}
                    <button className={styles.leaveButton} onClick={handleLeaveRoom}>
                      Cancelar Sala
                    </button>
                  </div>
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
