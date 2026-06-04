import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "../../routes";
import { useMathWarMultiplayer } from "../Hooks/useMathWarMultiplayer";
import styles from "../styles/multiplayerLobby.module.css";

type LobbyMode = "home" | "join" | "classroom";

export default function MathWarMultiplayerLobbyPage() {
  const navigate = useNavigate();
  const {
    connectionStatus,
    roomCode,
    playerName,
    playerSeat,
    players,
    classroomCode,
    openClassroomRooms,
    errorMessage,
    createRoom,
    joinRoom,
    joinClassroom,
    leaveClassroom,
    leaveRoom,
  } = useMathWarMultiplayer();

  const [lobbyMode, setLobbyMode] = useState<LobbyMode>("home");
  const [nameInput, setNameInput] = useState(playerName);
  const [roomInput, setRoomInput] = useState("");
  const [classroomInput, setClassroomInput] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");

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
    setNameInput(playerName);
  }, [playerName]);

  useEffect(() => {
    if ((connectionStatus === "playing" || connectionStatus === "ended") && roomCode) {
      navigate(ROUTES.MATH_WAR_MP_GAME, { replace: true });
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
    setClassroomInput("");
    setCopyFeedback("");
  };

  return (
    <div className={styles.page}>
      <div className={styles.previewColumn}>
        <div className={styles.title}>Guerra Matemática Online</div>
        <img
          src={`${import.meta.env.BASE_URL}mathwarPreview.png`}
          className={styles.preview}
          alt="Prévia do jogo Guerra Matemática"
        />
      </div>

      <div className={styles.panel}>
        <div className={styles.card}>
          <div className={styles.heading}>Sala Privada</div>
          <p className={styles.description}>
            Crie uma sala e compartilhe o código com outro jogador.
          </p>

          <div className={styles.nameWrap}>
            <label className={styles.fieldLabel} htmlFor="math-war-online-name">
              Seu nome
            </label>
            <input
              id="math-war-online-name"
              className={styles.input}
              value={nameInput}
              maxLength={20}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder="Digite seu nome"
            />
          </div>

          {!isWaiting && !isDisconnected && !classroomCode && (
            <div className={styles.actions}>
              <button
                className={styles.primaryButton}
                onClick={handleCreateRoom}
                disabled={isBusy}
              >
                {isBusy && lobbyMode === "home" ? "Conectando..." : "Criar Sala Privada"}
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
          )}

          {lobbyMode === "join" && !isWaiting && !isDisconnected && !classroomCode && (
            <div className={styles.joinBox}>
              <div className={styles.nameWrap}>
                <label className={styles.fieldLabel} htmlFor="math-war-online-code">
                Código da sala
                </label>
                <input
                id="math-war-online-code"
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

          {lobbyMode === "classroom" && !classroomCode && !isWaiting && !isDisconnected && (
            <div className={styles.joinBox}>
              <div className={styles.nameWrap}>
                <label className={styles.fieldLabel} htmlFor="math-war-classroom-code">
                  Código da turma
                </label>
                <input
                  id="math-war-classroom-code"
                  className={styles.input}
                  value={classroomInput}
                  maxLength={4}
                  onChange={(event) => setClassroomInput(event.target.value.toUpperCase())}
                  placeholder="BKRM"
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

          {classroomCode && !isWaiting && !isDisconnected && (
            <div className={styles.classroomBox}>
              <div className={styles.classroomHeader}>
                <div className={styles.waitingTitle}>Turma {classroomCode}</div>
                <button className={styles.leaveButton} onClick={leaveClassroom}>
                  Sair da Turma
                </button>
              </div>

              <button
                className={styles.primaryButton}
                onClick={() => createRoom(nameInput, classroomCode)}
              >
                Criar Sala para a Turma
              </button>

              <div className={styles.roomList}>
                {openClassroomRooms.length === 0 ? (
                  <p className={styles.waitingText}>Nenhuma sala aberta. Crie a primeira!</p>
                ) : (
                  openClassroomRooms.map((room) => (
                    <div className={styles.openRoomCard} key={room.code}>
                      <span>Sala de {room.hostName}</span>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => joinRoom(room.code, nameInput)}
                      >
                        Entrar
                      </button>
                    </div>
                  ))
                )}
              </div>
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
