import { useState } from "react";
import styles from "../styles/regras.module.css";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes";


type MandatoryCapture = true | false;

function DamasRegras() {
  const navigate = useNavigate();
  const [MandatoryCapture, setMandatoryCapture] = useState<MandatoryCapture>(false);
  
  function jogarStop() {
    navigate(ROUTES.BASE_GAME, { state: { MandatoryCapture } });
  }
  
  return (
    <div className={styles.regrasPage}>
      {/* Left Side - Rules */}
      <div className={styles.boxBorder}>
        <div className={styles.boxRegras}>
          
          <ul className={styles.regras}>
            <li>
              <h3>Regra 1: Como jogar Ultimate Tic-Tac-Toe</h3>
              <img
                src={`${import.meta.env.BASE_URL}ComoJogarStop1.png`}
                className={`${styles.como} ${styles.c1}`}
              />
            </li>
            <li>
              <img
                src={`${import.meta.env.BASE_URL}ComoJogarStop2.png`}
                className={`${styles.como} ${styles.c2}`}
              />
              <h3>Regra 2: Ganhe os tabuleiros pequenos</h3>
            </li>
            <li>
              <h3>Regra 3: A jogada decide o próximo tabuleiro</h3>
              <div className={styles.c3Box}>
                <img
                  src={`${import.meta.env.BASE_URL}ComoJogarStop3.png`}
                  className={`${styles.como} ${styles.c3}`}
                />
              </div>
            </li>
            <li>
              <img
                src={`${import.meta.env.BASE_URL}ComoJogarStop4.png`}
                className={`${styles.como} ${styles.c4}`}
              />
              <h3>Regra 4: Ganhe o jogo final</h3>
            </li>
          </ul>
        </div>
      </div>

      {/* Right Side - Game Controls */}
      <div className={styles.botoes}>
        <button className={styles.button} onClick={jogarStop}>
          <span>Jogar</span>
        </button>
        
        {/* Win mode selector */}
        <div className={styles['mode-select-rules']}>
          <label>
            <input
              type="radio"
              name="winMode"
              value="line"
              checked={MandatoryCapture === true}
              onChange={() => setMandatoryCapture(true)}
            />
            Captura obrigatória
          </label>
          <label>
            <input
              type="radio"
              name="winMode"
              value="majority"
              checked={MandatoryCapture === false}
              onChange={() => setMandatoryCapture(false)}
            />
            Captura não obrigatória
          </label>
        </div>
      </div>
    </div>
  );
}

export default DamasRegras;
