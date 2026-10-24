import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Lightbulb } from "lucide-react";
import Board from "../Components/board-component";
import { DiceReveal } from "../Components/DiceAnimation";
import { MathWarTutorialController } from "../Tutorial/MathWarTutorialController";
import TutorialPointers from "../Tutorial/TutorialPointers";
import type { TutorialConnection } from "../Tutorial/TutorialPointers";
import { energy, findCaptain } from "../Tutorial/lesson";
import { clearReturn, readReturn, saveReturn } from "../Tutorial/navigation";
import { hasActiveMathWarMultiplayerSession } from "../Hooks/useMathWarMultiplayer";
import { getDiceTotal, getRoundsUntilNextRoll } from "../Logic/v2";
import type { Position } from "../Logic/v2";
import { ROUTES } from "../../routes";
import styles from "../Tutorial/tutorial.module.css";

const square = (p: Position) => `[data-square="${String.fromCharCode(97 + p.col)}${p.row + 1}"]`;
export default function MathWarTutorialPage() {
  if (hasActiveMathWarMultiplayerSession()) return <Navigate to={ROUTES.MATH_WAR_MP_LOBBY} replace />;
  return <PracticeLesson />;
}
function PracticeLesson() {
  const location = useLocation(), navigate = useNavigate();
  const [destination] = useState(() => readReturn(location.state, location.key));
  const [controller] = useState(() => new MathWarTutorialController(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false));
  const s = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const scene = useRef<HTMLDivElement>(null), heading = useRef<HTMLHeadingElement>(null);
  const { stage, phase, selected, guidance } = s;
  const active = phase === "active";
  const currentPiece = selected ? s.board.board[selected.row][selected.col] : null;
  const total = getDiceTotal(s.board), available = energy(s.board, selected);
  const beforeDemoRoll = stage === 5 && s.board.turnCount === 3 && phase !== "updated" && !(phase === "rolling" && s.rollSettled);
  const displayedDice = beforeDemoRoll ? 7 : total;
  const displayedEnergy = beforeDemoRoll ? displayedDice + (currentPiece?.value ?? 0) : available;
  const movingPlayer = s.movement ? s.board.board[s.movement.to.row][s.movement.to.col]?.owner : undefined;
  const displayedTurn = s.board.turnCount + (s.movement ? 0 : 1);
  const roundsLeft = beforeDemoRoll && phase === "rolling" ? 0 : getRoundsUntilNextRoll({ ...s.board, turnCount: Math.max(0, s.board.turnCount - (s.movement ? 1 : 0)) });
  const objective = active ? controller.objective() : null;
  const showCalculation = stage >= 2 && stage <= 4 || stage === 5 && phase === "updated";
  const showCosts = active && (stage >= 2 && stage <= 4 || stage === 7 || stage === 6 && guidance >= 2);
  const observing = phase === "spent" || phase === "updated" || phase === "won";
  const showDice = stage >= 2 && stage < 8;
  const blueCaptain = findCaptain(s.board, 1), redCaptain = findCaptain(s.board, 0);
  const connections: TutorialConnection[] = [];
  if ((stage === 2 || stage === 3 || stage === 5 && phase === "updated") && phase !== "rolling" && selected) {
    connections.push({ from: '[data-pointer="dice"]', to: '[data-pointer="dice-term"] > span' }, { from: square(selected) + ' [data-piece-value]', to: '[data-pointer="piece-term"] > span', elbow: true });
  } else if (stage === 6) {
    if (s.captainVisible && blueCaptain) connections.push({ from: '[data-pointer="instruction"]', to: square(blueCaptain) });
    if (s.enemyVisible && redCaptain) connections.push({ from: '[data-pointer="objective"]', to: square(redCaptain) });
  } else if (selected && stage !== 8) connections.push({ from: '[data-pointer="instruction"]', to: square(selected) });
  useEffect(() => {
    saveReturn(destination, location.key);
    const visibility = () => controller.setVisible(document.visibilityState !== "hidden");
    visibility(); controller.start(); document.addEventListener("visibilitychange", visibility);
    return () => { document.removeEventListener("visibilitychange", visibility); controller.dispose(); clearReturn(); };
  }, [controller, destination, location.key]);
  useEffect(() => {
    if (active && selected) scene.current?.querySelector<HTMLElement>(square(selected))?.focus({ preventScroll: true });
    else if (observing || phase === "completed") heading.current?.focus({ preventScroll: true });
  }, [s.revision, active, selected, observing, phase]);
  const leave = () => { clearReturn(); navigate(destination.destination, { replace: true, state: destination.difficulty ? { difficulty: destination.difficulty } : undefined }); };
  const title = stage === 1 ? "Peça redonda" : stage === 2 ? "Energia" : stage === 3 ? "Peça quadrada" : stage === 4 ? "Capturar" : stage === 5 ? "Turnos e dados" : stage <= 7 ? "Capitão" : "Guerra Matemática";
  const copy = stage === 1 ? <>Anda para <strong>cima</strong>, para <strong>baixo</strong> ou para os <strong>lados</strong>.</>
    : stage === 2 ? phase === "rolling" ? <>Os dados dão um <strong>número</strong>.</> : phase === "explaining" ? <>Dados + valor da peça = <strong>energia</strong>.</> : <>Cada casa custa <strong>2 ⚡</strong>.</>
    : stage === 3 ? <>A peça quadrada anda na <strong>diagonal</strong>.</>
    : stage === 4 ? <>Capturar custa <strong>mais 2 ⚡</strong>. Capture a peça vermelha.</>
    : stage === 5 ? <>Os dados mudam a cada <strong>3 turnos</strong>.</>
    : stage === 6 ? phase === "won" ? <>Capitão inimigo <strong>capturado!</strong></> : <>Uma peça sua é escolhida para ser o <strong>Capitão</strong>.</>
    : stage === 7 ? <>O Capitão gasta o <strong>dobro</strong>. Capture a peça vermelha.</>
    : <>Agora é sua vez de jogar Guerra Matemática!</>;
  const instruction = <div data-pointer="instruction" className={styles.popup} aria-live="polite" aria-atomic="true">
    <h1 ref={heading} tabIndex={-1}>{title}</h1><p>{copy}</p>
    {active && stage === 2 && <p className={styles.shortHelp}>Mova a peça.</p>}
    {active && guidance >= 3 && objective && <p className={styles.shortHelp}>Vá até a casa marcada.</p>}
    {phase === "completed" && <div className={styles.actions}><button onClick={leave}>Jogar</button><button onClick={controller.start}>Repetir tutorial</button></div>}
  </div>;
  const hasCalculation = showCalculation && selected !== null && phase !== "rolling";
  const singlePanel = !(hasCalculation || stage === 6 && s.enemyVisible);
  return <div className={styles.page} data-intro={!showDice}>
    <div className={styles.toolbar}><span>Tutorial</span>{phase !== "completed" && <button onClick={() => { controller.skip(); leave(); }}>Pular</button>}</div>
    {active && stage >= 2 && <button className={styles.hintButton} onClick={controller.hint}><Lightbulb aria-hidden="true" />Dica</button>}
    <div ref={scene} data-stage={stage} data-phase={phase} data-single={singlePanel} className={`${styles.scene} ${phase === "feedback" ? styles.feedbackPhase : ""}`}>
      {showDice && <div className={styles.hud}>
        <div data-pointer="dice" className={styles.dice}><span>Dados</span><strong>{phase === "rolling" && !s.rollSettled ? "?" : displayedDice}</strong>
          {stage === 5 && <span className={styles.countdown}>Próxima rolagem<br /><b data-roll-countdown>{roundsLeft}</b> {roundsLeft === 1 ? "turno" : "turnos"}</span>}
        </div>
        {!showCalculation && selected && <div className={styles.energy}><span>Energia da peça</span><strong>{displayedEnergy} ⚡</strong></div>}
        {stage === 5 && <span className={styles.turn} data-turn-player={movingPlayer ?? s.board.currentPlayer}>Turno {displayedTurn} · {(movingPlayer ?? s.board.currentPlayer) === 1 ? "Azul" : "Vermelho"}</span>}
      </div>}
      <div className={styles.leftColumn}>
        {hasCalculation && <div className={`${styles.popup} ${styles.calculation}`} data-pointer="calculation" aria-live="polite">
          <h2>{stage === 5 ? "A energia mudou!" : "Energia da peça"}</h2>
          <div className={styles.equation}>
            <div className={`${styles.term} ${styles.diceTerm}`} data-pointer="dice-term"><span>{total}</span><small>Dados</small></div>
            <span className={styles.operator}>+</span>
            <div className={`${styles.term} ${styles.pieceTerm}`} data-pointer="piece-term"><span>{currentPiece?.value}</span><small>Valor da peça</small></div>
            <span className={styles.operator}>=</span>
            <div className={`${styles.term} ${styles.energyTerm}`}><span>{available} ⚡</span><small>Energia</small></div>
          </div>
        </div>}
        {stage === 6 && instruction}
      </div>
      <Board gameState={s.board} interactionLocked={!active} practice={{ revision: s.revision, selected, onSelect: controller.select, onAttempt: controller.attempt,
        exactDestinations: active && (showCosts || stage === 1 || stage === 3 || guidance >= 2), showDirections: active && stage === 6 && !showCosts, showCosts,
        hideValues: stage === 1, hideCaptain: stage === 6 && !s.captainVisible, target: guidance >= 2 ? objective?.to ?? null : null, movement: s.movement, spawned: s.spawned,
        overlay: phase === "feedback" ? <div className={styles.boardFeedback} role="status">{s.feedbackEnergy ? <p>Precisa de <strong className={styles.wrongNumber}>{s.feedbackEnergy.required} ⚡</strong>.<br />Você tem <strong className={styles.rightNumber}>{s.feedbackEnergy.available} ⚡</strong>.</p> : <p>{s.feedback}</p>}</div>
          : phase === "spent" ? <div className={styles.spent} role="status">Gastou {s.spent} ⚡</div>
          : phase === "won" ? <div className={styles.spent} role="status">Você venceu!</div> : undefined }} />
      <div className={styles.rightColumn}>
        {stage !== 6 && instruction}
        {stage === 6 && s.enemyVisible && <div data-pointer="objective" className={styles.popup}>{phase !== "won" && <p>Capture o <strong>Capitão inimigo</strong> para vencer.</p>}<p className={phase !== "won" ? styles.shortHelp : undefined}>Se capturarem seu Capitão, você perde.</p></div>}
      </div>
      <TutorialPointers scene={scene} connections={connections} revision={s.revision} />
    </div>
    {phase === "rolling" && <DiceReveal displayValue={s.rollDisplay} isFinal={s.rollSettled} className={styles.rollOverlay} />}
  </div>;
}
