import { useState, useEffect, useRef, useCallback } from "react";
import styles from "../styles/StopGame.module.css";

interface NumberRevealProps {
  finalNumber: number;
  possibleNumbers: readonly number[];
  onAnimationComplete: () => void;
  tutorialActive: boolean;
}

/**
 * Component that displays an animated number reveal
 * Shows a rapidly changing number that settles on a final "magic number"
 */
function NumberReveal({
  finalNumber,
  possibleNumbers,
  onAnimationComplete,
  tutorialActive,
}: NumberRevealProps) {
  const [displayedNumber, setDisplayedNumber] = useState<number>(4);

  const animationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Generate a random number from the difficulty's possible numbers
   */
  const NumGenerator = useCallback(() => {
    const possible = possibleNumbers.length > 0 ? possibleNumbers : [finalNumber];
    const index = Math.floor(Math.random() * possible.length);
    return possible[index];
  }, [finalNumber, possibleNumbers]);

  /**
   * Start the number animation sequence
   */
  useEffect(() => {
    // Rapidly change the displayed number
    animationIntervalRef.current = setInterval(() => {
      setDisplayedNumber(NumGenerator());
    }, 50);

    // Stop animation after 2 seconds and set final number
    stopTimeoutRef.current = setTimeout(() => {
      if (animationIntervalRef.current)
        clearInterval(animationIntervalRef.current);
      setDisplayedNumber(finalNumber);
    }, 2000);

    // Auto-advance to game after 3.5 seconds (only if tutorial is not active)
    if (!tutorialActive) {
      gameTimeoutRef.current = setTimeout(() => {
        onAnimationComplete();
      }, 3500);
    }

    // Cleanup
    return () => {
      if (animationIntervalRef.current)
        clearInterval(animationIntervalRef.current);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      if (gameTimeoutRef.current) clearTimeout(gameTimeoutRef.current);
    };
  }, [
    finalNumber,
    NumGenerator,
    onAnimationComplete,
    tutorialActive,
  ]);

  return (
    <div className={styles.sortPage}>
      <div className={styles.bordaSort}>
        <div className={styles.divSort}>
          <div className={styles.sort}>O número mágico é</div>
          <div className={styles.numeroBox} data-target="numeromagico">
            <span className={styles.numero}>{displayedNumber}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NumberReveal;
