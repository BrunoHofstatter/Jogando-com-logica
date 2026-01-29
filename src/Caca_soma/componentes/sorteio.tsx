import { useRef, useState, useEffect } from "react";
import { getPossibleSums } from "../Logic/gameLogic";

interface Properties {
  mudarJogar: () => void;
  clicar: boolean;
  mudarSorteado: (x: number) => void;
  rodada: number;
  customRange?: [number, number]; // Optional custom range for level mode
  availableNumbers?: number[]; // For validation
  numbersToSelect?: number;    // For validation
}

function Girar({ mudarJogar, clicar, mudarSorteado, rodada, customRange, availableNumbers, numbersToSelect }: Properties) {
  const [displayedNumber, setDisplayedNumber] = useState(0);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = useRef<ReturnType<typeof setTimeout> | null>(null);

  const NumGenerator = (mustBeValid = false) => {
    // Logic for Level Mode with validation
    if (customRange && availableNumbers && numbersToSelect) {
      const [min, max] = customRange;

      // If we need a strictly valid number (final result)
      if (mustBeValid) {
        const possibleSums = getPossibleSums(availableNumbers, numbersToSelect);
        const validInScope = Array.from(possibleSums).filter(n => n >= min && n <= max);

        if (validInScope.length > 0) {
          const idx = Math.floor(Math.random() * validInScope.length);
          return validInScope[idx];
        }

        // Fallback: If no sums in range, pick ANY valid sum
        if (possibleSums.size > 0) {
          const allValid = Array.from(possibleSums);
          return allValid[Math.floor(Math.random() * allValid.length)];
        }
        // If absolutely no sums possible (empty board?), fall through to random
      }

      // Default random behavior (animation or fallback)
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Otherwise, use rodada-based calculation (versus mode)
    return Math.floor(
      Math.random() * (150 - rodada * 3 + 3) + (rodada * 3 + 3)
    );
  };

  useEffect(() => {
    if (clicar === false) {
      interval.current = setInterval(() => {
        const num = NumGenerator(false); // Quick random for animation
        setDisplayedNumber(num);
      }, 50);

      // Stop animation and fix number
      stop.current = setTimeout(() => {
        if (interval.current) clearInterval(interval.current);
        const finalNum = NumGenerator(true); // Enforce validity for final number
        setDisplayedNumber(finalNum);
        mudarSorteado(finalNum);
        mudarJogar();
      }, 2000);

      return () => {
        if (interval.current) clearInterval(interval.current);
        if (stop.current) clearTimeout(stop.current);
      };
    }
  }, [clicar]);

  return <div>{displayedNumber}</div>;
}

export default Girar;
