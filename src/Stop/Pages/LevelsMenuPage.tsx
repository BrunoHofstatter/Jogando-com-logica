import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/levelsMenu.module.css";
import { levels, getLevelStars, isLevelUnlocked, resetAllProgress } from "../Logic/levelsConfig";

function LevelsMenuPage() {
    const navigate = useNavigate();

    const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // When a level is clicked, instead of navigating, we just select it to show the modal
    const handleLevelClick = (levelId: number) => {
        if (isLevelUnlocked(levelId)) {
            setSelectedLevelId(levelId);
        }
    };

    const closeModal = () => setSelectedLevelId(null);

    const playSelectedLevel = () => {
        if (selectedLevelId !== null) {
            navigate("/stoppage", { state: { mode: "level", level: selectedLevelId } });
        }
    };

    const selectedLevelConfig = selectedLevelId ? levels.find(l => l.id === selectedLevelId) : null;

    return (
        <div className={styles.regrasPage} style={{ flexDirection: 'column', gap: '2vw' }}>
            <div className={styles.gameTitle}>Níveis</div>

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmText}>
                            Tem certeza que deseja deletar todo o progresso?
                        </div>
                        <div className={styles.confirmButtons}>
                            <button
                                className={`${styles.confirmBtn} ${styles.yesBtn}`}
                                onClick={() => {
                                    resetAllProgress();
                                    window.location.reload();
                                }}
                            >
                                Sim
                            </button>
                            <button
                                className={`${styles.confirmBtn} ${styles.noBtn}`}
                                onClick={() => setShowResetConfirm(false)}
                            >
                                Não
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Level Info Preview Modal */}
            {selectedLevelId && selectedLevelConfig && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.levelInfoModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.closeModalX} onClick={closeModal}>X</div>
                        <div className={styles.levelInfoTitle}>Nível {selectedLevelId}</div>

                        <div className={styles.starCriteriaContainer}>
                            <div className={styles.starCriteriaRow}>
                                <div className={styles.starIcon}>★</div>
                                <div className={styles.starText}>{selectedLevelConfig.stars[1].minCorrect} acertos</div>
                            </div>

                            <div className={styles.starCriteriaRow}>
                                <div className={styles.starIcon}>★★</div>
                                <div className={styles.starText}>
                                    {selectedLevelConfig.stars[2].minCorrect} acertos em {selectedLevelConfig.stars[2].maxTime}s
                                </div>
                            </div>

                            <div className={styles.starCriteriaRow}>
                                <div className={styles.starIcon}>★★★</div>
                                <div className={styles.starText}>
                                    {selectedLevelConfig.stars[3].minCorrect} acertos em {selectedLevelConfig.stars[3].maxTime}s
                                </div>
                            </div>
                        </div>

                        <button className={styles.playLevelButton} onClick={playSelectedLevel}>
                            JOGAR
                        </button>
                    </div>
                </div>
            )}

            {/* Scrollable Container for Levels Grid */}
            <div style={{
                flex: 1,
                width: '100%',
                overflowY: 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                paddingBottom: '2vw' // Space for scroll
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '2vw',
                    padding: '1vw',
                    maxWidth: '90vw'
                }}>
                    {levels.map((level) => {
                        const stars = getLevelStars(level.id);
                        const unlocked = isLevelUnlocked(level.id);

                        return (
                            <div
                                key={level.id}
                                onClick={() => handleLevelClick(level.id)}
                                className={styles.levelButton}
                                style={{
                                    background: unlocked
                                        ? 'radial-gradient(circle, #a02b2b, #851616)'
                                        : 'radial-gradient(circle, #5e1e1e, #3a0f0f)',
                                    border: '0.4vw solid #080303',
                                    borderRadius: '2vw',
                                    aspectRatio: '1',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    cursor: unlocked ? 'pointer' : 'default',
                                    filter: unlocked ? 'none' : 'grayscale(0.8)',
                                    position: 'relative'
                                }}
                            >
                                <div style={{
                                    fontSize: '4vw',
                                    color: unlocked ? '#e2a01d' : '#888',
                                    WebkitTextStroke: '0.2vw #080303',
                                    fontFamily: 'inherit'
                                }}>
                                    {level.id}
                                </div>

                                {unlocked && (
                                    <div style={{ display: 'flex', gap: '0.2vw' }}>
                                        {[1, 2, 3].map(s => (
                                            <span key={s} style={{
                                                fontSize: '1.5vw',
                                                color: s <= stars ? '#ffd700' : '#4a1515',
                                                WebkitTextStroke: '0.1vw #080303'
                                            }}>★</span>
                                        ))}
                                    </div>
                                )}

                                {!unlocked && (
                                    <div style={{
                                        position: 'absolute',
                                        fontSize: '3vw',
                                        opacity: 0.7
                                    }}>🔒</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <button
                className={styles.button}
                style={{ fontSize: '3vw', padding: '1vw 3vw' }}
                onClick={() => navigate("/jogoStop")}
            >
                Voltar
            </button>

            <button
                className={styles.resetProgressButton}
                onClick={() => setShowResetConfirm(true)}
            >
                Deletar progresso
            </button>
        </div>
    );
}

export default LevelsMenuPage;
