import React, { useState } from "react";
import { Lightbulb } from "lucide-react";
interface HintProps {
  title: string;
  hint1: React.ReactNode;
  hint2?: React.ReactNode;
  hint3?: React.ReactNode;
  hint4?: React.ReactNode;
  hint5?: React.ReactNode;
  hint6?: React.ReactNode;
  hint7?: React.ReactNode;
  hint8?: React.ReactNode;
  hint9?: React.ReactNode;
  hint10?: React.ReactNode;
  styleFile?: any;
}

const Hint: React.FC<HintProps> = ({
  title,
  hint1,
  hint2,
  hint3,
  hint4,
  hint5,
  hint6,
  hint7,
  hint8,
  hint9,
  hint10,
  styleFile: customStyles,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentHint, setCurrentHint] = useState(1);
  const styles = customStyles;

  // Collect all provided hints
  const hints = [
    hint1,
    hint2,
    hint3,
    hint4,
    hint5,
    hint6,
    hint7,
    hint8,
    hint9,
    hint10,
  ].filter((hint): hint is React.ReactNode => hint !== undefined);

  const totalHints = hints.length;

  const showNextHint = () => {
    if (currentHint < totalHints) {
      setCurrentHint(currentHint + 1);
    }
  };

  const showPreviousHint = () => {
    if (currentHint > 1) {
      setCurrentHint(currentHint - 1);
    }
  };

  const closeHints = () => {
    setIsOpen(false);
    setCurrentHint(1);
  };

  return (
    <div className={styles.hintContainer}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={styles.hintToggle}
      >
        Dicas <Lightbulb className={styles.lightbulb} />
      </button>

      {isOpen && (
        <div className={styles.hintModalOverlay} onClick={closeHints}>
          <div className={styles.hintModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.hintHeader}>

              <button onClick={closeHints} className={styles.closeButton}>
                ×
              </button>
            </div>

            <div className={styles.hintContent}>
              {/* Show only the current hint */}
              <div className={styles.hintItem}>
                {hints[currentHint - 1]}
              </div>
            </div>

            <div className={styles.hintNavigation}>
              <button
                onClick={showPreviousHint}
                disabled={currentHint === 1}
                className={styles.navButton}
              >
                Voltar
              </button>
              <button
                onClick={showNextHint}
                disabled={currentHint === totalHints}
                className={styles.navButton}
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hint;