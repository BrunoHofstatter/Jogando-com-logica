import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Regras.module.css";
import { ROUTES } from "../../routes";

function RegrasPage() {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);
  return <div className={styles.regrasPage}>
    <div className={styles.boxRegras}><div className={styles.gameTitle}>Bomb Game</div></div>
    <div className={styles.botoes}>
      <button className={styles.button} onClick={() => navigate(ROUTES.BOMB_GAME_MP_LOBBY)}><span>Jogar online</span></button>
      <div className={styles["mode-select-rules"]}><div className={styles.levelsRow}><label><input type="radio" checked readOnly /> Nível 1: Números</label><button className={styles.levelsButton} onClick={() => navigate(ROUTES.BOMB_GAME_LEVELS)}>Níveis</button></div></div>
      <div className={styles.bottomAuxButtons}><button className={styles.detailedRulesButton} onClick={() => setShowRules(true)}>Como jogar</button></div>
      {showRules && <div className={styles.modalOverlay} onClick={() => setShowRules(false)}><div className={styles.modalContent} onClick={(event) => event.stopPropagation()}><button className={styles.closeButton} onClick={() => setShowRules(false)}>X</button><div className={styles.detailedRules}>
        <h2>Como jogar</h2><p>Este é um jogo online para duas pessoas. Uma vê a bomba e interage com os desafios. A outra vê o manual e explica as pistas.</p>
        <h3>Trabalhem em equipe</h3><p>Conversem em voz alta: nenhuma das duas telas mostra todas as informações necessárias.</p>
        <h3>Corações e tempo</h3><p>A equipe começa o Nível 1 com três corações e três minutos. Uma resposta errada remove um coração. A partida termina se o tempo ou os corações acabarem.</p>
      </div></div></div>}
    </div>
  </div>;
}
export default RegrasPage;
