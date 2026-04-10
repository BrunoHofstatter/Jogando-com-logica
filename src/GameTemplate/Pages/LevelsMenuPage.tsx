import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/levelsMenu.module.css";
import { GAME_TEMPLATE_CONFIG } from "../gameTemplateConfig";

function LevelsMenuPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.backgroundColor = GAME_TEMPLATE_CONFIG.themeColor;

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }

    metaThemeColor.setAttribute("content", GAME_TEMPLATE_CONFIG.themeColor);
  }, []);

  return (
    <div className={styles.gamePageContainer}>
      <div className={styles.headerBlock}>
        <h1 className={styles.gameTitle}>Niveis</h1>
        <p className={styles.subtitle}>
          Pagina inicial de niveis pronta para ser adaptada ao novo jogo.
        </p>
      </div>

      <div className={styles.placeholderPanel}>
        <p className={styles.placeholderText}>
          Adicione aqui a grade de niveis, bloqueios, progresso e botoes
          especificos do jogo.
        </p>
      </div>

      <button
        className={styles.voltarBtn}
        onClick={() => navigate(GAME_TEMPLATE_CONFIG.routes.rules)}
      >
        Voltar
      </button>
    </div>
  );
}

export default LevelsMenuPage;
