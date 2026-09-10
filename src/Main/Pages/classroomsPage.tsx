import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { io, type Socket } from "socket.io-client";

import type {
  CrownChaseClientToServerEvents,
  CrownChaseServerToClientEvents,
  ClassroomMonitorRoom,
  ManagedClassroom,
} from "../../CrownChase/Logic/multiplayer/protocol";
import { useDelayedOnlineWaitHint } from "../../Shared/Hooks/useDelayedOnlineWaitHint";
import { ClassroomCreationTracker } from "../../analytics/ClassroomCreationTracker";
import styles from "../CSS/classrooms.module.css";

const STORAGE_KEY = "managed_classroom_tokens_v1";
const CLASSROOM_CREATION_TIMEOUT_MS = 35_000;
let classroomCreationSequence = 0;

type ClassroomSocket = Socket<
  CrownChaseServerToClientEvents,
  CrownChaseClientToServerEvents
>;

export default function ClassroomsPage() {
  const [socket, setSocket] = useState<ClassroomSocket | null>(null);
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [classrooms, setClassrooms] = useState<ManagedClassroom[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [openMonitorCodes, setOpenMonitorCodes] = useState<string[]>([]);
  const [monitorRooms, setMonitorRooms] = useState<Record<string, ClassroomMonitorRoom[]>>({});
  const [loadingMonitorCodes, setLoadingMonitorCodes] = useState<string[]>([]);
  const [isCreatingClassroom, setIsCreatingClassroom] = useState(false);
  const openMonitorCodesRef = useRef<string[]>([]);
  const creationTrackerRef = useRef(new ClassroomCreationTracker());
  const creationTimeoutRef = useRef<number | null>(null);
  const activeCreationRequestIdRef = useRef<string | null>(null);
  const isConnectingToServer = socket !== null && !isServerConnected;
  const showOnlineWaitHint = useDelayedOnlineWaitHint(isConnectingToServer);

  const clearCreationTimeout = useCallback(() => {
    if (creationTimeoutRef.current !== null) {
      window.clearTimeout(creationTimeoutRef.current);
      creationTimeoutRef.current = null;
    }
  }, []);

  const cancelPendingCreation = useCallback(() => {
    clearCreationTimeout();
    creationTrackerRef.current.cancel();
    activeCreationRequestIdRef.current = null;
    setIsCreatingClassroom(false);
  }, [clearCreationTimeout]);

  useEffect(() => {
    const creationTracker = creationTrackerRef.current;
    const serverUrl = import.meta.env.VITE_MULTIPLAYER_SERVER_URL;
    if (!serverUrl) {
      setErrorMessage("O servidor online ainda não foi configurado.");
      return;
    }

    const nextSocket: ClassroomSocket = io(serverUrl, {
      transports: ["websocket"],
    });
    const refreshClassrooms = () => {
      if (!nextSocket.connected) {
        return;
      }

      nextSocket.emit("list_managed_classrooms", {
        managementTokens: loadManagementTokens(),
      });
    };

    nextSocket.on("connect", () => {
      setIsServerConnected(true);
      setErrorMessage(null);
      refreshClassrooms();
    });
    nextSocket.on("disconnect", () => {
      setIsServerConnected(false);
      cancelPendingCreation();
      setLoadingMonitorCodes(openMonitorCodesRef.current);
    });
    nextSocket.on("classroom_created", ({ requestId, classroom }) => {
      const correlatedRequestId = requestId ?? activeCreationRequestIdRef.current;
      if (correlatedRequestId && creationTracker.succeed(correlatedRequestId)) {
        clearCreationTimeout();
        activeCreationRequestIdRef.current = null;
        setIsCreatingClassroom(false);
      }
      saveManagementTokens([...loadManagementTokens(), classroom.managementToken]);
      setClassrooms((current) => [...current, classroom]);
      setErrorMessage(null);
    });
    nextSocket.on("classroom_create_failed", ({ requestId, code, message }) => {
      const correlatedRequestId = requestId ?? activeCreationRequestIdRef.current;
      if (!correlatedRequestId || !creationTracker.fail(correlatedRequestId, code)) {
        return;
      }
      clearCreationTimeout();
      activeCreationRequestIdRef.current = null;
      setIsCreatingClassroom(false);
      setErrorMessage(message);
    });
    nextSocket.on("managed_classrooms", ({ classrooms: managedClassrooms }) => {
      setClassrooms(managedClassrooms);
      saveManagementTokens(managedClassrooms.map((classroom) => classroom.managementToken));
      managedClassrooms
        .filter((classroom) => openMonitorCodesRef.current.includes(classroom.code))
        .forEach((classroom) => {
          nextSocket.emit("watch_classroom", {
            code: classroom.code,
            managementToken: classroom.managementToken,
          });
        });
    });
    nextSocket.on("classroom_deleted", ({ code }) => {
      setClassrooms((current) => current.filter((classroom) => classroom.code !== code));
      setOpenMonitorCodes((current) => current.filter((openCode) => openCode !== code));
      openMonitorCodesRef.current = openMonitorCodesRef.current.filter(
        (openCode) => openCode !== code,
      );
    });
    nextSocket.on("classroom_monitor_updated", ({ classroomCode, rooms }) => {
      setMonitorRooms((current) => ({ ...current, [classroomCode]: rooms }));
      setLoadingMonitorCodes((current) =>
        current.filter((openCode) => openCode !== classroomCode),
      );
    });
    nextSocket.on("classroom_unavailable", ({ classroomCode }) => {
      setClassrooms((current) =>
        current.filter((classroom) => classroom.code !== classroomCode),
      );
      setOpenMonitorCodes((current) =>
        current.filter((openCode) => openCode !== classroomCode),
      );
      openMonitorCodesRef.current = openMonitorCodesRef.current.filter(
        (openCode) => openCode !== classroomCode,
      );
    });
    nextSocket.on("multiplayer_error", ({ message }) => {
      setErrorMessage(message);
      setLoadingMonitorCodes([]);
    });
    nextSocket.on("connect_error", () => {
      setIsServerConnected(false);
      cancelPendingCreation();
    });

    const refreshInterval = window.setInterval(refreshClassrooms, 60 * 1000);
    setSocket(nextSocket);

    return () => {
      window.clearInterval(refreshInterval);
      clearCreationTimeout();
      creationTracker.cancel();
      nextSocket.disconnect();
    };
  }, [cancelPendingCreation, clearCreationTimeout]);

  const createClassroom = () => {
    if (!socket || !isServerConnected) {
      return;
    }

    classroomCreationSequence += 1;
    const requestId = `${Date.now()}-${classroomCreationSequence}`;
    if (!creationTrackerRef.current.start(requestId)) {
      return;
    }
    activeCreationRequestIdRef.current = requestId;

    setErrorMessage(null);
    setIsCreatingClassroom(true);
    clearCreationTimeout();
    creationTimeoutRef.current = window.setTimeout(() => {
      if (!creationTrackerRef.current.fail(requestId, "timeout")) {
        return;
      }

      creationTimeoutRef.current = null;
      if (activeCreationRequestIdRef.current === requestId) {
        activeCreationRequestIdRef.current = null;
      }
      setIsCreatingClassroom(false);
      setErrorMessage("A criação da turma demorou demais. Tente novamente.");
    }, CLASSROOM_CREATION_TIMEOUT_MS);
    socket.emit("create_classroom", { requestId });
  };

  const deleteClassroom = (classroom: ManagedClassroom) => {
    socket?.emit("delete_classroom", {
      code: classroom.code,
      managementToken: classroom.managementToken,
    });
  };

  const copyClassroomCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyFeedback(`Código ${code} copiado!`);
    } catch {
      setCopyFeedback("Não foi possível copiar o código.");
    }

    window.setTimeout(() => setCopyFeedback(""), 2000);
  };

  const toggleClassroomMonitor = (classroom: ManagedClassroom) => {
    const isOpen = openMonitorCodes.includes(classroom.code);
    const nextOpenCodes = isOpen
      ? openMonitorCodes.filter((code) => code !== classroom.code)
      : [...openMonitorCodes, classroom.code];

    setOpenMonitorCodes(nextOpenCodes);
    openMonitorCodesRef.current = nextOpenCodes;

    if (isOpen) {
      socket?.emit("unwatch_classroom", {
        code: classroom.code,
        managementToken: classroom.managementToken,
      });
      setLoadingMonitorCodes((current) =>
        current.filter((code) => code !== classroom.code),
      );
      return;
    }

    setLoadingMonitorCodes((current) => [...new Set([...current, classroom.code])]);
    socket?.emit("watch_classroom", {
      code: classroom.code,
      managementToken: classroom.managementToken,
    });
  };

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h1>Turmas Online</h1>
        <p className={styles.description}>
          Crie uma turma temporária para organizar partidas online com seus alunos.
        </p>

        <button
          className={styles.explanationToggle}
          onClick={() => setIsExplanationOpen((current) => !current)}
          aria-expanded={isExplanationOpen}
          aria-controls="classroom-explanation"
        >
          Como funciona?
          <ChevronDown
            className={`${styles.explanationArrow} ${
              isExplanationOpen ? styles.explanationArrowOpen : ""
            }`}
            aria-hidden="true"
          />
        </button>

        {isExplanationOpen && (
          <div className={styles.explanation} id="classroom-explanation">
            <p>
              Uma turma reúne as salas abertas pelos alunos em todos os jogos online
              compatíveis. O mesmo código acompanha os alunos enquanto eles trocam de jogo.
            </p>
            <ol>
              <li>Crie uma turma.</li>
              <li>Escreva o código de quatro letras no quadro.</li>
              <li>Os alunos entram em <strong>Turma</strong> em qualquer jogo online.</li>
              <li>Ao trocar de jogo, a turma será reconhecida automaticamente.</li>
            </ol>
            <p className={styles.explanationNote}>
              A turma dura 8 horas, não exige cadastro e só pode ser excluída neste dispositivo.
            </p>
          </div>
        )}

        <button
          className={styles.primaryButton}
          onClick={createClassroom}
          disabled={!socket || !isServerConnected || isCreatingClassroom}
        >
          {isConnectingToServer
            ? "Conectando..."
            : isCreatingClassroom
              ? "Criando turma..."
              : "Criar Nova Turma"}
        </button>

        {showOnlineWaitHint && (
          <p className={styles.emptyText}>
            Aguarde um pouco. Isso pode levar até 30 segundos.
          </p>
        )}
        {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
        {copyFeedback && <p className={styles.feedback}>{copyFeedback}</p>}

        <div className={styles.classroomList}>
          {classrooms.length === 0 && isConnectingToServer ? (
            <p className={styles.emptyText}>Conectando ao servidor online...</p>
          ) : classrooms.length === 0 ? (
            <p className={styles.emptyText}>Nenhuma turma temporária criada neste dispositivo.</p>
          ) : (
            classrooms.map((classroom) => (
              <article className={styles.classroomCard} key={classroom.code}>
                <div className={styles.classroomHeader}>
                  <div>
                    <div className={styles.code}>{classroom.code}</div>
                    <p className={styles.detail}>
                      Expira às {formatExpiry(classroom.expiresAt)}
                    </p>
                  </div>

                  <div className={styles.actions}>
                    <button
                      className={styles.secondaryButton}
                      onClick={() => copyClassroomCode(classroom.code)}
                    >
                      Copiar Código
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => deleteClassroom(classroom)}
                    >
                      Excluir Turma
                    </button>
                  </div>
                </div>

                <button
                  className={styles.monitorToggle}
                  onClick={() => toggleClassroomMonitor(classroom)}
                  disabled={!isServerConnected}
                  aria-expanded={openMonitorCodes.includes(classroom.code)}
                  aria-controls={`classroom-monitor-${classroom.code}`}
                >
                  Acompanhar salas
                  <ChevronDown
                    className={`${styles.monitorArrow} ${
                      openMonitorCodes.includes(classroom.code)
                        ? styles.monitorArrowOpen
                        : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {openMonitorCodes.includes(classroom.code) && (
                  <ClassroomMonitorPanel
                    classroomCode={classroom.code}
                    rooms={monitorRooms[classroom.code] ?? []}
                    isLoading={loadingMonitorCodes.includes(classroom.code)}
                  />
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

type ClassroomMonitorPanelProps = {
  classroomCode: string;
  rooms: ClassroomMonitorRoom[];
  isLoading: boolean;
};

function ClassroomMonitorPanel({
  classroomCode,
  rooms,
  isLoading,
}: ClassroomMonitorPanelProps) {
  const playerCount = rooms.reduce((total, room) => total + room.players.length, 0);

  return (
    <section className={styles.monitorPanel} id={`classroom-monitor-${classroomCode}`}>
      {isLoading ? (
        <p className={styles.monitorMessage}>Atualizando salas...</p>
      ) : rooms.length === 0 ? (
        <p className={styles.monitorMessage}>Nenhuma sala criada nesta turma ainda.</p>
      ) : (
        <>
          <p className={styles.monitorSummary}>
            {formatCount(rooms.length, "sala", "salas")} · {formatCount(playerCount, "aluno nas salas", "alunos nas salas")}
          </p>
          <div className={styles.monitorRoomList}>
            {rooms.map((room) => (
              <article className={styles.monitorRoom} key={`${room.game}-${room.code}`}>
                <div className={styles.monitorRoomHeader}>
                  <h2>{GAME_NAMES[room.game]} · Sala {room.code}</h2>
                  <span className={`${styles.statusBadge} ${styles[`status_${room.status}`]}`}>
                    {STATUS_NAMES[room.status]}
                  </span>
                </div>
                <p className={styles.occupancy}>
                  {room.players.length}/{room.capacity} jogadores
                </p>
                <ul className={styles.playerList}>
                  {room.players.map((player, index) => (
                    <li key={`${player.name}-${index}`}>
                      {player.name}
                      {!player.connected && (
                        <span className={styles.disconnectedLabel}> desconectado</span>
                      )}
                    </li>
                  ))}
                </ul>
                {room.status === "waiting" && room.players.length < room.capacity && (
                  <p className={styles.availableSeats}>
                    {formatCount(
                      room.capacity - room.players.length,
                      "vaga disponível",
                      "vagas disponíveis",
                    )}
                  </p>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

const GAME_NAMES: Record<ClassroomMonitorRoom["game"], string> = {
  crown_chase: "Caça Coroa",
  spttt: "Super Jogo da Velha",
  math_war: "Guerra Matemática",
  caca_soma: "Caça Soma",
  stop: "Stop Matemático",
  bomb_game: "Jogo da Bomba",
};

const STATUS_NAMES: Record<ClassroomMonitorRoom["status"], string> = {
  waiting: "Aguardando jogadores",
  playing: "Em andamento",
  ended: "Finalizada",
};

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function loadManagementTokens(): string[] {
  try {
    const storedTokens = window.localStorage.getItem(STORAGE_KEY);
    return storedTokens ? JSON.parse(storedTokens) : [];
  } catch {
    return [];
  }
}

function saveManagementTokens(tokens: string[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(tokens)]));
}

function formatExpiry(expiresAt: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(expiresAt);
}
