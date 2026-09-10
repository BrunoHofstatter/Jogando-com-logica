import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import BombCaseLayout from "./BombCaseLayout";
import { ComponentIcon, DangerIcon, MarkerIcon, Probe } from "./NavigationIcons";
import { componentLabels, markerLabels } from "./navigationLabels";
import { gridNeighbors, type ComponentId, type MarkerPositions, type NavigationIntent } from "../Logic/navigation";
import type { NavigationBombViewState, NavigationManualViewState } from "../Logic/multiplayer/protocol";
import styles from "../styles/NavigationLevel.module.css";

type Submit = (intent: NavigationIntent) => void;
const routeNames = ["A", "B", "C"];

export function NavigationBombPanel({ state, seconds, submit, disconnected }: { state: NavigationBombViewState; seconds: number; submit: Submit; disconnected: boolean }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const unavailable = state.phase !== "playing" || disconnected;
  const gridDone = state.completedSections.includes(1), energyDone = state.completedSections.includes(2);
  const neighbors = gridNeighbors(state.gridPosition, state.exitRow);
  const move = (to: number) => {
    if (!unavailable && !gridDone && neighbors.includes(to)) {
      gridRef.current?.focus({ preventScroll: true });
      submit({ type: "move_probe", to, revision: state.gridRevision });
    }
  };
  const onGridKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!event.key.startsWith("Arrow") || event.repeat) return;
    event.preventDefault();
    const position = state.gridPosition;
    if (position === -1) { if (event.key === "ArrowRight") move(3); return; }
    const to = event.key === "ArrowUp" ? position - 3 : event.key === "ArrowDown" ? position + 3 : event.key === "ArrowLeft" ? (position === 3 ? -1 : position - 1) : (position === state.exitRow * 3 + 2 ? 9 : position + 1);
    move(to);
  };

  return <BombCaseLayout completedSections={state.completedSections} time={`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`} urgent={seconds <= 30} levelId={3} sectionCount={2} moduleClassName={styles.modules}>
    <Module title="01 · Circuito oculto" done={gridDone}>
      <p className={styles.instruction}>Compare as marcas com o manual. Toque uma casa vizinha.</p>
      <div ref={gridRef} tabIndex={unavailable || gridDone ? -1 : 0} onKeyDown={onGridKey} className={styles.gridArea} role="group" aria-label="Mover sonda pelo circuito; use as setas ou toque nas casas">
        <CircuitGrid markers={state.markers} exitRow={state.exitRow} position={state.gridPosition} visited={state.gridVisited} neighbors={neighbors} disabled={unavailable || gridDone} onMove={move} />
      </div>
      <p className={styles.feedback} role="status">{gridDone ? "✓ Circuito estabilizado" : state.mistake?.section === 1 ? "Curto-circuito! Sonda na entrada." : "Setas do teclado também movem a sonda."}</p>
    </Module>
    <Module title="02 · Rotas de energia" done={energyDone}>
      <p className={styles.instruction}>Peça os custos ao manual antes de escolher.</p>
      <div className={styles.energyHeader}><span>Fonte · {state.initialEnergy}</span>{state.activeRoute === null ? <span className={styles.sourceProbe}><Probe energy={state.energy} /></span> : <span>Rota {routeNames[state.activeRoute]}</span>}<span role="status">Energia: {state.energy}</span></div>
      <div className={styles.routes}>
        {state.routes.map((route, routeIndex) => <div className={styles.route} key={routeIndex} role="group" aria-label={`Rota ${routeNames[routeIndex]}`}>
          <strong className={styles.routeLabel}>{routeNames[routeIndex]}</strong>
          <div className={styles.cable}>
            {route.map((component, step) => {
              const current = state.activeRoute === routeIndex && state.energyStep === step;
              const visited = state.activeRoute === routeIndex && state.energyStep > step;
              const next = (state.activeRoute === null || state.activeRoute === routeIndex) && step === state.energyStep + 1;
              return <button key={step} className={`${styles.componentTile} ${current ? styles.currentComponent : ""} ${visited ? styles.used : ""}`} disabled={unavailable || energyDone || !next} aria-label={`Rota ${routeNames[routeIndex]}, componente ${step + 1}: ${componentLabels[component]}${current ? `, sonda com ${state.energy} de energia` : ""}`} onClick={() => submit({ type: "move_energy", route: routeIndex, step, revision: state.energyRevision })}>
                <span className={styles.componentImage}><ComponentIcon id={component} /></span>
                {current ? <span className={styles.tileProbe}><Probe energy={state.energy} /></span> : <span className={styles.stepLabel}>{visited ? "✓" : step + 1}</span>}
              </button>;
            })}
            <button className={`${styles.terminal} ${energyDone && state.activeRoute === routeIndex ? styles.used : ""}`} disabled={unavailable || energyDone || state.activeRoute !== routeIndex || state.energyStep !== route.length - 1} aria-label={`Chegar ao destino pela rota ${routeNames[routeIndex]}`} onClick={() => submit({ type: "move_energy", route: routeIndex, step: route.length, revision: state.energyRevision })}>{energyDone && state.activeRoute === routeIndex ? <Probe energy={state.energy} /> : <span>→<small>Fim</small></span>}</button>
          </div>
        </div>)}
      </div>
      <p className={styles.feedback} role="status">{energyDone ? "✓ Destino energizado" : state.mistake?.section === 2 ? "Energia insuficiente! Sonda na fonte." : state.activeRoute === null ? "Toque o primeiro componente para escolher uma rota." : "Continue pelo próximo componente do cabo."}</p>
    </Module>
  </BombCaseLayout>;
}

function Module({ title, done, children }: { title: string; done: boolean; children: ReactNode }) {
  return <section className={`${styles.module} ${done ? styles.done : ""}`}><h2>{title}<span aria-label={done ? "Módulo concluído" : "Módulo pendente"}>{done ? "✓" : "○"}</span></h2>{children}</section>;
}

function CircuitGrid({ markers, exitRow, dangers, position, visited = [], neighbors = [], disabled = true, onMove }: {
  markers: MarkerPositions; exitRow: number; dangers?: number[]; position?: number; visited?: number[]; neighbors?: number[]; disabled?: boolean; onMove?: (to: number) => void;
}) {
  const plate = (cell: number, row: number, column: number, port?: "Entrada" | "Saída") => {
    const current = position === cell;
    const danger = dangers?.includes(cell);
    const label = port ?? `Linha ${row - 1}, coluna ${column - 1}`;
    const content = current ? <Probe /> : port ? <span>→<small>{port}</small></span> : danger ? <DangerIcon /> : dangers ? <span className={styles.neutralDot}>·</span> : visited.includes(cell) ? "✓" : "?";
    const props = { className: `${styles.plate} ${port ? styles.port : ""} ${danger ? styles.danger : ""} ${visited.includes(cell) ? styles.visited : ""} ${current ? styles.current : ""}`, style: { gridRow: row, gridColumn: column }, "aria-label": `${label}${danger ? ": perigo" : ""}${current ? ", sonda" : ""}` };
    return onMove ? <button key={cell} {...props} disabled={disabled || !neighbors.includes(cell)} onClick={() => onMove(cell)}>{content}</button> : <span key={cell} {...props} role="img">{content}</span>;
  };
  return <div className={styles.circuitGrid}>
    {markers.map((slot, id) => <span key={id} className={styles.marker} style={{ gridRow: slot < 3 ? 1 : 5, gridColumn: slot % 3 + 2 }} role="img" aria-label={`${markerLabels[id]} ${slot < 3 ? "acima" : "abaixo"} da coluna ${slot % 3 + 1}`}><MarkerIcon id={id as ComponentId} /></span>)}
    {plate(-1, 3, 1, "Entrada")}
    {Array.from({ length: 9 }, (_, cell) => plate(cell, Math.floor(cell / 3) + 2, cell % 3 + 2))}
    {plate(9, exitRow + 2, 5, "Saída")}
  </div>;
}

export function NavigationManualPanel({ state, submit, disconnected }: { state: NavigationManualViewState; submit: Submit; disconnected: boolean }) {
  const [selectedMap, setSelectedMap] = useState<number | null>(null);
  return <main className={styles.manual}>
    <h1>Manual · Navegação</h1>
    <section className={styles.manualSection}>
      <h2>01 · Encontre o circuito</h2>
      <p>Compare as três formas e suas posições na borda. Só um mapa corresponde à bomba. Guie a sonda até a saída, sem passar pelos perigos.</p>
      <div className={styles.mapCards}>{state.maps.map((map, index) => <button key={index} className={`${styles.mapCard} ${selectedMap === index ? styles.selectedMap : ""}`} aria-pressed={selectedMap === index} aria-label={`Selecionar mapa ${routeNames[index]}`} onClick={() => setSelectedMap(selectedMap === index ? null : index)}>
        <strong>Mapa {routeNames[index]} {selectedMap === index ? "✓" : ""}</strong>
        <CircuitGrid markers={map.markers} exitRow={state.exitRow} dangers={map.dangers} />
      </button>)}</div>
      <p className={styles.legend}><span><DangerIcon /></span> Perigo de curto-circuito · Não passe por essa casa.</p>
    </section>
    <section className={styles.manualSection}>
      <h2>02 · Calcule o consumo</h2>
      <p>Resolva as contas. Depois, peça os componentes de cada rota e some seus custos. Só uma rota cabe na energia da sonda.</p>
      <div className={styles.equations}>{state.equations.map((equation, index) => <ComponentCalculation key={index} index={index as ComponentId} state={state} submit={submit} disconnected={disconnected} />)}</div>
      <p className={styles.manualNote}>As respostas confirmadas substituem os símbolos nas próximas contas. Errar uma conta não tira corações.</p>
    </section>
  </main>;
}

function ComponentCalculation({ index, state, submit, disconnected }: { index: ComponentId; state: NavigationManualViewState; submit: Submit; disconnected: boolean }) {
  const [value, setValue] = useState("");
  const [pendingAt, setPendingAt] = useState<number | null>(null);
  const equation = state.equations[index], solved = state.solvedValues[index];
  const previous = index > 0 ? state.solvedValues[index - 1] : null;
  const waiting = index > 0 && previous === null;
  const pending = pendingAt === state.equationRevision;
  const disabled = disconnected || state.phase !== "playing" || solved !== null || waiting || pending || state.completedSections.includes(2);
  return <form className={`${styles.calculation} ${solved !== null ? styles.calculationDone : ""}`} onSubmit={(event) => {
    event.preventDefault();
    if (disabled || !/^\d{1,2}$/.test(value)) return;
    setPendingAt(state.equationRevision);
    submit({ type: "solve_component", component: index, value: Number(value), revision: state.equationRevision });
  }}>
    <div className={styles.expression}><span className={styles.equationIcon}><ComponentIcon id={index} /></span><span>=</span>{equation.left === "previous" ? previous === null ? <span className={styles.equationIcon}><ComponentIcon id={(index - 1) as ComponentId} /></span> : <strong>{previous}</strong> : <span>{equation.left}</span>}<span>{equation.operator === "-" ? "−" : "+"}</span><span>{equation.right}</span></div>
    <div className={styles.answerRow}><input aria-label={`Valor de ${componentLabels[index]}`} inputMode="numeric" autoComplete="off" maxLength={2} value={solved === null ? value : String(solved)} disabled={disabled} aria-invalid={state.wrongEquation === index} onChange={(event) => setValue(event.target.value.replace(/\D/g, ""))} /><button disabled={disabled || !value}>{solved !== null ? "✓ Confirmado" : pending ? "Enviando..." : "Confirmar"}</button></div>
    <p className={styles.calculationStatus} role="status">{solved !== null ? `Custo: ${solved} de energia` : waiting ? "Resolva a conta anterior." : state.wrongEquation === index ? "Confira a conta e tente de novo." : " "}</p>
  </form>;
}
