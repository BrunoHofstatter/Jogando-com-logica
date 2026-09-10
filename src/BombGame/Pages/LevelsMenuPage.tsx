import { useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import styles from "../styles/levelsMenu.module.css";
import { ROUTES } from "../../routes";

function LevelsMenuPage() {
  const navigate = useNavigate();
  return <div className={styles.gamePageContainer}>
    <div className={styles.gameTitle}>Níveis</div>
    <div className={styles.levelsScrollWrapper}><div className={styles.levelsGrid}>
      <button className={`${styles.levelButton} ${styles.unlocked}`} onClick={() => navigate(`${ROUTES.BOMB_GAME_MP_LOBBY}?level=1`)}><span className={styles.levelNumber}>1</span><span className={styles.bombgameDescription}>Números</span></button>
      <button disabled className={`${styles.levelButton} ${styles.locked}`}><span className={styles.levelNumber}>2</span><LockKeyhole className={styles.lockIcon} /></button>
      <button className={`${styles.levelButton} ${styles.unlocked}`} onClick={() => navigate(`${ROUTES.BOMB_GAME_MP_LOBBY}?level=3`)}><span className={styles.levelNumber}>3</span><span className={styles.bombgameDescription}>Navegação</span></button>
      {[4, 5].map((level) => <button key={level} disabled className={`${styles.levelButton} ${styles.locked}`}><span className={styles.levelNumber}>{level}</span><LockKeyhole className={styles.lockIcon} /></button>)}
    </div></div>
    <div className={styles.bottomFooter}><button className={styles.voltarBtn} onClick={() => navigate(ROUTES.BOMB_GAME_RULES)}>Voltar</button></div>
  </div>;
}
export default LevelsMenuPage;
