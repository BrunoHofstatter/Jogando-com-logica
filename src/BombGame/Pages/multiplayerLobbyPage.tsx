import { useEffect, useState } from "react";
import { Bomb } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ROUTES } from "../../routes";
import { useDelayedOnlineWaitHint } from "../../Shared/Hooks/useDelayedOnlineWaitHint";
import { useBombGameMultiplayer } from "../Hooks/useBombGameMultiplayer";
import { BOMB_LEVELS, getBombLevel, isBombLevelId } from "../Logic/levelCatalog";
import styles from "../styles/multiplayerLobby.module.css";

type LobbyMode = "home" | "join" | "classroom";

export default function BombGameMultiplayerLobbyPage() {
  const navigate = useNavigate();
  const game = useBombGameMultiplayer();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedLevel = Number(searchParams.get("level"));
  const selectedLevel = isBombLevelId(requestedLevel) ? requestedLevel : 1;
  const displayedLevel = getBombLevel(game.roomCode ? game.levelId : selectedLevel);
  const [mode, setMode] = useState<LobbyMode>("home");
  const [name, setName] = useState(game.playerName);
  const [roomCode, setRoomCode] = useState("");
  const [classroomInput, setClassroomInput] = useState("");
  const [hintsEnabled, setHintsEnabled] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState("");

  useEffect(() => setName(game.playerName), [game.playerName]);
  useEffect(() => {
    if (game.roomCode && game.players.length === 2 && ["room", "playing", "ended"].includes(game.connectionStatus)) {
      navigate(ROUTES.BOMB_GAME_MP_GAME, { replace: true });
    }
  }, [game.connectionStatus, game.players.length, game.roomCode, navigate]);

  const busy = game.connectionStatus === "connecting";
  const waiting = game.connectionStatus === "waiting" && Boolean(game.roomCode);
  const disconnected = game.connectionStatus === "disconnected" && Boolean(game.roomCode);
  const showWaitHint = useDelayedOnlineWaitHint(busy);
  const opponent = game.players.find((player) => player.seat !== game.playerSeat);

  const copyCode = async () => {
    if (!game.roomCode) return;
    try { await navigator.clipboard.writeText(game.roomCode); setCopyFeedback("Código copiado!"); }
    catch { setCopyFeedback("Não foi possível copiar."); }
    window.setTimeout(() => setCopyFeedback(""), 2000);
  };

  const leaveWaitingRoom = () => {
    game.leaveRoom();
    setMode("home");
    setRoomCode("");
  };

  return <div className={styles.page}>
    <section className={styles.previewColumn}>
      <h1 className={styles.title}>Bomb Game Online</h1>
      <div className={styles.bombPreview}><Bomb aria-hidden="true" /></div>
      <p>Nível {displayedLevel.id} · {displayedLevel.title}</p>
    </section>

    <section className={styles.panel}><div className={styles.card}>
      <h2 className={styles.heading}>Bomb Game Online</h2>
      <p className={styles.description}>Jogue com sua turma ou compartilhe um código com seu parceiro.</p>

      <label className={styles.nameRow} htmlFor="bomb-online-name"><span>Seu nome</span><input id="bomb-online-name" value={name} maxLength={20} onChange={(event) => setName(event.target.value)} placeholder="Digite seu nome" /></label>
      {!waiting && !disconnected && <label className={styles.levelRow} htmlFor="bomb-level"><span>Nível para criar sala</span><select id="bomb-level" value={selectedLevel} disabled={busy} onChange={(event) => setSearchParams({ level: event.target.value })}>{BOMB_LEVELS.map((level) => <option key={level.id} value={level.id}>{level.id} · {level.title}</option>)}</select></label>}

      {!waiting && !disconnected && !game.classroomCode && <>
        <label className={styles.hintsToggle}><input type="checkbox" checked={hintsEnabled} onChange={(event) => setHintsEnabled(event.target.checked)} /><span>Dicas ativadas</span></label>
        <div className={styles.actions}>
          <button className={styles.primaryButton} disabled={busy} onClick={() => game.createRoom(name, hintsEnabled, undefined, selectedLevel)}>{busy && mode === "home" ? "Conectando..." : "Criar Sala Privada"}</button>
          <button className={styles.secondaryButton} disabled={busy} onClick={() => setMode((current) => current === "join" ? "home" : "join")}>{mode === "join" ? "Voltar" : "Entrar em Sala"}</button>
          <button className={styles.secondaryButton} disabled={busy} onClick={() => setMode((current) => current === "classroom" ? "home" : "classroom")}>{mode === "classroom" ? "Voltar" : "Entrar em Turma"}</button>
        </div>
      </>}

      {mode === "join" && !waiting && !game.classroomCode && <div className={styles.subcard}><label><span>Código da sala</span><input value={roomCode} maxLength={4} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} placeholder="ABCD" /></label><button className={styles.primaryButton} disabled={busy} onClick={() => game.joinRoom(roomCode, name)}>{busy ? "Entrando..." : "Entrar"}</button></div>}

      {mode === "classroom" && !waiting && !game.classroomCode && <div className={styles.subcard}><label><span>Código da turma</span><input value={classroomInput} maxLength={4} onChange={(event) => setClassroomInput(event.target.value.toUpperCase())} placeholder="BKRM" /></label><button className={styles.primaryButton} disabled={busy} onClick={() => game.joinClassroom(classroomInput)}>{busy ? "Entrando..." : "Entrar na Turma"}</button></div>}

      {game.classroomCode && !waiting && !disconnected && <div className={styles.subcard}>
        <div className={styles.classroomHeader}><h3>Turma {game.classroomCode}</h3><button className={styles.leaveButton} onClick={game.leaveClassroom}>Trocar turma</button></div>
        <label className={styles.hintsToggle}><input type="checkbox" checked={hintsEnabled} onChange={(event) => setHintsEnabled(event.target.checked)} /><span>Dicas ativadas</span></label>
        <button className={styles.primaryButton} disabled={busy} onClick={() => game.createRoom(name, hintsEnabled, game.classroomCode ?? undefined, selectedLevel)}>Criar Sala para a Turma</button>
        <div className={styles.roomList}>{game.openClassroomRooms.length === 0 ? <p>Nenhuma sala aberta. Crie a primeira!</p> : game.openClassroomRooms.map((room) => <article key={room.code} className={styles.openRoom}><span>Sala de {room.hostName}</span><button className={styles.secondaryButton} onClick={() => game.joinRoom(room.code, name, "classroom_room")}>Entrar</button></article>)}</div>
        <button className={styles.secondaryButton} onClick={game.leaveClassroom}>Jogar sem turma</button>
      </div>}

      {waiting && <div className={styles.subcard}>
        <h3>Aguardando parceiro...</h3><div className={styles.waitingGrid}><div><div className={styles.codeBox}>{game.roomCode}</div><button className={styles.secondaryButton} onClick={copyCode}>Copiar Código</button>{copyFeedback && <p className={styles.feedback}>{copyFeedback}</p>}</div><div><p>Compartilhe este código para outra pessoa entrar.</p>{opponent && <p>Parceiro conectado: {opponent.name}</p>}<button className={styles.leaveButton} onClick={leaveWaitingRoom}>Cancelar Sala</button></div></div>
      </div>}

      {disconnected && <div className={styles.subcard}><h3>Sala indisponível</h3><p>{game.errorMessage ?? "A conexão com a sala foi encerrada."}</p><button className={styles.primaryButton} onClick={leaveWaitingRoom}>Voltar ao início</button></div>}
      {showWaitHint && <p className={styles.feedback}>Aguarde um pouco. Isso pode levar até 30 segundos.</p>}
      {game.errorMessage && !disconnected && <p className={styles.error}>{game.errorMessage}</p>}
    </div></section>
  </div>;
}
