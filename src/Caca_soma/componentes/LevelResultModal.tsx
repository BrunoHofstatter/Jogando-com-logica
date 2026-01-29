import React, { useState } from 'react';
import styles from '../styles/LevelResultModal.module.css';
import { RoundResult } from '../Logic/gameTypes';
// import StarDisplay from './StarDisplay';

interface LevelResultModalProps {
    levelId: number;
    rounds: RoundResult[];
    totalCorrect: number;
    totalTime: number;
    starsEarned: number;
    maxCorrect: number;
    nextLevelUnlocked: boolean;
    onRetry: () => void;
    onNextLevel: () => void;
    onMenu: () => void;
}

const LevelResultModal: React.FC<LevelResultModalProps> = ({
    levelId,
    rounds,
    totalCorrect,
    totalTime,
    starsEarned,
    maxCorrect,
    nextLevelUnlocked,
    onRetry,
    onNextLevel,
    onMenu
}) => {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.levelResultModal} ${showDetails ? styles.modalExpanded : ''}`}>
                <div className={styles.levelTitle}>
                    {starsEarned >= 2 ? `Nível ${levelId} Concluído!` : "Tente Novamente"}
                </div>

                <div className={styles.starsContainer}>
                    {[1, 2, 3].map(s => (
                        <span key={s} className={s <= starsEarned ? styles.starFilled : styles.starEmpty}>
                            ★
                        </span>
                    ))}
                </div>

                <div className={styles.resultStats}>
                    <p>Tempo: {totalTime.toFixed(1)}s</p>
                    <p>Acertos: {totalCorrect}/{maxCorrect}</p>
                </div>

                <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <button
                        className={styles.detailsToggle}
                        onClick={() => setShowDetails(!showDetails)}
                    >
                        Ver Detalhes das Rodadas
                    </button>

                    {showDetails && (
                        <>
                            <div className={styles.clickOutsideBackdrop} onClick={() => setShowDetails(false)} />
                            <div className={styles.detailsModalOverlay}>
                                <div className={styles.detailsList}>
                                    {rounds.map((round) => (
                                        <div key={round.roundNumber} className={`${styles.detailItem} ${round.correct ? styles.detailCorrect : styles.detailIncorrect}`}>
                                            <span className={styles.detailRound}>#{round.roundNumber}</span>
                                            <span className={styles.detailInfo}>
                                                Mágico: {round.magicNumber} | {round.selectedNumbers && round.selectedNumbers.length > 0 ? round.selectedNumbers.join(" + ") : `Soma: ${round.sum}`}
                                            </span>
                                            <span className={styles.detailIcon}>{round.correct ? '✓' : '✗'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.resultActions}>
                    <button onClick={onMenu} className={styles.actionBtn}>Menu</button>
                    <button onClick={onRetry} className={styles.actionBtn}>Tentar Novamente</button>
                    {starsEarned >= 2 && (
                        <button
                            onClick={onNextLevel}
                            className={`${styles.actionBtn} ${styles.primaryBtn}`}
                            disabled={!nextLevelUnlocked}
                        >
                            {nextLevelUnlocked ? 'Próximo Nível' : 'Bloqueado'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LevelResultModal;
