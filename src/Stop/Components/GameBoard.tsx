import { useState, useEffect } from "react";
import CalculationCell from "./CalculationCell";
import type { DifficultyKey } from "../Logic/gameConfig";
import { difficulties } from "../Logic/gameConfig";
import { shuffleTogether, formatTime, getValidNumber } from "../Logic/gameLogic";
import styles from "../styles/StopGame.module.css";

interface GameBoardProps {
  randomNumber: number;
  difficulty: DifficultyKey;
}

type CaixaData =
  | {
      numero: number;
      conta: string;
      checar: boolean;
      isDual: false;
    }
  | {
      numeros: [number, number];
      contas: [string, string];
      checar: boolean;
      isDual: true;
    };

/**
 * Main game board component
 * Manages timer, calculation cells, and game state
 */
function GameBoard({ randomNumber, difficulty }: GameBoardProps) {
  const [acertos, setAcertos] = useState(0);
  const [caixasData, setCaixasData] = useState<CaixaData[]>([]);
  const [count, setCount] = useState(0);
  const [showGame] = useState(true);
  const [pararJogo, setPararJogo] = useState(false);

  // Initialize calculation cells based on difficulty
  useEffect(() => {
    const {
      possibleNumbersByBox,
      contasPorBox,
      dualBoxes = [],
    } = difficulties[difficulty];

    // Shuffle the single-box configurations
    const [shuffledNumbers, shuffledContas] = shuffleTogether(
      [...possibleNumbersByBox],
      [...contasPorBox]
    );

    // Create single calculation cells
    const singleBoxes: CaixaData[] = shuffledNumbers.map((arr, index) => {
      const conta = shuffledContas[index];
      const numero = getValidNumber(randomNumber, conta, [...arr], difficulty);
      return {
        numero,
        conta,
        checar: false,
        isDual: false,
      } as const;
    });

    // Create dual calculation cells
    const dualBoxesData: CaixaData[] = dualBoxes.map((dualBox) => {
      const num1 = getValidNumber(
        randomNumber,
        dualBox.operations[0],
        [...dualBox.numbers1],
        difficulty
      );

      // Calculate intermediate result after first operation
      let intermediate = randomNumber;
      switch (dualBox.operations[0]) {
        case "+":
          intermediate = randomNumber + num1;
          break;
        case "-":
          intermediate = randomNumber - num1;
          break;
        case "x":
          intermediate = randomNumber * num1;
          break;
        case "÷":
          intermediate = randomNumber / num1;
          break;
      }

      // Validate second number against intermediate result, not original randomNumber
      const num2 = getValidNumber(
        intermediate,
        dualBox.operations[1],
        [...dualBox.numbers2],
        difficulty
      );

      return {
        numeros: [num1, num2] as [number, number],
        contas: [dualBox.operations[0], dualBox.operations[1]] as [
          string,
          string
        ],
        checar: false,
        isDual: true,
      } as const;
    });

    setCaixasData([...singleBoxes, ...dualBoxesData]);
  }, [randomNumber, difficulty]);

  // Timer effect
  useEffect(() => {
    if (!showGame || pararJogo) return;

    const interval = setInterval(() => {
      setCount((prevCount) => prevCount + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [showGame, pararJogo]);

  // Enter key listener to trigger STOP
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !pararJogo && showGame) {
        event.preventDefault();
        setPararJogo(true);
      }
    };

    if (!pararJogo && showGame) {
      document.addEventListener("keydown", handleKeyPress);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [pararJogo, showGame]);

  return (
    <div className={styles.jogoStop}>
      <div className={styles.stopBorder}>
        {/* Timer display */}
        {!pararJogo && <h2>{count}</h2>}

        {/* Magic number display and STOP button */}
        <div className={styles.numMagico}>
          <div className={styles.numeroCaixa}>
            <span className={styles.numeroO}>{randomNumber}</span>
          </div>
          {!pararJogo ? (
            <button
              data-target="stopbutton"
              className={styles.pararJogo}
              onClick={() => setPararJogo(true)}
            >
              STOP
            </button>
          ) : (
            <div className={styles.finalResultado}>
              <div>Tempo:</div>
              <div>{formatTime(count)}</div>
              <div>Acertos: {acertos}</div>
            </div>
          )}
        </div>

        {/* Calculation cells grid */}
        <div className={styles.tabelaWrap}>
          <div
            data-target="board"
            className={styles.tabela}
            style={
              {
                "--columns": difficulty === "d1" ? 4 : 5,
              } as React.CSSProperties
            }
          >
            {caixasData.map((data, i) =>
              data.isDual ? (
                <CalculationCell
                  key={`caixa-${i}`}
                  numero_base={randomNumber}
                  numeros={data.numeros}
                  contas={data.contas}
                  checar={pararJogo}
                  registrarAcerto={() => setAcertos((prev) => prev + 1)}
                  isDual
                />
              ) : (
                <CalculationCell
                  key={`caixa-${i}`}
                  numero_base={randomNumber}
                  numero={data.numero}
                  conta={data.conta}
                  checar={pararJogo}
                  registrarAcerto={() => setAcertos((prev) => prev + 1)}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameBoard;
