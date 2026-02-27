import { useNavigate } from "react-router-dom";
import styles from "./ClassIcon.module.css";

interface ClassIconProps {
  pagina: string;
  label: string;
  imageSrc?: string;
}

function ClassIcon({ pagina, label, imageSrc }: ClassIconProps) {
  const navigate = useNavigate();

  const isDisabled = label === "Em Breve" || !pagina;

  const handleLearnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) return;
    navigate(`/${pagina}`);
  }

  const handleGameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) return;
    navigate(`/${pagina}?mode=game`);
  }

  return (
    <div
      onClick={isDisabled ? undefined : handleLearnClick}
      className={`${styles.classIcon} ${isDisabled ? styles.disabled : ""}`}
    >
      <div className={styles.classIconInner}>
        <span className={styles.classLabel}>{label}</span>
        <div className={styles.classIconContainer}>
          {imageSrc && <img src={imageSrc} className={styles.classIconImg} alt={label} />}
        </div>
        {!isDisabled && (
          <div className={styles.buttonGroup}>
            <button className={`${styles.actionButton} ${styles.btnLearn}`} onClick={handleLearnClick}>Aprender</button>
            <button className={`${styles.actionButton} ${styles.btnGame}`} onClick={handleGameClick}>Jogar</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClassIcon;
