import { useEffect } from "react";
import { Hand, ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import RubiksCube from "../../Components/RubiksCube";
import { appearanceFor, FACE_ORDER, INITIAL_ROTATION, type Configuration, type LessonState, type LessonStep } from "./class3Lesson";
import { useFaceMotion } from "./useFaceMotion";
import styles from "./Class3TotalSquares.module.css";

interface Props { config: Configuration; step: LessonStep; state: LessonState; reducedMotion: boolean; portrait: boolean }
export function LessonCube({ config, step, state, reducedMotion, portrait }: Props) {
    const motion = useFaceMotion(config, reducedMotion);
    const { interact, focus, tour } = motion;
    const showRows = state.phase === "question" && state.hintLevel > 0 && step.kind === "faceExpression";
    const countHint = state.hintLevel >= 2 && step.kind !== "faceExpression" && step.kind !== "calculation";
    useEffect(() => {
        if (state.phase !== "question") { interact(); return; }
        if (!state.hintLevel) return;
        if (countHint && state.hintLevel === 2) tour();
        else if (state.hintLevel === 1 || step.kind === "faceExpression") focus();
    }, [countHint, focus, interact, state.hintLevel, state.phase, state.stepIndex, step.kind, tour]);

    const isTour = motion.mode === "tour";
    const faceIndex = motion.face ? FACE_ORDER.indexOf(motion.face) : null;
    return <div className={styles.leftPanel}>
        <div className={styles.cubeTitle}>Cubo {config.size}×{config.size}</div>
        <div className={styles.cubeStage}>
            <RubiksCube size={config.size} cubeSize={portrait ? 29 : 18}
                faceAppearances={appearanceFor(config)} autoRotate={false} initialRotation={INITIAL_ROTATION}
                scriptedRotation={motion.rotation} scriptedMotionIsFrameBased
                interruptibleScript={!isTour} disableInteraction={isTour}
                onInteractionStart={interact} onRotationChange={motion.recordRotation}
                focusedFaceIndex={faceIndex}
                focusedFaceLabel={motion.face && (isTour || motion.tourFinished) ? String(motion.count) : null}
                focusedFaceLabelRotation={motion.labelRotation}
                rowGuides={showRows ? { front: Array.from({ length: config.size }, (_, row) => ({ row, label: state.hintLevel >= 2 ? String(config.size) : undefined })) } : undefined}
            />
            {motion.mode === "demo" && !reducedMotion && <div className={styles.dragCue} aria-hidden="true"
                style={{ transform: `translate(${((motion.rotation?.y ?? INITIAL_ROTATION.y) - INITIAL_ROTATION.y) / 7}vw, ${-((motion.rotation?.x ?? INITIAL_ROTATION.x) - INITIAL_ROTATION.x) / 7}vw)` }}><Hand /></div>}
        </div>
        <div className={styles.cubeControls}>
            <span className={styles.dragText}>{isTour ? "Vamos contar as faces coloridas" : "Arraste para girar ↔ ↕"}</span>
            <div className={styles.rotationButtons} aria-label="Girar o cubo">
                <button disabled={isTour} aria-label="Girar para a esquerda" onClick={() => motion.rotateBy(0, -45)}><ArrowLeft /></button>
                <button disabled={isTour} aria-label="Ver a face de cima" onClick={() => motion.rotateBy(-45, 0)}><ArrowUp /></button>
                <button disabled={isTour} aria-label="Ver a face de baixo" onClick={() => motion.rotateBy(45, 0)}><ArrowDown /></button>
                <button disabled={isTour} aria-label="Girar para a direita" onClick={() => motion.rotateBy(0, 45)}><ArrowRight /></button>
            </div>
            {(isTour || motion.tourFinished) && <div className={styles.faceCount} role="status">
                {isTour ? `${motion.count} ${motion.count === 1 ? "face contada" : "faces contadas"}` : `São ${motion.count} faces ${config.faceAdjective}.`}
            </div>}
            {isTour && <div className={styles.inlineActions}>
                {reducedMotion && <button onClick={motion.nextFace}>Próxima face</button>}
                <button onClick={motion.interact}>Voltar a girar</button>
            </div>}
            {countHint && !isTour && state.phase === "question" && <button className={styles.tourButton} onClick={tour}>Contar as faces de novo</button>}
        </div>
    </div>;
}
