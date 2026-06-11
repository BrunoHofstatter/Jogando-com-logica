import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { io, type Socket } from "socket.io-client";

import type {
  CrownChaseClientToServerEvents,
  CrownChaseServerToClientEvents,
  ManagedClassroom,
} from "../../CrownChase/Logic/multiplayer/protocol";
import styles from "../CSS/classrooms.module.css";

const STORAGE_KEY = "managed_classroom_tokens_v1";

type ClassroomSocket = Socket<
  CrownChaseServerToClientEvents,
  CrownChaseClientToServerEvents
>;

export default function ClassroomsPage() {
  const [socket, setSocket] = useState<ClassroomSocket | null>(null);
  const [classrooms, setClassrooms] = useState<ManagedClassroom[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = "#68c2e0";

    const serverUrl = import.meta.env.VITE_MULTIPLAYER_SERVER_URL;
    if (!serverUrl) {
      setErrorMessage("O servidor online ainda não foi configurado.");
      return;
    }

    const nextSocket: ClassroomSocket = io(serverUrl, {
      transports: ["websocket"],
    });
    const refreshClassrooms = () => {
      nextSocket.emit("list_managed_classrooms", {
        managementTokens: loadManagementTokens(),
      });
    };

    nextSocket.on("connect", refreshClassrooms);
    nextSocket.on("classroom_created", ({ classroom }) => {
      saveManagementTokens([...loadManagementTokens(), classroom.managementToken]);
      setClassrooms((current) => [...current, classroom]);
      setErrorMessage(null);
    });
    nextSocket.on("managed_classrooms", ({ classrooms: managedClassrooms }) => {
      setClassrooms(managedClassrooms);
      saveManagementTokens(managedClassrooms.map((classroom) => classroom.managementToken));
    });
    nextSocket.on("classroom_deleted", ({ code }) => {
      setClassrooms((current) => current.filter((classroom) => classroom.code !== code));
    });
    nextSocket.on("multiplayer_error", ({ message }) => {
      setErrorMessage(message);
    });
    nextSocket.on("connect_error", () => {
      setErrorMessage("Não foi possível conectar ao servidor online.");
    });

    const refreshInterval = window.setInterval(refreshClassrooms, 60 * 1000);
    setSocket(nextSocket);

    return () => {
      window.clearInterval(refreshInterval);
      nextSocket.disconnect();
    };
  }, []);

  const createClassroom = () => {
    socket?.emit("create_classroom");
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
          disabled={!socket}
        >
          Criar Nova Turma
        </button>

        {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
        {copyFeedback && <p className={styles.feedback}>{copyFeedback}</p>}

        <div className={styles.classroomList}>
          {classrooms.length === 0 ? (
            <p className={styles.emptyText}>Nenhuma turma temporária criada neste dispositivo.</p>
          ) : (
            classrooms.map((classroom) => (
              <article className={styles.classroomCard} key={classroom.code}>
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
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
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
