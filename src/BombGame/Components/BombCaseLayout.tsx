import type { ReactNode } from "react";

import type { SectionId } from "../Logic/level1";
import styles from "../styles/BombCaseLayout.module.css";

interface BombCaseLayoutProps {
  children: ReactNode;
  completedSections: SectionId[];
  time: string;
  urgent: boolean;
}

const landscapeArtwork = `${import.meta.env.BASE_URL}bombGameCaseComicLandscape.webp`;
const portraitArtwork = `${import.meta.env.BASE_URL}bombGameCaseComicPortrait.webp`;

export default function BombCaseLayout({
  children,
  completedSections,
  time,
  urgent,
}: BombCaseLayoutProps) {
  const disarmed = completedSections.length === 3;
  const wireClass = (section: SectionId, colorClass: string) =>
    `${styles.wire} ${colorClass} ${
      completedSections.includes(section) ? styles.wireComplete : ""
    }`;

  return (
    <main className={styles.stage} aria-label="Maleta de módulos do nível 1">
      <picture className={styles.artwork} aria-hidden="true">
        <source
          media="(orientation: portrait) and (max-width: 650px)"
          srcSet={portraitArtwork}
        />
        <img src={landscapeArtwork} alt="" draggable={false} />
      </picture>

      <div
        className={`${styles.timerScreen} ${urgent ? styles.timerUrgent : ""} ${
          disarmed ? styles.timerDisarmed : ""
        }`}
        role="timer"
        aria-label={`Tempo restante: ${time}`}
      >
        <span>Tempo</span>
        <strong>{time}</strong>
      </div>

      <div className={styles.interior}>
        <svg
          className={styles.wireNetwork}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path className={wireClass(1, styles.redWire)} d="M100 18 H94" />
          <path
            className={wireClass(2, styles.yellowWire)}
            d="M100 50 H51 V68 H47"
          />
          <path className={wireClass(3, styles.blueWire)} d="M100 82 H94" />
        </svg>
        <div className={styles.moduleGrid}>{children}</div>
      </div>
    </main>
  );
}
