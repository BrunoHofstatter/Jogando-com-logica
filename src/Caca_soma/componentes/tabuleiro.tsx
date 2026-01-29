import { useState, useEffect, useCallback } from "react";
import defaultStyles from "../styles/design.module.css"; // CSS Modules
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
  onTimeUpdate?: (tempo: number) => void;
  onOkayChange?: (okayFn: () => void) => void; // Pass okay function to parent
  boardSize?: 5 | 7 | 10; // Board dimension (default 10 for versus mode)
  maxSelections?: 2 | 3; // Max numbers to select (default 3 for versus mode)
  customStyles?: { [key: string]: string }; // Optional custom styles
  onCorrectMatch?: (indices: string[]) => void; // CB for tracking used cells
  onSelectionChange?: (numbers: number[]) => void; // CB for tracking selected numbers
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
  onOkayChange,
  boardSize = 10,
  maxSelections = 3,
  customStyles,
  onCorrectMatch,
  onSelectionChange,
}: Prop) {
  // Use custom styles if provided, otherwise default
  const styles = customStyles || defaultStyles;

  // Dynamic board size (5x5, 7x7, or 10x10)
  const [board, setBoard] = useState(
    Array.from({ length: boardSize }, () => Array(boardSize).fill(0))
  );

  // Create the submit turn function that can be passed to parent
  const okay = useCallback(() => {
    if (quantos >= 2) {
      // Capture current soma value before resetting
      const currentSoma = soma;
      const wasCorrect = sorteado === currentSoma;

      // Identify selected cells if correct
      if (wasCorrect && onCorrectMatch) {
        const selectedIndices: string[] = [];
        board.forEach((row, rIdx) => {
          row.forEach((cell, cIdx) => {
            if (cell === 1) {
              selectedIndices.push(`${rIdx}-${cIdx}`);
            }
          });
        });
        onCorrectMatch(selectedIndices);
      }

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
  }, [quantos, soma, sorteado, setQuantos, mudarSoma, mudarClicar, mudarJogar, mudarRodada, board, onCorrectMatch]);

  // Pass the okay function to parent when it changes
  useEffect(() => {
    if (onOkayChange) {
      // Wrap in a function to prevent React from treating it as a state updater
      onOkayChange(() => okay);
    }
  }, [onOkayChange, okay]);

  useEffect(() => {
    // Reset board if round is 0 (game reset) OR if board dimensions don't match config
    if (qualRodada === 0 || board.length !== boardSize) {
      setBoard(Array.from({ length: boardSize }, () => Array(boardSize).fill(0)));
    }
  }, [qualRodada, boardSize, board.length]);

  const toggleCell = (row: number, col: number, valor: number) => {
    let action: 'add' | 'remove' | 'none' = 'none';

    if (board[row][col] === 0 && jogar && quantos < maxSelections) {
      action = 'add';
    } else if (board[row][col] === 1 && jogar && quantos <= maxSelections) {
      action = 'remove';
    }

    if (action === 'none') return;

    // Calculate new selection for callback
    const newSelectedNumbers: number[] = [];
    board.forEach((r, rIdx) => {
      r.forEach((cell, cIdx) => {
        // If it's already selected (1) AND not the one we're toggling
        // OR if correct (2)? No, only current selection (1)
        if (cell === 1 && (rIdx !== row || cIdx !== col)) {
          newSelectedNumbers.push(rIdx * boardSize + cIdx + 1);
        }
      });
    });

    if (action === 'add') {
      newSelectedNumbers.push(valor);
      if (quantos < maxSelections) {
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
    } else if (action === 'remove') {
      // already collected others above
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

    if (onSelectionChange) {
      onSelectionChange(newSelectedNumbers);
    }
  };
  // Paleta de cores para as células clicadas

  return (
    <div data-target='tabuleiro'>
      <Timer
        jogar={jogar}
        addTempo={addTempo}
        soma={soma}
        onTimeUpdate={onTimeUpdate}
      />
      <div
        className={styles.board}
        style={{
          gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
          // @ts-ignore
          "--board-size": boardSize
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => (
            <div
              key={`${rIdx}-${cIdx}`}
              className={`${styles.celula} ${cell === 0
                ? styles.cellDefault
                : cell === 1
                  ? styles.cellSelected
                  : styles.cellCorrect
                }`}
              onClick={() => toggleCell(rIdx, cIdx, rIdx * boardSize + cIdx + 1)}
            >
              {rIdx * boardSize + cIdx + 1}
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default Tabuleiro;
