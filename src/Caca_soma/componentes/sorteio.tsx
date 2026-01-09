import { useRef, useState, useEffect } from "react";

interface Properties {
  mudarJogar: () => void;
  clicar: boolean;
  mudarSorteado: (x: number) => void;
  rodada: number;
  customRange?: [number, number]; // Optional custom range for level mode
}

function Girar({ mudarJogar, clicar, mudarSorteado, rodada, customRange }: Properties) {
  const [displayedNumber, setDisplayedNumber] = useState(0);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = useRef<ReturnType<typeof setTimeout> | null>(null);

  const NumGenerator = () => {
    // If custom range is provided (level mode), use it
    if (customRange) {
      const [min, max] = customRange;
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
        const num = NumGenerator();
        setDisplayedNumber(num);
      }, 50);

      // Stop animation and fix number
      stop.current = setTimeout(() => {
        if (interval.current) clearInterval(interval.current);
        const finalNum = NumGenerator();
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
