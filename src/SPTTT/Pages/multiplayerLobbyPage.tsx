import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "../../routes";
import { useDelayedOnlineWaitHint } from "../../Shared/Hooks/useDelayedOnlineWaitHint";
import { useSPTTTMultiplayer } from "../Hooks/useSPTTTMultiplayer";
import styles from "../Style/multiplayerLobby.module.css";

type LobbyMode = "home" | "join" | "classroom";

export default function SPTTTMultiplayerLobbyPage() {
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
  } = useSPTTTMultiplayer();

  const [lobbyMode, setLobbyMode] = useState<LobbyMode>("home");
  const [nameInput, setNameInput] = useState(playerName);
  const [roomInput, setRoomInput] = useState("");
  const [classroomInput, setClassroomInput] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");


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
  const showOnlineWaitHint = useDelayedOnlineWaitHint(isBusy);

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
    setClassroomInput("");
    setCopyFeedback("");
  };

  const handleSwitchClassroom = () => {
    leaveClassroom();
    setClassroomInput("");
    setLobbyMode("classroom");
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
          <div className={styles.heading}>Super Jogo da Velha Online</div>
          <p className={styles.description}>
            Jogue com sua turma ou compartilhe o codigo com outro jogador.
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

          {!isWaiting && !isDisconnected && !classroomCode && (
            <div className={styles.actions}>
              <button
                className={styles.primaryButton}
                onClick={() => createRoom(nameInput)}
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
                onClick={() => joinRoom(roomInput, nameInput)}
                disabled={isBusy}
              >
                {isBusy ? "Entrando..." : "Entrar"}
              </button>
            </div>
          )}

          {lobbyMode === "classroom" && !classroomCode && !isWaiting && !isDisconnected && (
            <div className={styles.joinBox}>
              <div className={styles.nameWrap}>
                <label className={styles.fieldLabel} htmlFor="spttt-classroom-code">
                  Codigo da turma
                </label>
                <input
                  id="spttt-classroom-code"
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
                <button className={styles.leaveButton} onClick={handleSwitchClassroom}>
                  Trocar turma
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
                        onClick={() =>
                          joinRoom(room.code, nameInput, "classroom_room")
                        }
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
