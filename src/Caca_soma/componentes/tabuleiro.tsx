import { useState, useEffect } from "react";
import styles from "../styles/design.module.css"; // CSS Modules
import Timer from "./timer";

interface Prop {
  mudarClicar: () => void;
  mudarJogar: () => void;
  mudarRodada: () => void;
  mudarSoma: (x: number) => void;
  addTempo: (x: number, currentSoma?: number) => void;
  soma: number;
  jogar: boolean;
  qualRodada: number;
  quantos: number;
  setQuantos: (x: number) => void;
  sorteado: number;
  onTimeUpdate?: (tempo: number) => void; // Add time update callback
}

function Tabuleiro({
  jogar,
  mudarClicar,
  mudarJogar,
  mudarRodada,
  mudarSoma,
  soma,
  addTempo,
  qualRodada,
  quantos,
  setQuantos,
  sorteado,
  onTimeUpdate,
}: Prop) {
  // 10x10 matrix filled with false
  const [board, setBoard] = useState(
    Array.from({ length: 10 }, () => Array(10).fill(0))
  );

  const okay = () => {
    if (quantos >= 2) {
      // Capture current soma value before resetting
      const currentSoma = soma;
      const wasCorrect = sorteado === currentSoma;

      setBoard((prev) =>
        prev.map((r, rIdx) =>
          r.map((cell, cIdx) => (cell === 1 ? (wasCorrect ? 2 : 0) : cell))
        )
      );

      setQuantos(0);
      mudarSoma(0);
      mudarClicar();
      mudarJogar();
      mudarRodada();
    }
  };

  useEffect(() => {
    if (qualRodada === 0) {
      setBoard(Array.from({ length: 10 }, () => Array(10).fill(0)));
    }
  }, [qualRodada]);

  const toggleCell = (row: number, col: number, valor: number) => {
    if (board[row][col] === 0 && jogar && quantos < 3) {
      if (quantos < 3) {
        setQuantos(quantos + 1);
        mudarSoma(valor);
      }

      setBoard((prev) =>
        prev.map((r, rIdx) =>
          r.map((cell, cIdx) =>
            rIdx === row && cIdx === col && jogar ? 1 : cell
          )
        )
      );
    }
    if (board[row][col] === 1 && jogar && quantos <= 3) {
      setQuantos(quantos - 1);
      mudarSoma(-valor);
      setBoard((prev) =>
        prev.map((r, rIdx) =>
          r.map((cell, cIdx) =>
            rIdx === row && cIdx === col && jogar ? 0 : cell
          )
        )
      );
    }
  };
  // Paleta de cores para as células clicadas

  return (
    <>
      <Timer
        jogar={jogar}
        addTempo={addTempo}
        soma={soma}
        onTimeUpdate={onTimeUpdate}
      />
      <div className={styles.board}>
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => (
            <div
              key={`${rIdx}-${cIdx}`}
              className={`${styles.celula} ${
                cell === 0
                  ? styles.cellDefault
                  : cell === 1
                  ? styles.cellSelected
                  : styles.cellCorrect
              }`}
              onClick={() => toggleCell(rIdx, cIdx, rIdx * 10 + cIdx + 1)}
            >
              {rIdx * 10 + cIdx + 1}
            </div>
          ))
        )}
      </div>
      <div>
        <button onClick={() => okay()}>OK</button>
      </div>
    </>
  );
}

export default Tabuleiro;
