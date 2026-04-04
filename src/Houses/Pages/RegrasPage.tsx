import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Regras.module.css";
import { ROUTES } from "../../routes";

function RegrasPage() {
  const navigate = useNavigate();
  const [showDetailedRules, setShowDetailedRules] = useState(false);

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

  return (
    <div className={styles.regrasPage}>
      <div className={styles.boxRegras}>
        <div className={styles.gameTitle}>Houses</div>
        <img
          src={`${import.meta.env.BASE_URL}stopPreview.png`}
          className={styles.preview}
          alt="Prévia do Houses"
        />
      </div>

      <div className={styles.botoes}>
        <button
          className={styles.button}
          onClick={() => navigate(ROUTES.HOUSES_GAME)}
        >
          <span>Jogar</span>
        </button>

        <div className={styles["mode-select-rules"]}>
          <div className={styles.levelsRow}>
            <label>
              <input type="radio" name="houses-mode" checked readOnly />
              Níveis
            </label>
            <button
              className={styles.levelsButton}
              onClick={() => navigate(ROUTES.HOUSES_LEVELS)}
            >
              Abrir
            </button>
          </div>
        </div>

        <div className={styles.bottomAuxButtons}>
          <button className={styles.tutorialButton}>Níveis</button>
          <button
            className={styles.detailedRulesButton}
            onClick={() => setShowDetailedRules(true)}
          >
            Regras
          </button>
        </div>

        {showDetailedRules && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowDetailedRules(false)}
          >
            <div
              className={styles.modalContent}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className={styles.closeButton}
                onClick={() => setShowDetailedRules(false)}
              >
                X
              </button>

              <div className={styles.detailedRules}>
                <h2>Regras do Houses</h2>
                <p>
                  Esta página é um template inicial. Os devs podem substituir
                  este texto pelas regras reais do jogo quando a mecânica estiver
                  definida.
                </p>
                <h3>Estrutura inicial</h3>
                <p>
                  O fluxo já está conectado com página de regras, menu de níveis
                  e página principal do jogo.
                </p>
                <h3>Próximos passos</h3>
                <p>
                  Falta implementar a lógica do jogo, o conteúdo de cada nível e
                  os componentes específicos do Houses.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RegrasPage;
