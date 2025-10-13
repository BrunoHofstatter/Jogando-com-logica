// Updated StopJogo.tsx
import { useState, useEffect } from "react";
import "./Stop.css";
import "./JogoStop.css";
import CaixaStop from "./CaixaStop";
import { difficulties, DifficultyKey } from "./Difficulties";

type JogoStopProps = {
  randomNumber: number;
  difficulty: DifficultyKey;
};

type CaixaData =
  | {
      numero: number;
      conta: string;
      checar: boolean;
      isDual: false;
    }
  | {
      numeros: [number, number]; // <-- change this line
      contas: [string, string];
      checar: boolean;
      isDual: true;
    };

function StopJogo({ randomNumber, difficulty }: JogoStopProps) {
  function shuffleTogether<T, U>(
    arr1: readonly T[],
    arr2: readonly U[]
  ): [T[], U[]] {
    const indices = arr1.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const shuffled1 = indices.map((i) => arr1[i]);
    const shuffled2 = indices.map((i) => arr2[i]);
    return [shuffled1, shuffled2];
  }

  function formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} segundos`;
    } else {
      const minutos = Math.floor(seconds / 60);
      const segundos = seconds % 60;
      return `${minutos} minuto${minutos > 1 ? "s" : ""} e ${segundos} segundo${
        segundos !== 1 ? "s" : ""
      }`;
    }
  }

  function getValidNumber(
    randomNumber: number,
    conta: string,
    options: number[]
  ): number {
    let validOptions = options;

    const isClose = (a: number, b: number, epsilon = 0.00001) =>
      Math.abs(a - b) < epsilon;

    if (conta === "÷") {
      if (difficulty === "d6") {
        validOptions = options.filter((n) => {
          if (n === 0) return false;
          if (n === randomNumber) return false;

          const result = randomNumber / n;
          const decimal = Math.abs(result % 1);

          return (
            isClose(decimal, 0.3) ||
            isClose(decimal, 0.9) ||
            isClose(decimal, 0.1) ||
            isClose(decimal, 0) ||
            isClose(decimal, 0.5) ||
            isClose(decimal, 0.25) ||
            isClose(decimal, 0.75)
          );
        });
      } else {
        validOptions = options.filter((n) => n !== 0 && randomNumber % n === 0);
      }
    } else if (conta === "-") {
      if (difficulty === "d6") {
        validOptions = options; // allow negative results
      } else {
        validOptions = options.filter((n) => randomNumber - n >= 0);
      }
    }

    if (validOptions.length === 0) return randomNumber; // fallback
    const index = Math.floor(Math.random() * validOptions.length);
    return validOptions[index];
  }

  const [acertos, setAcertos] = useState(0);
  const [caixasData, setCaixasData] = useState<CaixaData[]>([]);
  const [count, setCount] = useState(0);
  const [showGame] = useState(true);
  const [pararJogo, setPararJogo] = useState(false);

  useEffect(() => {
    const {
      possibleNumbersByBox,
      contasPorBox,
      dualBoxes = [],
    } = difficulties[difficulty];

    const [shuffledNumbers, shuffledContas] = shuffleTogether(
      [...possibleNumbersByBox],
      [...contasPorBox]
    );

    const singleBoxes: CaixaData[] = shuffledNumbers.map((arr, index) => {
      const conta = shuffledContas[index];
      const numero = getValidNumber(randomNumber, conta, [...arr]);
      return {
        numero,
        conta,
        checar: false,
        isDual: false,
      } as const;
    });

    const dualBoxesData: CaixaData[] = dualBoxes.map((dualBox) => {
      const num1 = getValidNumber(randomNumber, dualBox.operations[0], [
        ...dualBox.numbers1,
      ]);
      const num2 = getValidNumber(randomNumber, dualBox.operations[1], [
        ...dualBox.numbers2,
      ]);

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

  useEffect(() => {
    if (!showGame || pararJogo) return;

    const interval = setInterval(() => {
      setCount((prevCount) => prevCount + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [showGame, pararJogo]);

  // Add Enter key listener to trigger STOP action
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !pararJogo && showGame) {
        event.preventDefault();
        setPararJogo(true);
      }
    };

    if (!pararJogo && showGame) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [pararJogo, showGame]);

  return (
    <div className="jogoStop">
      <div className="stopBorder">
        {!pararJogo && <h2>{count}</h2>}
        <div className="numMagico">
          <div className="numeroCaixa">
            <span className="numeroO">{randomNumber}</span>
          </div>
          {!pararJogo ? (
            <button className="pararJogo" onClick={() => setPararJogo(true)}>
              STOP
            </button>
          ) : (
            <div className="finalResultado">
              <div>Tempo:</div>
              <div>{formatTime(count)}</div>
              <div>Acertos: {acertos}</div>
            </div>
          )}
        </div>
        <div className="tabelaWrap">
          <div className="tabela">
            {caixasData.map((data, i) =>
              data.isDual ? (
                <CaixaStop
                  key={`caixa-${i}`}
                  numero_base={randomNumber}
                  numeros={data.numeros} // <-- pass numeros here
                  contas={data.contas}
                  checar={pararJogo}
                  registrarAcerto={() => setAcertos((prev) => prev + 1)}
                  isDual
                />
              ) : (
                <CaixaStop
                  key={`caixa-${i}`}
                  numero_base={randomNumber}
                  numero={data.numero} // <-- pass numero here
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

export default StopJogo;
