import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Regras.module.css";
import { GAME_TEMPLATE_CONFIG } from "../gameTemplateConfig";

function RegrasPage() {
  const navigate = useNavigate();
  const [showDetailedRules, setShowDetailedRules] = useState(false);

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
    <div className={styles.regrasPage}>
      <div className={styles.boxRegras}>
        <div className={styles.gameTitle}>{GAME_TEMPLATE_CONFIG.displayName}</div>
        <img
          src={GAME_TEMPLATE_CONFIG.previewImage}
          className={styles.preview}
          alt={`Previa do jogo ${GAME_TEMPLATE_CONFIG.displayName}`}
        />
      </div>

      <div className={styles.botoes}>
        <button
          className={styles.primaryButton}
          onClick={() => navigate(GAME_TEMPLATE_CONFIG.routes.game)}
        >
          Jogar
        </button>

        {GAME_TEMPLATE_CONFIG.hasLevels && (
          <div className={styles.modeSelect}>
            <div className={styles.levelsRow}>
              <label className={styles.levelsLabel}>
                <input
                  type="radio"
                  name={GAME_TEMPLATE_CONFIG.modeInputName}
                  checked
                  readOnly
                />
                Niveis
              </label>
              <button
                className={styles.secondaryButton}
                onClick={() => navigate(GAME_TEMPLATE_CONFIG.routes.levels)}
              >
                Abrir
              </button>
            </div>
          </div>
        )}

        <div className={styles.bottomAuxButtons}>
          {GAME_TEMPLATE_CONFIG.hasLevels && (
            <button
              className={styles.auxButton}
              onClick={() => navigate(GAME_TEMPLATE_CONFIG.routes.levels)}
            >
              Niveis
            </button>
          )}
          <button
            className={styles.auxButton}
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
                <h2>{`Regras do jogo ${GAME_TEMPLATE_CONFIG.displayName}`}</h2>
                <p>
                  Esta pagina e um ponto de partida. Troque este texto pelas
                  regras reais quando a mecanica estiver definida.
                </p>
                <h3>Estrutura inicial</h3>
                <p>
                  O fluxo basico ja esta separado em pagina de regras, pagina
                  principal e menu de niveis.
                </p>
                <h3>Proximos passos</h3>
                <p>
                  Adicione a logica do jogo, os componentes especificos e o
                  conteudo dos niveis conforme o projeto evoluir.
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
