import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/levelsMenu.module.css";
import { ROUTES } from "../../routes";

function LevelsMenuPage() {
  const navigate = useNavigate();

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
    <div className={styles.gamePageContainer}>
      <div className={styles.gameTitle}>Níveis</div>

      
     
        <button
          className={styles.voltarBtn}
          onClick={() => navigate(ROUTES.BOMB_GAME_RULES)}
        >
          Voltar
        </button>
      </div>
   
  );
}

export default LevelsMenuPage;
