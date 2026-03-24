import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/levelsMenu.module.css";
import { levels, getLevelStars, isLevelUnlocked, resetAllProgress } from "../Logic/levelsConfig";
import { ROUTES } from "../../routes";

function LevelsMenuPage() {
    useEffect(() => {
        document.body.style.backgroundColor = "#ffbaba";
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement("meta");
            metaThemeColor.setAttribute("name", "theme-color");
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.setAttribute("content", "#ffbaba");
    }, []);
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
            navigate(ROUTES.STOP_GAME, { state: { mode: "level", level: selectedLevelId } });
        }
    };

    const selectedLevelConfig = selectedLevelId ? levels.find(l => l.id === selectedLevelId) : null;

    return (
        <div className={styles.gamePageContainer}>
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
            <div className={styles.levelsScrollWrapper}>
                <div className={styles.levelsGrid}>
                    {levels.map((level) => {
                        const stars = getLevelStars(level.id);
                        const unlocked = isLevelUnlocked(level.id);

                        return (
                            <div
                                key={level.id}
                                onClick={() => handleLevelClick(level.id)}
                                className={`${styles.levelButton} ${unlocked ? styles.unlocked : styles.locked}`}
                            >
                                <div className={styles.levelNumber}>
                                    {level.id}
                                </div>

                                {unlocked && (
                                    <div className={styles.levelStars}>
                                        {[1, 2, 3].map(s => (
                                            <span key={s} className={`${styles.star} ${s <= stars ? styles.starEarned : styles.starEmpty}`}>
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {!unlocked && (
                                    <div className={styles.lockIcon}>🔒</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={styles.bottomFooter}>
                <button
                    className={styles.resetProgressButton}
                    onClick={() => setShowResetConfirm(true)}
                >
                    Deletar progresso
                </button>
                <button
                    className={styles.voltarBtn}
                    onClick={() => navigate(ROUTES.STOP_RULES)}
                >
                    Voltar
                </button>
            </div>
        </div>
    );
}

export default LevelsMenuPage;
