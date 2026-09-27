import { useCallback, useEffect } from "react";
import RubiksCube from "../../Components/RubiksCube";
import { appearanceFor, FACE_ORDER, hintText, homeRotation, type Configuration, type LessonState, type LessonStep } from "./class3Lesson";
import { useFaceMotion } from "./useFaceMotion";
import { rotationCueFor } from "./rotationCue";
import styles from "./Class3TotalSquares.module.css";

interface Props { config: Configuration; step: LessonStep; state: LessonState; reducedMotion: boolean; portrait: boolean; practicedRotation: boolean; onPractice: () => void }
export function LessonCube({ config, step, state, reducedMotion, portrait, practicedRotation, onPractice }: Props) {
    const cue = state.phase === "question" && state.hintLevel === 0 ? rotationCueFor(step, practicedRotation) : null;
    const motion = useFaceMotion(config, reducedMotion, cue, state.stepIndex);
    const { interact, focus, tour } = motion;
    const handleInteraction = useCallback(() => { interact(); onPractice(); }, [interact, onPractice]);
    const showRows = state.phase === "question" && state.hintLevel > 0 && step.kind === "faceExpression";
    const countHint = state.hintLevel >= 2 && step.kind !== "faceExpression" && step.kind !== "calculation";
    useEffect(() => {
        if (state.phase !== "question") { interact(); return; }
        if (!state.hintLevel) return;
        if (countHint && state.hintLevel === 2) tour();
        else if (state.hintLevel === 1 || step.kind === "faceExpression") focus(step.kind === "faceExpression");
    }, [countHint, focus, interact, state.hintLevel, state.phase, state.stepIndex, step.kind, tour]);

    const isTour = motion.mode === "tour";
    const faceIndex = motion.face ? FACE_ORDER.indexOf(motion.face) : null;
    return <div className={styles.leftPanel}>
        <div className={styles.headerOverlay}>
            {state.phase === "question" && state.hintLevel > 0 && step.kind !== "calculation" &&
                <div className={styles.hintCard} role="status" aria-live="polite">{hintText(step, state.hintLevel)}</div>}
        </div>
        <div className={styles.cubeStage} role="group" tabIndex={isTour ? -1 : 0}
            aria-label={`Cubo ${config.size} por ${config.size}. Arraste ou use as setas do teclado para girar.`}
            onKeyDown={event => {
                const directions: Record<string, [number, number]> = { ArrowLeft: [0, -30], ArrowRight: [0, 30], ArrowUp: [-30, 0], ArrowDown: [30, 0] };
                if (isTour || !directions[event.key]) return;
                event.preventDefault(); handleInteraction(); motion.rotateBy(...directions[event.key]);
            }}>
            <RubiksCube size={config.size} cubeSize={portrait ? 33 : 22}
                faceAppearances={appearanceFor(config)} autoRotate={false} initialRotation={homeRotation(config)}
                scriptedRotation={motion.rotation} scriptedMotionIsFrameBased
                interruptibleScript={!isTour} disableInteraction={isTour}
                onInteractionStart={handleInteraction} onRotationChange={motion.recordRotation}
                focusedFaceIndex={showRows ? null : faceIndex}
                focusedFaceLabel={motion.face && (isTour || motion.tourFinished) ? String(motion.count) : null}
                focusedFaceLabelRotation={motion.labelRotation}
                hintAnimationKey={showRows ? `${state.stepIndex}-${state.hintLevel}` : undefined}
                highlightRegion={showRows ? { type: state.hintLevel === 1 ? "row" : "face", index: 0 } : null}
                showCounting={showRows && state.hintLevel >= 3}
                rowGuides={showRows ? { front: Array.from({ length: state.hintLevel === 1 ? 1 : config.size }, (_, row) => ({ row, label: state.hintLevel >= 2 ? String(config.size) : undefined })) } : undefined}
            />
            {motion.mode === "demo" && cue && motion.cueFrame.opacity > 0 && <div className={styles.rotationDemo}
                style={{ opacity: motion.cueFrame.opacity }}>
                <div className={styles.rotationTooltip} role="note" aria-label="Como girar o cubo">
                    {cue === "vertical" ? "Arraste para cima e veja embaixo" : "Arraste o cubo para girar"}
                </div>
                <div className={styles.dragCue} aria-hidden="true"
                    style={{ transform: `translate(${cue === "horizontal" ? -motion.cueFrame.travel * 5 : 0}vw, ${cue === "vertical" ? -motion.cueFrame.travel * (portrait ? 10 : 5) : 0}vw)` }}>
                    <span className={styles.dragContact} /><svg viewBox="0 0 34 36" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 19V6a3 3 0 0 1 6 0v7a3 3 0 0 1 6 0v2a3 3 0 0 1 6 0v3a2 2 0 0 1 4 0v7c0 6-4 9-10 9h-3c-4 0-6-2-8-5l-7-9a3 3 0 0 1 4-4Z" />
                        <path d="M15 13v8m6-6v7m6-4v5" fill="none" />
                    </svg>
                </div>
            </div>}
        </div>
        {(isTour || motion.tourFinished || (countHint && state.phase === "question")) && <div className={styles.tourControls}>
            {(isTour || motion.tourFinished) && <div className={styles.faceCount} role="status">
                {isTour ? `${motion.count} ${motion.count === 1 ? "face contada" : "faces contadas"}` : `São ${motion.count} faces ${config.faceAdjective}.`}
            </div>}
            {isTour && <div className={styles.inlineActions}>
                <button className={styles.hintButton} onClick={motion.interact}>Voltar a girar</button>
            </div>}
            {countHint && !isTour && state.phase === "question" && <button className={styles.hintButton} onClick={tour}>Contar novamente</button>}
        </div>}
    </div>;
}
