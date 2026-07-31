import { useNavigate } from "react-router-dom";
import styles from "../styles/levelsMenu.module.css";
import { ROUTES } from "../../routes";

function LevelsMenuPage() {
  const navigate = useNavigate();


  return (
    <div className={styles.gamePageContainer}>
      <div className={styles.gameTitle}>Níveis</div>

      <button
        className={styles.voltarBtn}
        onClick={() => navigate(ROUTES.HOUSES_RULES)}
      >
        Voltar
      </button>
    </div>
  );
}

export default LevelsMenuPage;
