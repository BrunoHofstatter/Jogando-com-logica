import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Heart, Lightbulb, LockKeyhole, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "../../routes";
import BombCaseLayout from "../Components/BombCaseLayout";
import { useBombGameMultiplayer } from "../Hooks/useBombGameMultiplayer";
import type { Operator } from "../Logic/level1";
import type { BombViewState, ManualViewState, RolePreference } from "../Logic/multiplayer/protocol";
import styles from "../styles/GamePage.module.css";

type GameApi = ReturnType<typeof useBombGameMultiplayer>;

export default function BombGamePage() {
  const navigate = useNavigate();
  const game = useBombGameMultiplayer();
  const [leaveOpen, setLeaveOpen] = useState(false);

  useEffect(() => {
    if (!game.roomCode) navigate(ROUTES.BOMB_GAME_MP_LOBBY, { replace: true });
  }, [game.roomCode, navigate]);

  const leaveRoom = () => {
    game.leaveRoom();
    navigate(ROUTES.BOMB_GAME_MP_LOBBY, { replace: true });
  };

  if (!game.roomCode || game.playerSeat === null) return <div className={styles.loading}>Carregando sala...</div>;

  const activeMatch = game.gameState && !["countdown", "replay_countdown", "won", "lost"].includes(game.gameState.phase);

  return <div className={styles.page}>
    {!activeMatch && <RoomBar game={game} onLeave={() => setLeaveOpen(true)} />}
    {!game.gameState ? <RoleSelection game={game} /> : game.gameState.phase === "countdown" ? <RoleCountdown state={game.gameState} /> : game.gameState.phase === "replay_countdown" ? <ReplayCountdown state={game.gameState} /> : ["won", "lost"].includes(game.gameState.phase) ? <ResultOverlay game={game} onReturn={leaveRoom} /> : <ActiveMatch game={game} onLeave={() => setLeaveOpen(true)} />}
    {leaveOpen && <ConfirmOverlay title="Sair da sala?" text="A sala será encerrada para os dois jogadores." confirm="Sair" onCancel={() => setLeaveOpen(false)} onConfirm={leaveRoom} />}
  </div>;
}

function RoomBar({ game, onLeave }: { game: GameApi; onLeave: () => void }) {
  const partner = game.players.find((player) => player.seat !== game.playerSeat);
  return <header className={styles.roomBar}><div><span>Sala {game.roomCode}</span><span>{partner ? `Parceiro: ${partner.name}` : "Aguardando parceiro"}</span>{game.opponentDisconnected && <span className={styles.connectionWarning}>Parceiro desconectado</span>}</div><button onClick={onLeave}>Sair da Sala</button></header>;
}

function MatchBar({ game, seconds, onLeave }: { game: GameApi; seconds: number; onLeave: () => void }) {
  const state = game.gameState!;
  const partner = game.players.find((player) => player.seat !== game.playerSeat);
  return <header className={styles.matchBar}>
    <div className={styles.matchRoom}><strong>Sala {game.roomCode}</strong><span>{partner ? `Parceiro: ${partner.name}` : "Aguardando parceiro"}</span></div>
    <div className={styles.hearts}>{[0, 1, 2].map((index) => <Heart key={index} fill={index < state.lives ? "currentColor" : "none"} />)}</div>
    <div className={styles.matchCenter}>{state.role === "bomb" ? "Nível 1" : formatTime(seconds)}</div>
    <div className={styles.assignedRole}>{state.role === "bomb" ? "Bomba" : "Manual"}</div>
    <button className={styles.matchLeave} onClick={onLeave}><span className={styles.leaveLong}>Sair da Sala</span><span className={styles.leaveShort}>Sair</span></button>
  </header>;
}

function RoleSelection({ game }: { game: GameApi }) {
  const me = game.players.find((player) => player.seat === game.playerSeat);
  const options: { value: RolePreference; label: string }[] = [{ value: "bomb", label: "Bomba" }, { value: "manual", label: "Manual" }, { value: "either", label: "Tanto faz" }];
  return <main className={styles.rolePage}><section className={styles.roleCard}>
    <h1>Escolha seu papel</h1><p>Se os dois escolherem o mesmo papel, o sorteio será automático.</p>
    <div className={styles.playerCards}>{game.players.map((player) => <article key={player.seat} className={player.ready ? styles.playerReady : ""}><strong>{player.name}</strong><span>{preferenceLabel(player.preference)}</span>{player.ready && <span className={styles.readyMark}>✓</span>}</article>)}</div>
    <div className={styles.roleButtons}>{options.map((option) => <button key={option.value} className={me?.preference === option.value ? styles.selectedButton : ""} onClick={() => game.setPreference(option.value)} disabled={Boolean(me?.ready)}>{option.label}</button>)}</div>
    <button className={styles.readyButton} onClick={() => game.setReady(!me?.ready)}>{me?.ready ? "Cancelar pronto" : "Pronto"}</button>
  </section></main>;
}

function RoleCountdown({ state }: { state: NonNullable<GameApi["gameState"]> }) {
  const seconds = useCountdown(state.countdownEndsAt);
  return <main className={styles.countdownPage}><p>{state.role === "manual" ? "Você é o Manual" : "Você está com a Bomba"}</p><strong>{seconds || 1}</strong></main>;
}

function ReplayCountdown({ state }: { state: NonNullable<GameApi["gameState"]> }) {
  const seconds = useCountdown(state.replayCountdownEndsAt);
  return <main className={styles.countdownPage}><p>Nova rodada em</p><strong>{seconds || 1}</strong></main>;
}

function ActiveMatch({ game, onLeave }: { game: GameApi; onLeave: () => void }) {
  const state = game.gameState!;
  const seconds = useCountdown(state.timerEndsAt);
  const previousLives = useRef(state.lives);
  const [heartLost, setHeartLost] = useState(false);
  useEffect(() => {
    if (state.lives >= previousLives.current) { previousLives.current = state.lives; return; }
    previousLives.current = state.lives;
    setHeartLost(true);
    const timer = window.setTimeout(() => setHeartLost(false), 1400);
    return () => clearTimeout(timer);
  }, [state.lives]);

  return <div className={`${styles.activeMatch} ${state.role === "bomb" ? styles.bombMatch : ""}`}>
    <MatchBar game={game} seconds={seconds} onLeave={onLeave} />
    {heartLost && <div className={styles.heartNotice}>Coração perdido!</div>}
    {state.role === "bomb" ? <BombPanel state={state} seconds={seconds} submit={game.submit} /> : <ManualPanel state={state} />}
  </div>;
}

function BombPanel({ state, seconds, submit }: { state: BombViewState; seconds: number; submit: GameApi["submit"] }) {
  const completed = (section: 1 | 2 | 3) => state.completedSections.includes(section);
  return <BombCaseLayout completedSections={state.completedSections} time={formatTime(seconds)} urgent={seconds <= 30}>
    <Section module="01" title="Sequência" tone="red" done={completed(1)} mistake={state.mistake?.section === 1}>
      <p className={styles.sectionInstruction}>Selecione na ordem indicada pelo manual.</p>
      <div className={styles.numberGrid}>{state.orderingNumbers.map((number) => {
        const selected = state.orderingProgress.includes(number);
        const wrong = state.mistake?.section === 1 && state.mistake.value === number;
        return <button key={number} aria-pressed={selected} disabled={completed(1) || selected} className={`${selected ? styles.numberSelected : ""} ${wrong ? styles.wrongControl : ""}`} onClick={() => submit({ type: "select_ordering_number", value: number })}>{number}</button>;
      })}</div>
    </Section>
    <Section module="02" title="Código" tone="yellow" done={completed(2)} mistake={state.mistake?.section === 2}>
      <div className={styles.equationGrid}>{state.numericTargets.map((target, row) => <NumericEquation key={target} row={row as 0 | 1 | 2} target={target} answer={state.numericAnswers[row]} eventId={state.eventId} mistakeRow={state.mistake?.section === 2 ? state.mistake.row : null} disabled={state.phase !== "playing"} submit={submit} />)}</div>
    </Section>
    <Section module="03" title="Operadores" tone="blue" done={completed(3)} mistake={state.mistake?.section === 3}>
      <div className={styles.equationGrid}>{state.operatorEquations.map((equation, row) => <OperatorEquation key={`${equation.left}-${equation.right}`} row={row as 0 | 1 | 2} equation={equation} answer={state.operatorAnswers[row]} eventId={state.eventId} mistakeRow={state.mistake?.section === 3 ? state.mistake.row : null} disabled={state.phase !== "playing"} submit={submit} />)}</div>
    </Section>
  </BombCaseLayout>;
}

function NumericEquation({ row, target, answer, eventId, mistakeRow, disabled, submit }: { row: 0 | 1 | 2; target: string; answer: number | null; eventId: number; mistakeRow: number | null; disabled: boolean; submit: GameApi["submit"] }) {
  const [value, setValue] = useState(answer === null ? "" : String(answer));
  const [pending, setPending] = useState(false);
  const timeout = useRef<number | null>(null);
  const clearPending = () => { if (timeout.current) window.clearTimeout(timeout.current); timeout.current = null; setPending(false); };
  useEffect(() => () => { if (timeout.current) window.clearTimeout(timeout.current); }, []);
  useEffect(() => { if (disabled || answer !== null) clearPending(); if (answer !== null) setValue(String(answer)); }, [answer, disabled]);
  useEffect(() => { if (mistakeRow === row) { clearPending(); setValue(""); } }, [eventId, mistakeRow, row]);
  const change = (nextValue: string) => {
    clearPending();
    setValue(nextValue);
    if (!disabled && /^-?\d+$/.test(nextValue)) {
      setPending(true);
      timeout.current = window.setTimeout(() => { setPending(false); submit({ type: "submit_numeric_answer", row, value: Number(nextValue) }); }, 2000);
    }
  };
  return <label className={`${styles.equation} ${answer !== null ? styles.equationSolved : ""} ${pending ? styles.pendingControl : ""} ${mistakeRow === row ? styles.wrongControl : ""}`}><span className={styles.rowLight} aria-hidden="true" /><span>{target} =</span><input aria-label={`Resposta para ${target}`} inputMode="numeric" value={value} disabled={disabled || answer !== null} onChange={(event) => change(event.target.value)} /></label>;
}

function OperatorEquation({ row, equation, answer, eventId, mistakeRow, disabled, submit }: { row: 0 | 1 | 2; equation: BombViewState["operatorEquations"][number]; answer: Operator | null; eventId: number; mistakeRow: number | null; disabled: boolean; submit: GameApi["submit"] }) {
  const [selected, setSelected] = useState<Operator | null>(answer);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const timeout = useRef<number | null>(null);
  const clearPending = () => { if (timeout.current) window.clearTimeout(timeout.current); timeout.current = null; setPending(false); };
  useEffect(() => () => { if (timeout.current) window.clearTimeout(timeout.current); }, []);
  useEffect(() => { if (disabled || answer !== null) { clearPending(); setOpen(false); } if (answer !== null) setSelected(answer); }, [answer, disabled]);
  useEffect(() => { if (mistakeRow === row) { clearPending(); setSelected(null); setOpen(false); } }, [eventId, mistakeRow, row]);
  const choose = (operator: Operator) => {
    clearPending(); setSelected(operator); setOpen(false); setPending(true);
    timeout.current = window.setTimeout(() => { setPending(false); submit({ type: "select_operator", row, value: operator }); }, 2000);
  };
  return <div className={`${styles.equation} ${styles.operatorEquation} ${answer !== null ? styles.equationSolved : ""} ${pending ? styles.pendingControl : ""} ${mistakeRow === row ? styles.wrongControl : ""}`}><span className={styles.rowLight} aria-hidden="true" /><span>{equation.left}</span><div className={styles.operatorSelect}><button aria-label={`Escolher operador entre ${equation.left} e ${equation.right}`} aria-expanded={open} disabled={disabled || answer !== null} onClick={() => setOpen((current) => !current)}>{selected ? displayOperator(selected) : <ChevronDown />}</button>{open && <div className={styles.operatorMenu}>{(["+", "-", "*"] as Operator[]).map((operator) => <button key={operator} onClick={() => choose(operator)}>{displayOperator(operator)}</button>)}</div>}</div><span>{equation.right} = {equation.result}</span></div>;
}

function ManualPanel({ state }: { state: ManualViewState }) {
  const highlighted = getHintLetters(state);
  return <main className={styles.manual}>
    <h1>Manual do Nível 1</h1>
    <section className={styles.manualInstruction}><h2>Números com borda vermelha</h2><p>Clique nos números do <strong>menor para o maior</strong>.</p></section>
    <section className={styles.codeTable}><h2>Código das letras</h2><div>{state.calculations.map(({ letter, expression }) => <article key={letter} className={highlighted.includes(letter) ? styles.highlightedCalculation : ""}><strong>{letter}</strong><span>=</span><span>{expression}</span></article>)}</div></section>
    {state.hintsEnabled && state.mistake && <div className={styles.hint}><Lightbulb aria-hidden="true" /><span>{state.mistake.section === 1 ? "Confiram qual é o próximo número maior." : "Confiram novamente as contas destacadas."}</span></div>}
  </main>;
}

function ResultOverlay({ game, onReturn }: { game: GameApi; onReturn: () => void }) {
  const state = game.gameState!;
  const localVote = game.playerSeat !== null && state.replayVotes.includes(game.playerSeat);
  return <main className={styles.resultPage}><section className={styles.resultCard}>
    <h1>{state.phase === "won" ? "Bomba desarmada!" : "A bomba explodiu!"}</h1>
    <p>{state.resultReason === "time" ? "O tempo acabou." : state.resultReason === "lives" ? "Os corações acabaram." : "Vocês resolveram todas as seções!"}</p>
    <div className={styles.voteList}>{game.players.map((player) => <div key={player.seat}><span>{player.name}</span><span className={state.replayVotes.includes(player.seat) ? styles.voteYes : styles.voteWaiting}>{state.replayVotes.includes(player.seat) ? "Quer jogar novamente ✓" : "Ainda não decidiu"}</span></div>)}</div>
    <div className={styles.resultActions}><button className={localVote ? styles.cancelReplayButton : styles.replayButton} onClick={() => game.setReplayVote(!localVote)}>{localVote ? "Cancelar" : "Jogar novamente"}</button><button className={styles.lobbyButton} onClick={onReturn}>Voltar ao lobby online</button></div>
  </section></main>;
}

function Section({ module, title, tone, done, mistake, children }: { module: string; title: string; tone: "red" | "yellow" | "blue"; done: boolean; mistake: boolean; children: ReactNode }) {
  const toneClass = { red: styles.sectionRed, yellow: styles.sectionYellow, blue: styles.sectionBlue }[tone];
  return <section className={`${styles.bombSection} ${toneClass} ${done ? styles.completed : ""} ${mistake ? styles.mistakeSection : ""}`}><h2><span><small>Módulo {module}</small>{title}</span><span className={styles.statusLight} role="img" aria-label={done ? "Módulo concluído" : "Módulo pendente"}>{done && <LockKeyhole aria-hidden="true" />}</span></h2><div className={styles.moduleBody}>{children}</div></section>;
}

function ConfirmOverlay({ title, text, confirm, onCancel, onConfirm }: { title: string; text: string; confirm: string; onCancel: () => void; onConfirm: () => void }) {
  return <div className={styles.modalOverlay}><section className={styles.confirmCard}><button className={styles.closeModal} aria-label="Fechar" onClick={onCancel}><X /></button><h2>{title}</h2><p>{text}</p><div><button onClick={onCancel}>Cancelar</button><button className={styles.dangerButton} onClick={onConfirm}>{confirm}</button></div></section></div>;
}

function useCountdown(endsAt: number | null): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 200); return () => clearInterval(timer); }, []);
  return Math.max(0, Math.ceil(((endsAt ?? now) - now) / 1000));
}

function getHintLetters(state: ManualViewState): string[] {
  if (!state.mistake || state.mistake.section === 1) return [];
  const row = state.mistake.row ?? 0;
  if (state.mistake.section === 2) return [["A", "B"], ["B", "C"], ["C", "A"]][row] ?? [];
  return [["A"], ["C"], ["D"]][row] ?? [];
}

function preferenceLabel(preference: RolePreference): string { return preference === "bomb" ? "Bomba" : preference === "manual" ? "Manual" : "Tanto faz"; }
function displayOperator(operator: Operator): string { return operator === "*" ? "×" : operator === "-" ? "−" : "+"; }
function formatTime(seconds: number): string { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
