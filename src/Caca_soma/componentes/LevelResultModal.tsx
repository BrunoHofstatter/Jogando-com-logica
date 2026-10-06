import { useEffect, useRef, useState } from 'react';
import styles from '../styles/LevelResultModal.module.css';
import { RoundResult } from '../Logic/gameTypes';
import { displayLevelSeconds } from '../Logic/levelGameLogic';

interface LevelResultModalProps {
  levelId: number;
  rounds: RoundResult[];
  totalTime: number;
  starsEarned: number;
  hasNextLevel: boolean;
  nextLevelUnlocked: boolean;
  onRetry: () => void;
  onNextLevel: () => void;
  onMenu: () => void;
}

function LevelResultModal({ levelId, rounds, totalTime, starsEarned, hasNextLevel,
  nextLevelUnlocked, onRetry, onNextLevel, onMenu }: LevelResultModalProps) {
  const [showDetails, setShowDetails] = useState(false);
  const modal = useRef<HTMLDivElement>(null);
  const detailsDialog = useRef<HTMLElement>(null);
  const detailsTrigger = useRef<HTMLButtonElement>(null);
  const mistakes = rounds.filter(attempt => !attempt.correct).length;
  const roundNumbers = [...new Set(rounds.map(attempt => attempt.roundNumber))];
  useEffect(() => { modal.current?.focus(); }, []);
  useEffect(() => {
    if (!showDetails) return;
    const trigger = detailsTrigger.current;
    detailsDialog.current?.focus();
    return () => { trigger?.focus(); };
  }, [showDetails]);

  return (
    <div className={styles.modalOverlay} onClick={event => event.stopPropagation()}>
      <div ref={modal} tabIndex={-1} className={styles.levelResultModal}
        role="dialog" aria-modal={!showDetails || undefined} aria-hidden={showDetails || undefined}
        inert={showDetails} aria-labelledby="level-result-title">
        <div id="level-result-title" className={styles.levelTitle}>Nível {levelId} concluído!</div>
        <div className={styles.starsContainer} aria-label={starsEarned + ' estrelas'}>
          {[1, 2, 3].map(star => <span key={star} aria-hidden="true"
            className={star <= starsEarned ? styles.starFilled : styles.starEmpty}>★</span>)}
        </div>
        <div className={styles.resultStats}>
          <p className={styles.statLine}>Tempo: {displayLevelSeconds(totalTime)}s</p>
          <p className={styles.statLine}>Erros: {mistakes}</p>
          {hasNextLevel && <p>{nextLevelUnlocked ? 'Próximo nível liberado!' :
            'Conquiste 2 estrelas para liberar o próximo nível.'}</p>}
        </div>
        <div className={styles.detailsButtonWrapper}>
          <button ref={detailsTrigger} type="button" className={styles.detailsToggle} aria-expanded={showDetails}
            aria-controls="level-round-details" onClick={() => setShowDetails(true)}>
            Ver detalhes das rodadas
          </button>
        </div>
        <div className={styles.resultActions}>
          <button type="button" onClick={onMenu} className={styles.actionBtn}>Menu</button>
          <button type="button" onClick={onRetry} className={styles.actionBtn}>Tentar novamente</button>
          {hasNextLevel && nextLevelUnlocked && <button type="button" onClick={onNextLevel}
            className={[styles.actionBtn, styles.primaryBtn].join(' ')}>Próximo nível</button>}
        </div>
      </div>
      {showDetails && <div className={styles.detailsBackdrop} onClick={() => setShowDetails(false)}>
        <section ref={detailsDialog} tabIndex={-1} className={styles.detailsDialog}
          role="dialog" aria-modal="true" aria-labelledby="round-details-title"
          onClick={event => event.stopPropagation()} onKeyDown={event => {
            if (event.key === 'Escape') { event.preventDefault(); setShowDetails(false); }
            if (event.key !== 'Tab') return;
            const controls = event.currentTarget.querySelectorAll<HTMLElement>('button, summary');
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
              event.preventDefault(); last.focus();
            } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
          }}>
          <header className={styles.detailsHeader}>
            <h2 id="round-details-title">Detalhes das rodadas</h2>
            <button type="button" className={styles.detailsClose} aria-label="Fechar detalhes"
              onClick={() => setShowDetails(false)}>×</button>
          </header>
          <div id="level-round-details" className={styles.roundDetails}>
            {roundNumbers.map(roundNumber => {
              const attempts = rounds.filter(attempt => attempt.roundNumber === roundNumber);
              const errors = attempts.filter(attempt => !attempt.correct).length;
              const time = attempts.reduce((total, attempt) => total + attempt.timeTaken, 0);
              return <details key={roundNumber} className={styles.roundDetail}>
                <summary>Rodada {roundNumber} · {displayLevelSeconds(time)}s · {errors} {errors === 1 ? 'erro' : 'erros'}</summary>
                {attempts.map((attempt, index) => (
                  <div key={index} className={[styles.detailItem, attempt.correct ? styles.detailCorrect : styles.detailIncorrect].join(' ')}>
                    <span className={styles.detailInfo}>
                      Tentativa {index + 1}: {attempt.selectedNumbers.join(' + ')} = {attempt.sum}
                      {' · '}Mágico: {attempt.magicNumber}{' · '}{displayLevelSeconds(attempt.timeTaken)}s
                    </span>
                    <span aria-label={attempt.correct ? 'Correta' : 'Incorreta'}>{attempt.correct ? '✓' : '✗'}</span>
                  </div>
                ))}
              </details>;
            })}
          </div>
        </section>
      </div>}
    </div>
  );
}

export default LevelResultModal;
