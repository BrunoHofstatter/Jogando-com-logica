import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "../../routes";
import { useCacaSomaMultiplayer } from "../Hooks/useCacaSomaMultiplayer";
import type {
  CacaSomaRoomSettings,
  RoomPlayerInfo,
} from "../Logic/multiplayer/protocol";
import styles from "../styles/multiplayerLobby.module.css";

type LobbyMode = "home" | "join";
type DifficultyOption = CacaSomaRoomSettings["difficultyId"];
type TargetScoreOption = CacaSomaRoomSettings["targetScore"];

const DIFFICULTY_OPTIONS: DifficultyOption[] = ["easy", "medium", "hard"];
const TARGET_SCORE_OPTIONS: TargetScoreOption[] = [2, 3, 4, 5];
const PLAYER_SLOTS = [0, 1, 2, 3] as const;

const DIFFICULTY_LABELS: Record<DifficultyOption, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

const DEFAULT_SETTINGS: CacaSomaRoomSettings = {
  difficultyId: "medium",
  targetScore: 3,
};

export default function CacaSomaMultiplayerLobbyPage() {
  const navigate = useNavigate();
  const {
    connectionStatus,
    roomCode,
    playerName,
    playerSeat,
    settings,
    players,
    errorMessage,
    createRoom,
    joinRoom,
    updateRoomSettings,
    startMatch,
    leaveRoom,
  } = useCacaSomaMultiplayer();

  const [lobbyMode, setLobbyMode] = useState<LobbyMode>("home");
  const [nameInput, setNameInput] = useState(playerName);
  const [roomInput, setRoomInput] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    setNameInput(playerName);
  }, [playerName]);

  useEffect(() => {
    if ((connectionStatus === "playing" || connectionStatus === "ended") && roomCode) {
      navigate(ROUTES.CACA_SOMA_MP_GAME, { replace: true });
    }
  }, [connectionStatus, navigate, roomCode]);

  const playersBySeat = useMemo(() => {
    const nextPlayers = new Map<number, RoomPlayerInfo>();
    players.forEach((player) => {
      nextPlayers.set(player.seat, player);
    });
    return nextPlayers;
  }, [players]);

  const localPlayer = useMemo(
    () => players.find((player) => player.seat === playerSeat) ?? null,
    [playerSeat, players],
  );

  const isHost = localPlayer?.isHost === true;
  const roomPlayersCount = players.length;
  const isBusy = connectionStatus === "connecting";
  const isInRoom = roomCode !== null && connectionStatus !== "disconnected";
  const isDisconnected = connectionStatus === "disconnected" && roomCode !== null;
  const roomSettings = settings ?? DEFAULT_SETTINGS;
  const canStart = isHost && roomPlayersCount === 4 && players.every((player) => player.connected);

  const settingsSummary = [
    "2 contra 2",
    DIFFICULTY_LABELS[roomSettings.difficultyId],
    `Primeiro a ${roomSettings.targetScore}`,
  ];

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
    setCopyFeedback("");
    setIsSettingsOpen(false);
  };

  const handleDifficultyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateRoomSettings({
      difficultyId: event.target.value as DifficultyOption,
    });
  };

  const handleTargetScoreChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateRoomSettings({
      targetScore: Number(event.target.value) as TargetScoreOption,
    });
  };

  const goBackToRules = () => {
    navigate(ROUTES.CACA_SOMA_RULES);
  };

  return (
    <div className={styles.page}>
      <div className={styles.previewColumn}>
        <div className={styles.title}>Caça Soma Online</div>
        <img
          src={`${import.meta.env.BASE_URL}cacasomaPreview.png`}
          className={styles.preview}
          alt="Prévia do jogo Caça Soma"
        />
      </div>

      <div className={styles.panel}>
        <div className={`${styles.card} ${isInRoom ? styles.roomCard : ""}`}>
          {!isInRoom && !isDisconnected && (
            <>
              <div className={styles.heading}>Sala Privada</div>
              <p className={styles.description}>
                Monte duas duplas, crie a sala e ajuste as regras com o anfitrião.
              </p>

              <div className={styles.nameWrap}>
                <label className={styles.fieldLabel} htmlFor="caca-soma-online-name">
                  Seu nome
                </label>
                <input
                  id="caca-soma-online-name"
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

              {lobbyMode === "join" && (
                <div className={styles.joinBox}>
                  <div className={styles.nameWrap}>
                    <label className={styles.fieldLabel} htmlFor="caca-soma-online-code">
                      Código da sala
                    </label>
                    <input
                      id="caca-soma-online-code"
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
            </>
          )}

          {isInRoom && roomCode && (
            <div className={styles.roomLayout}>
              <div className={styles.heading}>Sala Privada</div>

              <div className={styles.roomHero}>
                <div className={styles.codeGroup}>
                  <span className={styles.eyebrow}>Código da sala</span>
                  <div className={styles.codeBox}>{roomCode}</div>
                  {copyFeedback && <p className={styles.feedback}>{copyFeedback}</p>}
                </div>

                <div className={styles.roomActions}>
                  <div className={styles.statusPill}>
                    Jogadores: {roomPlayersCount}/4
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
                  {!isHost && (
                    <div className={styles.waitingNote}>
                      Aguardando o anfitrião começar.
                    </div>
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
                    className={`${styles.secondaryButton} ${styles.optionButton}`}
                    onClick={() => setIsSettingsOpen(true)}
                  >
                    Opções de jogo
                  </button>
                )}
              </div>

              <div className={styles.playersSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>Times</div>
                  <p className={styles.helperText}>
                    {isHost
                      ? "Quando todos entrarem, é só começar."
                      : "Espere o anfitrião organizar a sala."}
                  </p>
                </div>

                <div className={styles.playerGrid}>
                  {PLAYER_SLOTS.map((slot) => {
                    const player = playersBySeat.get(slot) ?? null;
                    const teamLabel = slot <= 1 ? "Equipe A" : "Equipe B";
                    const seatLabel = slot % 2 === 0 ? "Jogador 1" : "Jogador 2";

                    return (
                      <div key={slot} className={styles.playerTile}>
                        <div className={styles.playerTopLine}>
                          <div className={styles.playerIdentity}>
                            <span
                              className={`${styles.connectionDot} ${
                                player?.connected ? styles.connected : styles.disconnected
                              }`}
                            />
                            <span className={styles.playerName}>
                              {player?.name ?? "Aguardando..."}
                            </span>
                          </div>
                          {player?.isHost && (
                            <span className={styles.hostBadge}>Anfitrião</span>
                          )}
                        </div>
                        <span className={styles.playerMeta}>{teamLabel}</span>
                        <span className={styles.playerMeta}>{seatLabel}</span>
                      </div>
                    );
                  })}
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
                    className={`${styles.card} ${styles.settingsModal}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className={styles.modalHeader}>
                      <div className={styles.modalTitle}>Opções de jogo</div>
                      <button
                        className={styles.secondaryButton}
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
                          value={roomSettings.difficultyId}
                          onChange={handleDifficultyChange}
                        >
                          {DIFFICULTY_OPTIONS.map((difficultyId) => (
                            <option key={difficultyId} value={difficultyId}>
                              {DIFFICULTY_LABELS[difficultyId]}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className={styles.settingCard}>
                        <span className={styles.settingTitle}>Pontos para vencer</span>
                        <select
                          className={styles.settingControl}
                          value={roomSettings.targetScore}
                          onChange={handleTargetScoreChange}
                        >
                          {TARGET_SCORE_OPTIONS.map((targetScore) => (
                            <option key={targetScore} value={targetScore}>
                              {targetScore}
                            </option>
                          ))}
                        </select>
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
                <div className={styles.actions}>
                  <button className={styles.primaryButton} onClick={handleLeaveRoom}>
                    Voltar ao início
                  </button>
                  <button className={styles.secondaryButton} onClick={goBackToRules}>
                    Regras
                  </button>
                </div>
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
