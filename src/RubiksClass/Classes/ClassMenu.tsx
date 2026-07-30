import React from "react";
import styles from "./ClassMenu.module.css";
import ClassIcon from "./ClassIcon";
import { ROUTES } from "../../routes";

const ClassMenu: React.FC = () => {

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
          pagina={ROUTES.CLASS_3}
          label="Aula 3: Cubo Inteiro"
          imageSrc={`${import.meta.env.BASE_URL}4x4.png`}
          hasGame={false}
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
