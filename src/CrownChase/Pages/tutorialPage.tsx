import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Lightbulb } from "lucide-react";
import Board from "../Components/board-component";
import { CrownChaseTutorialController } from "../Tutorial/CrownChaseTutorialController";
import { at, bluePiece, enemyPiece, objectiveMove } from "../Tutorial/lesson";
import TutorialPointers from "../Tutorial/TutorialPointers";
import { clearReturn, readReturn, saveReturn } from "../Tutorial/navigation";
import { hasActiveCrownChaseMultiplayerSession } from "../Hooks/useCrownChaseMultiplayer";
import { ROUTES } from "../../routes";
import styles from "../Tutorial/tutorial.module.css";

export default function CrownChaseTutorialPage() {
  if (hasActiveCrownChaseMultiplayerSession()) return <Navigate to={ROUTES.CROWN_CHASE_MP_LOBBY} replace />;
  return <PracticeLesson />;
}

function PracticeLesson() {
  const location = useLocation();
  const navigate = useNavigate();
  const [destination] = useState(() => readReturn(location.state, location.key));
  const [controller] = useState(() => new CrownChaseTutorialController(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false));
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const scene = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLDivElement>(null);
  const secondary = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    saveReturn(destination, location.key);
    const visibility = () => controller.setVisible(document.visibilityState !== "hidden");
    visibility();
    controller.start();
    document.addEventListener("visibilitychange", visibility);
    return () => { document.removeEventListener("visibilitychange", visibility); controller.dispose(); clearReturn(); };
  }, [controller, destination, location.key]);
  useEffect(() => {
    if (snapshot.phase === "active") {
      const position = bluePiece(snapshot.board);
      scene.current?.querySelector<HTMLElement>('[data-square="' + String.fromCharCode(97 + position.col) + (position.row + 1) + '"]')?.focus({ preventScroll: true });
    } else if (snapshot.phase === "kings" || snapshot.phase === "completed") heading.current?.focus({ preventScroll: true });
  }, [snapshot.revision, snapshot.phase, snapshot.board]);

  const leave = () => {
    clearReturn();
    navigate(destination.destination, { replace: true, state: destination.difficulty ? { difficulty: destination.difficulty } : undefined });
  };
  const { phase, stage, guidance } = snapshot;
  const active = phase === "active";
  const selected = active ? bluePiece(snapshot.board) : null;
  const objective = objectiveMove(stage, snapshot.board);
  const enemy = enemyPiece(snapshot.board);
  const observation = phase === "observation";
  const left = observation || stage === 1 || stage === 3 || stage === 5 || stage === 7;
  const title = stage <= 2 ? "Ninja" : stage <= 4 || stage === 6 ? "Saltador" : stage === 5 ? "Rei" : "Caça Coroa";
  const mainTargets = stage === 5 ? [at(0, 4), at(4, 0)] : stage === 6 ? [at(0, 4)] : stage === 7 ? [at(2, 2)] : stage === 2 || stage === 4 ? [enemy ?? bluePiece(snapshot.board)] : [bluePiece(snapshot.board)];
  const copy = observation ? <>A peça pulada <strong className={styles.emphasis}>fica no tabuleiro.</strong></>
    : stage === 1 ? <>Anda uma casa em <strong className={styles.emphasis}>qualquer direção.</strong></>
    : stage === 2 ? <>Capture o Ninja vermelho.</>
    : stage === 3 ? <>Anda uma casa para <strong className={styles.emphasis}>cima</strong>, para <strong className={styles.emphasis}>baixo</strong> ou para os <strong className={styles.emphasis}>lados.</strong></>
    : stage === 4 ? <>Pule por cima da peça.</>
    : stage === 5 ? <>O rei <strong className={styles.emphasis}>não se move.</strong></>
    : stage === 6 ? <>O Saltador só captura o <strong className={styles.emphasis}>rei.</strong></>
    : <>Agora é sua vez de jogar Caça Coroa!</>;

  return <div className={styles.page}>
    <div className={styles.toolbar}>
      <span>Tutorial</span>
      {phase !== "completed" && <button onClick={() => { controller.skip(); leave(); }}>Pular</button>}
    </div>
    {active && [2, 4, 6].includes(stage) && <button className={styles.hintButton} onClick={controller.hint}><Lightbulb aria-hidden="true" />Dica</button>}
    <div ref={scene} className={styles.scene + (phase === "feedback" ? " " + styles.feedbackPhase : "")}>
      <div ref={primary} key={stage + (observation ? ":observation" : "")} data-tutorial-popup="instruction"
        className={styles.popup + " " + (left ? styles.left : styles.right)} aria-live="polite" aria-atomic="true">
        <h1 ref={heading} tabIndex={-1}>{observation ? "Depois do salto" : title}</h1>
        <p>{copy}</p>
        {active && guidance >= 3 && objective && <p className={styles.help}>{stage === 4 ? "Pule até a casa dourada." : "Vá até a casa dourada."}</p>}
        {phase === "kings" && <button onClick={controller.continue}>Continuar</button>}
        {phase === "completed" && <div className={styles.actions}>
          <button onClick={leave}>Jogar</button>
          <button onClick={controller.start}>Repetir tutorial</button>
        </div>}
      </div>
      {stage === 6 && <div ref={secondary} data-tutorial-popup="consequence" className={styles.popup + " " + styles.left + " " + styles.secondary}>
        <p>Se capturarem <strong className={styles.emphasis}>seu rei</strong>, você perde.</p>
      </div>}
      <Board gameState={snapshot.board} interactionLocked={!active}
        practice={{ revision: snapshot.revision, onAttempt: controller.attempt, onSelection: controller.selection,
          autoSelect: selected, targets: active && guidance >= 2 && objective ? [objective.to] : [],
          movement: snapshot.movement, spawned: snapshot.spawned,
          overlay: phase === "feedback" ? <div className={styles.boardFeedback} role="status" aria-live="assertive" data-tutorial-popup="feedback"><p>{snapshot.feedback}</p></div> : undefined }} />
      <TutorialPointers activation={snapshot.revision} scene={scene} primary={primary} secondary={secondary} primaryTargets={mainTargets}
        secondaryTarget={stage === 6 ? at(4, 0) : undefined} guidance={active && guidance >= 3 ? objective : null} />
    </div>
  </div>;
}
