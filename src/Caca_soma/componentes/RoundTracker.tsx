import styles from './roundTracker.module.css';

interface RoundTrackerProps {
  currentRound: number;
  totalRounds?: number;
  levelId: number;
  completedRounds: number;
  totalCells?: number;
  completedCells?: number;
}

function RoundTracker({ currentRound, totalRounds = 0, levelId, completedRounds,
  totalCells, completedCells = 0 }: RoundTrackerProps) {
  if (totalCells !== undefined) {
    return <div className={styles.container}>
      <div className={styles.roundText}>Nível {levelId} - Rodada {currentRound}</div>
      <div className={styles.roundText}>Marque todos os números</div>
      <div className={styles.roundText} role="status" aria-live="polite" data-board-progress>
        {completedCells}/{totalCells} números marcados
      </div>
    </div>;
  }
  return (
    <div className={styles.container}>
      <div className={styles.roundText}>
        Nível {levelId} - Rodada {currentRound}/{totalRounds}
      </div>

      <div className={styles.dotsRow} role="list" aria-label="Rodadas">
        {Array.from({ length: totalRounds }).map((_, index) => {
          const completed = index < completedRounds;
          const status = completed ? 'completed' : index === currentRound - 1 ? 'current' : 'pending';
          return <span key={index} className={styles.dot} data-status={status} role="listitem"
            aria-current={status === 'current' ? 'step' : undefined}
            aria-label={'Rodada ' + (index + 1) + (completed ? ', concluída' : status === 'current' ? ', atual' : ', próxima')}>
            <span aria-hidden="true">{index + 1}</span>
            {completed && <small aria-hidden="true">✓</small>}
          </span>;
        })}
      </div>
    </div>
  );
}

export default RoundTracker;
