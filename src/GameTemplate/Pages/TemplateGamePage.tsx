import styles from "../styles/GamePage.module.css";
import { GAME_TEMPLATE_CONFIG } from "../gameTemplateConfig";

function TemplateGamePage() {
  return (
    <div className={styles.gamePage}>
      <div className={styles.contentCard}>
        <h1 className={styles.title}>{GAME_TEMPLATE_CONFIG.displayName}</h1>
        <p className={styles.description}>
          Esta area esta pronta para receber a mecanica principal do jogo.
        </p>
        <p className={styles.description}>
          Os componentes, a logica e os niveis podem ser adicionados aos poucos.
        </p>
      </div>
    </div>
  );
}

export default TemplateGamePage;
