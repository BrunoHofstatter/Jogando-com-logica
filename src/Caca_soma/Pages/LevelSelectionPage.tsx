import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/levelsMenu.module.css";
import { levels, getLevelById } from "../Logic/levelConfigs";
import { isLevelUnlocked, resetAllProgress, getLevelProgress } from "../Logic/levelProgress";
import { ROUTES } from "../../routes";


function LevelSelectionPage() {
  useEffect(() => {
    document.body.style.backgroundColor = "#efc9c9";
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", "#efc9c9");
  }, []);

  const navigate = useNavigate();

  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [, setProgressTick] = useState(0);

  const handleLevelClick = (levelId: number) => {
    if (isLevelUnlocked(levelId)) {
      setSelectedLevelId(levelId);
    }
  };

  const closeModal = () => setSelectedLevelId(null);

  const playSelectedLevel = () => {
    if (selectedLevelId !== null) {
      navigate(`${ROUTES.CACA_SOMA_LEVEL_BASE}/${selectedLevelId}`);
    }
  };

  const handleResetProgress = () => {
    resetAllProgress();
    setProgressTick(prev => prev + 1);
    setShowResetConfirm(false);
    window.location.reload();
  };

  const selectedLevelConfig = selectedLevelId ? getLevelById(selectedLevelId) : null;
  const gridCols = levels[0].columns || 5;

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
                onClick={handleResetProgress}
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
                <div className={styles.starText}>{selectedLevelConfig.starThresholds.oneStarCorrect} acertos</div>
              </div>
              <div className={styles.starCriteriaRow}>
                <div className={styles.starIcon}>★★</div>
                <div className={styles.starText}>
                  {selectedLevelConfig.starThresholds.twoStarCorrect} acertos em {selectedLevelConfig.starThresholds.twoStarTime}s
                </div>
              </div>
              <div className={styles.starCriteriaRow}>
                <div className={styles.starIcon}>★★★</div>
                <div className={styles.starText}>
                  {selectedLevelConfig.starThresholds.threeStarCorrect} acertos em {selectedLevelConfig.starThresholds.threeStarTime}s
                </div>
              </div>
            </div>

            <button className={styles.playLevelButton} onClick={playSelectedLevel}>
              JOGAR
            </button>
          </div>
        </div>
      )}

      {/* Scrollable levels grid */}
      <div className={styles.levelsScrollWrapper}>
        <div
          className={styles.levelsGrid}
          style={{ '--grid-cols': gridCols } as React.CSSProperties}
        >
          {levels.map((level) => {
            const progress = getLevelProgress(level.levelId);
            const stars = progress ? progress.bestStars : 0;
            const unlocked = isLevelUnlocked(level.levelId);

            return (
              <div
                key={level.levelId}
                onClick={() => handleLevelClick(level.levelId)}
                className={`${styles.levelButton} ${unlocked ? styles.unlocked : styles.locked}`}
              >
                <div className={styles.levelNumber}>{level.levelId}</div>

                {unlocked && (
                  <div className={styles.levelStars}>
                    {[1, 2, 3].map(s => (
                      <span
                        key={s}
                        className={`${styles.star} ${s <= stars ? styles.starEarned : styles.starEmpty}`}
                      >★</span>
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

      {/* Footer: back + reset */}
      <div className={styles.bottomFooter}>
        <button
          className={styles.resetProgressButton}
          onClick={() => setShowResetConfirm(true)}
        >
          Deletar progresso
        </button>
        <button className={styles.voltarBtn} onClick={() => navigate(ROUTES.CACA_SOMA_RULES)}>
          Voltar
        </button>
        
      </div>
    </div>
  );
}

export default LevelSelectionPage;
