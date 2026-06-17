import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "../../routes";
import { useDelayedOnlineWaitHint } from "../../Shared/Hooks/useDelayedOnlineWaitHint";
import { difficulties, type DifficultyKey } from "../Logic/gameConfig";
import { useStopMultiplayer } from "../Hooks/useStopMultiplayer";
import styles from "../styles/multiplayerLobby.module.css";

type LobbyMode = "home" | "join" | "classroom";

const DIFFICULTY_OPTIONS = Object.keys(difficulties) as DifficultyKey[];
const ROUND_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);
const PLAYER_LIMIT_OPTIONS = Array.from({ length: 7 }, (_, index) => index + 2);
const DIFFICULTY_LABELS: Record<DifficultyKey, string> = {
  d1: "Fácil 1",
  d2: "Fácil 2",
  d3: "Médio 1",
  d4: "Médio 2",
  d5: "Difícil 1",
  d6: "Difícil 2",
};

export default function StopMultiplayerLobbyPage() {
  const navigate = useNavigate();
  const {
    connectionStatus,
    roomCode,
    playerName,
    playerId,
    state,
    errorMessage,
    classroomCode,
    openClassroomRooms,
    createRoom,
    joinRoom,
    joinClassroom,
    leaveClassroom,
    updateRoomSettings,
    startMatch,
    leaveRoom,
  } = useStopMultiplayer();

  const [lobbyMode, setLobbyMode] = useState<LobbyMode>("home");
  const [nameInput, setNameInput] = useState(playerName);
  const [roomInput, setRoomInput] = useState("");
  const [classroomInput, setClassroomInput] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
  const showOnlineWaitHint = useDelayedOnlineWaitHint(isBusy);
  const canStart = isHost && (state?.players.length ?? 0) >= 2;
  const roomSettings = state?.settings ?? null;
  const cardClassName = `${styles.card} ${isInRoom ? styles.roomCard : ""}`;

  const settingsSummary = roomSettings
    ? [
        `Nível ${DIFFICULTY_LABELS[roomSettings.difficulty]}`,
        `${roomSettings.roundCount} rodadas`,
        `Até ${roomSettings.playerLimit} jogadores`,
        roomSettings.progressiveDifficulty ? "Progressiva" : "Fixa",
      ]
    : [];

  useEffect(() => {
    if (!isInRoom) {
      setIsSettingsOpen(false);
    }
  }, [isInRoom]);

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
    setClassroomInput("");
    setCopyFeedback("");
    setIsSettingsOpen(false);
  };

  const handleSwitchClassroom = () => {
    leaveClassroom();
    setClassroomInput("");
    setLobbyMode("classroom");
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
        <div className={cardClassName}>
          {!isInRoom && !isDisconnected && !classroomCode && (
            <>
              <div className={styles.heading}>Sala Privada</div>
              <p className={styles.description}>
                Crie uma sala, ajuste as regras e compartilhe o código com a turma.
              </p>

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

                <button
                  className={styles.secondaryButton}
                  onClick={() =>
                    setLobbyMode((currentMode) =>
                      currentMode === "classroom" ? "home" : "classroom",
                    )
                  }
                  disabled={isBusy}
                >
                  {lobbyMode === "classroom" ? "Voltar" : "Entrar em Turma"}
                </button>
              </div>

              {lobbyMode === "join" && (
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
                      onChange={(event) =>
                        setRoomInput(event.target.value.toUpperCase())
                      }
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

              {lobbyMode === "classroom" && (
                <div className={styles.joinBox}>
                  <div className={styles.nameWrap}>
                    <label className={styles.fieldLabel} htmlFor="stop-classroom-code">
                      Código da turma
                    </label>
                    <input
                      id="stop-classroom-code"
                      className={styles.input}
                      value={classroomInput}
                      maxLength={4}
                      onChange={(event) =>
                        setClassroomInput(event.target.value.toUpperCase())
                      }
                      placeholder="ABCD"
                    />
                  </div>

                  <button
                    className={styles.primaryButton}
                    onClick={() => joinClassroom(classroomInput)}
                    disabled={isBusy}
                  >
                    {isBusy ? "Entrando..." : "Entrar na Turma"}
                  </button>
                </div>
              )}
            </>
          )}

          {classroomCode && !isInRoom && !isDisconnected && (
            <div className={styles.classroomBox}>
              <div className={styles.classroomHeader}>
                <div className={styles.sectionTitle}>Turma {classroomCode}</div>
                <button className={styles.leaveButton} onClick={handleSwitchClassroom}>
                  Trocar turma
                </button>
              </div>

              <p className={styles.helperText}>
                Entre em uma sala com vaga ou crie uma nova.
              </p>

              <button
                className={styles.primaryButton}
                onClick={() => createRoom(nameInput, classroomCode)}
                disabled={isBusy}
              >
                Criar Sala para a Turma
              </button>

              <div className={styles.roomList}>
                {openClassroomRooms.length === 0 ? (
                  <p className={styles.waitingText}>
                    Nenhuma sala aberta. Crie a primeira!
                  </p>
                ) : (
                  openClassroomRooms.map((room) => (
                    <div className={styles.openRoomCard} key={room.code}>
                      <div className={styles.openRoomInfo}>
                        <span className={styles.openRoomTitle}>
                          Sala de {room.hostName}
                        </span>
                        <span>
                          {room.playerCount}/{room.playerLimit} jogadores
                        </span>
                        <span>
                          {DIFFICULTY_LABELS[room.difficulty]} · {room.roundCount} rodadas ·{" "}
                          {room.progressiveDifficulty ? "Progressiva" : "Fixa"}
                        </span>
                      </div>
                      <button
                        className={styles.primaryButton}
                        onClick={() => joinRoom(room.code, nameInput)}
                        disabled={isBusy}
                      >
                        Entrar
                      </button>
                    </div>
                  ))
                )}
              </div>
              <button className={styles.secondaryButton} onClick={leaveClassroom}>
                Jogar sem turma
              </button>
            </div>
          )}

          {showOnlineWaitHint && (
            <p className={styles.waitingText}>
              Aguarde um pouco. Isso pode levar até 30 segundos.
            </p>
          )}

          {isInRoom && state && roomSettings && (
            <div className={styles.roomLayout}>
              <div className={styles.heading}>
                {classroomCode ? `Sala da Turma ${classroomCode}` : "Sala Privada"}
              </div>

              <div className={styles.roomHero}>
                <div className={styles.codeGroup}>
                  <span className={styles.eyebrow}>Código da sala</span>
                  <div className={styles.codeBox}>{roomCode}</div>
                  {copyFeedback && <p className={styles.feedback}>{copyFeedback}</p>}
                </div>

                <div className={styles.roomActions}>
                  <div className={styles.statusPill}>
                    Jogadores: {state.players.length}/{roomSettings.playerLimit}
                  </div>
                  <button className={styles.secondaryButton} onClick={handleCopyCode}>
                    Copiar Código
                  </button>
                  {isHost && (
                    <button
                      className={styles.primaryButton}
                      onClick={startMatch}
                      disabled={!canStart}
                    >
                      {canStart ? "Começar Partida" : "Faltam jogadores"}
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.summaryBar}>
                {settingsSummary.map((item) => (
                  <div key={item} className={styles.summaryChip}>
                    {item}
                  </div>
                ))}
                {isHost && (
                  <button
                    className={styles.optionButton}
                    onClick={() => setIsSettingsOpen(true)}
                  >
                    Opções de jogo
                  </button>
                )}
              </div>

              <div className={styles.playersSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>Jogadores</div>
                  <p className={styles.helperText}>
                    {isHost
                      ? "Quando todos entrarem, é só começar."
                      : "Aguardando o anfitrião começar."}
                  </p>
                </div>

                <div className={styles.playerGrid}>
                  {state.players.map((player) => (
                    <div key={player.id} className={styles.playerTile}>
                      <div className={styles.playerTopLine}>
                        <div className={styles.playerIdentity}>
                          <span
                            className={`${styles.connectionDot} ${
                              player.connected ? styles.connected : styles.disconnected
                            }`}
                          />
                          <span className={styles.playerName}>{player.name}</span>
                        </div>
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

              <div className={styles.footerRow}>
                <button className={styles.leaveButton} onClick={handleLeaveRoom}>
                  {isHost ? "Fechar sala" : "Sair da sala"}
                </button>
              </div>

              {isHost && isSettingsOpen && (
                <div
                  className={styles.modalOverlay}
                  onClick={() => setIsSettingsOpen(false)}
                >
                  <div
                    className={styles.settingsModal}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className={styles.modalHeader}>
                      <div className={styles.modalTitle}>Opções de jogo</div>
                      <button
                        className={styles.closeButton}
                        onClick={() => setIsSettingsOpen(false)}
                      >
                        Fechar
                      </button>
                    </div>

                    <div className={styles.settingsGrid}>
                      <label className={styles.settingCard}>
                        <span className={styles.settingTitle}>Dificuldade</span>
                        <select
                          className={styles.settingControl}
                          value={roomSettings.difficulty}
                          onChange={handleDifficultyChange}
                        >
                          {DIFFICULTY_OPTIONS.map((difficulty) => (
                            <option key={difficulty} value={difficulty}>
                              {DIFFICULTY_LABELS[difficulty]}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className={styles.settingCard}>
                        <span className={styles.settingTitle}>Rodadas</span>
                        <select
                          className={styles.settingControl}
                          value={roomSettings.roundCount}
                          onChange={handleRoundsChange}
                        >
                          {ROUND_OPTIONS.map((roundCount) => (
                            <option key={roundCount} value={roundCount}>
                              {roundCount}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className={styles.settingCard}>
                        <span className={styles.settingTitle}>Limite</span>
                        <select
                          className={styles.settingControl}
                          value={roomSettings.playerLimit}
                          onChange={handleLimitChange}
                        >
                          {PLAYER_LIMIT_OPTIONS.map((playerLimit) => (
                            <option key={playerLimit} value={playerLimit}>
                              {playerLimit}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className={`${styles.settingCard} ${styles.toggleCard}`}>
                        <span className={styles.settingTitle}>
                          Dificuldade progressiva
                        </span>
                        <input
                          className={styles.checkbox}
                          type="checkbox"
                          checked={roomSettings.progressiveDifficulty}
                          onChange={handleProgressiveChange}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {isDisconnected && (
            <>
              <div className={styles.heading}>Sala indisponível</div>
              <div className={styles.waitingBox}>
                <p className={styles.waitingText}>
                  {errorMessage ?? "A conexão com a sala foi encerrada."}
                </p>
                <button className={styles.primaryButton} onClick={handleLeaveRoom}>
                  Voltar ao início
                </button>
              </div>
            </>
          )}

          {errorMessage && !isDisconnected && (
            <p className={styles.errorText}>{errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
