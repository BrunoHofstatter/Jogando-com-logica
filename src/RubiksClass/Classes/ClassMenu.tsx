import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ClassMenu.module.css";
import ClassIcon from "./ClassIcon";
import { ROUTES } from "../../routes";

const ClassMenu: React.FC = () => {
  useEffect(() => {
    document.body.style.backgroundColor = "#d8b4ff";
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", "#d8b4ff");
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>Aulas do Cubo Mágico</div>
      </div>

      <div className={styles.classGrid}>
        <ClassIcon
          pagina={ROUTES.CLASS_1}
          label="Aula 1: Dimensões"
          imageSrc={`${import.meta.env.BASE_URL}2x2.png`}
        />
        <ClassIcon
          pagina={ROUTES.CLASS_2}
          label="Aula 2: Área das Faces"
          imageSrc={`${import.meta.env.BASE_URL}3x3.png`}
        />
        <ClassIcon
          pagina=""
          label="Em Breve"
          imageSrc={`${import.meta.env.BASE_URL}4x4.png`}
        />
        <ClassIcon
          pagina=""
          label="Em Breve"
          imageSrc={`${import.meta.env.BASE_URL}5x5.png`}
        />
      </div>
    </div>
  );
};

export default ClassMenu;
