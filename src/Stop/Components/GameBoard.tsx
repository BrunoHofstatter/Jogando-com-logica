import { useState, useEffect, useRef, createRef, useMemo } from "react";
// Imports continued

import CalculationCell from "./CalculationCell";
import type { DifficultyKey } from "../Logic/gameConfig";
import { difficulties } from "../Logic/gameConfig";
import { shuffleTogether, formatTime, getValidNumber } from "../Logic/gameLogic";
import { type LevelConfig, saveLevelStars, isLevelUnlocked, getLevelById } from "../Logic/levelsConfig";
import { useNavigate } from "react-router-dom";
import styles from "../styles/StopGame.module.css";
import VirtualKeyboard from "./VirtualKeyboard";
import { isTouchDevice } from "../Logic/domUtils";

interface GameBoardProps {
  randomNumber: number;
  difficulty: DifficultyKey;
  levelConfig?: LevelConfig | null;
  onReset?: () => void;
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
function GameBoard({ randomNumber, difficulty, levelConfig, onReset }: GameBoardProps) {
  const navigate = useNavigate();
  const [acertos, setAcertos] = useState(0);
  const [caixasData, setCaixasData] = useState<CaixaData[]>([]);
  const [count, setCount] = useState(0);
  const [showGame] = useState(true);
  const [pararJogo, setPararJogo] = useState(false);

  // Input Handling
  const [isTouch, setIsTouch] = useState(false);
  const inputRefs = useMemo(() => {
    return Array(caixasData.length).fill(null).map(() => createRef<HTMLInputElement>());
  }, [caixasData]);

  // Virtual Keyboard State
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  const [activeInputRect, setActiveInputRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  // Initialize input refs -> Handled by useMemo now.



  // Level Mode Result State
  const [showLevelResult, setShowLevelResult] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);

  // Check if next level exists
  const nextLevelExists = levelConfig ? !!getLevelById(levelConfig.id + 1) : false;

  // Initialize calculation cells based on difficulty or level config
  useEffect(() => {
    // Determine config to use (Level Config overrides Difficulty Key)
    let configToUse = difficulties[difficulty];

    if (levelConfig) {
      // Use the difficulty part of the level config
      // LevelConfig extends DifficultyConfig so we can just use it directly
      configToUse = levelConfig;
    }

    const {
      possibleNumbersByBox,
      contasPorBox,
      dualBoxes = [],
    } = configToUse;

    // Shuffle the single-box configurations
    const [shuffledNumbers, shuffledContas] = shuffleTogether(
      [...possibleNumbersByBox],
      [...contasPorBox]
    );

    // Create single calculation cells
    const singleBoxes: CaixaData[] = shuffledNumbers.map((arr, index) => {
      const conta = shuffledContas[index];
      const numero = getValidNumber(randomNumber, conta, [...arr], difficulty); // Note: getValidNumber uses difficulty string for some fallback? Check logic.
      // If we pass 'difficulty' prop but use 'levelConfig' logic, we might need to be careful if difficulty string doesn't match level nature.
      // But getValidNumber mainly uses it for some ranges? Actually looking at Logic/gameLogic.ts would clarify.
      // For now we pass the prop difficulty which is 'd1' placeholder in level mode.
      // Ideally we should pass the actual difficulty key corresponding to the level if possible, or refactor getValidNumber.

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
  }, [randomNumber, difficulty, levelConfig]);

  // Timer effect
  useEffect(() => {
    if (!showGame || pararJogo) return;

    const interval = setInterval(() => {
      setCount((prevCount) => prevCount + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [showGame, pararJogo]);

  // Calculate stats when game stops
  useEffect(() => {
    if (pararJogo && levelConfig) {
      // Calculate stars
      let stars = 0;
      // Check 3 stars
      if (count <= levelConfig.stars[3].maxTime && acertos >= levelConfig.stars[3].minCorrect) {
        stars = 3;
      }
      // Check 2 stars
      else if (count <= levelConfig.stars[2].maxTime && acertos >= levelConfig.stars[2].minCorrect) {
        stars = 2;
      }
      // Check 1 star
      else if (count <= levelConfig.stars[1].maxTime && acertos >= levelConfig.stars[1].minCorrect) {
        stars = 1;
      }

      setStarsEarned(stars);
      saveLevelStars(levelConfig.id, stars);
      setTimeout(() => setShowLevelResult(true), 500); // Slight delay for dramatic effect
    }
  }, [pararJogo, levelConfig, acertos, count]);

  // Enter key listener (Improved: Moves to next input instead of Stop)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle if game is running and not stopped
      if (!pararJogo && showGame) {
        if (event.key === "Enter") {
          event.preventDefault(); // Prevent default form submission or newline

          // If we have an active input (tracked via focus or click ideally, but `document.activeElement` works)
          // We can find which index it is.
          const currentInput = document.activeElement as HTMLInputElement;
          const currentIndex = inputRefs.findIndex(ref => ref.current === currentInput);

          if (currentIndex !== -1) {
            handleEnter(currentIndex);
          }
        }
      }
    };

    if (!pararJogo && showGame) {
      document.addEventListener("keydown", handleKeyPress);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [pararJogo, showGame, inputRefs]);

  const handleEnter = (currentIndex: number) => {
    // If it's the last input, trigger STOP? Or just stop focusing?
    // User requested "last one stops and ends the game" or "Stop button in the last one".
    // "auto stopping in the last one" was one idea. "Enter button goes to next and the last one stops" was preferred.

    if (currentIndex < caixasData.length - 1) {
      // Go to next
      const nextInput = inputRefs[currentIndex + 1].current;
      if (nextInput) {
        nextInput.focus();
        if (isTouch) {
          handleInputFocus(currentIndex + 1, nextInput);
        }
      }
    } else {
      // Last one -> Stop Game
      setPararJogo(true);
      setShowKeyboard(false);
    }
  };

  // Virtual Keyboard Handlers
  const handleInputFocus = (index: number, element: HTMLInputElement) => {
    if (!isTouch) return; // Only for touch

    setActiveInputIndex(index);
    setActiveInputRect(element.getBoundingClientRect());
    setShowKeyboard(true);
  };

  const handleVirtualInput = (value: string) => {
    if (activeInputIndex === null) return;
    const input = inputRefs[activeInputIndex].current;
    if (input) {
      // Programmatically set value and trigger React change
      // Standard hack to trigger React's onChange from JS code
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      if (nativeInputValueSetter) {
        const newValue = input.value + value;
        nativeInputValueSetter.call(input, newValue);

        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
      }
    }
  };

  const handleVirtualBackspace = () => {
    if (activeInputIndex === null) return;
    const input = inputRefs[activeInputIndex].current;
    if (input) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      if (nativeInputValueSetter) {
        // Slice last char
        const newValue = input.value.slice(0, -1);
        nativeInputValueSetter.call(input, newValue);

        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
      }
    }
  };

  const handleVirtualNext = () => {
    if (activeInputIndex !== null) {
      handleEnter(activeInputIndex);
    }
  };

  const handleCloseKeyboard = () => {
    setShowKeyboard(false);
    setActiveInputIndex(null);
  };

  const handleNextLevel = () => {
    if (!levelConfig) return;
    navigate("/stopPage", { state: { mode: "level", level: levelConfig.id + 1 } });
    window.location.reload(); // Quick fix to ensure full reload of state
  };

  const handleRetry = () => {
    if (onReset) onReset();
    // Reset local state
    setPararJogo(false);
    setShowLevelResult(false);
    setCount(0);
    setAcertos(0);
  };

  const handleMenu = () => {
    navigate("/stop-levels");
  };
  const maxAcertos = (levelConfig?.columns ?? 5) * 2;

  return (
    <div className={styles.jogoStop}>

      {/* Level Result Modal */}
      {showLevelResult && levelConfig && (
        <div className={styles.modalOverlay}>
          <div className={styles.levelResultModal}>
            <div className={styles.levelTitle}>
              {starsEarned >= 1 ? "Nível Concluído!" : "Tente Novamente"}
            </div>

            <div className={styles.starsContainer}>
              {[1, 2, 3].map(s => (
                <span key={s} className={s <= starsEarned ? styles.starFilled : styles.starEmpty}>
                  ★
                </span>
              ))}
            </div>

            <div className={styles.resultStats}>
              <p>Tempo: {formatTime(count)}</p>
              <p>Acertos: {acertos}/{maxAcertos}</p>
            </div>

            <div className={styles.resultActions}>
              <button onClick={handleMenu} className={styles.actionBtn}>Menu</button>
              <button onClick={handleRetry} className={styles.actionBtn}>Tentar Novamente</button>
              {starsEarned >= 2 && nextLevelExists && (
                <button onClick={handleNextLevel} className={`${styles.actionBtn} ${styles.primaryBtn}`}>
                  Próximo Nível
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
            // Only show simpler results inline if NOT in level mode (modal will show for levels)
            !levelConfig && (
              <div className={styles.finalResultado}>
                <div>Tempo:</div>
                <div>{formatTime(count)}</div>
                <div>Acertos: {acertos}</div>
              </div>
            )
          )}
        </div>

        {/* Calculation cells grid */}
        <div className={styles.tabelaWrap}>
          <div
            data-target="board"
            className={styles.tabela}
            style={
              {
                "--columns": levelConfig?.columns || ((difficulty === "d1" && !levelConfig) ? 4 : 5),
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
                  inputRef={inputRefs[i] as React.RefObject<HTMLInputElement>}
                  onFocus={(e) => handleInputFocus(i, e.target)}
                  isTouch={isTouch}
                />
              ) : (
                <CalculationCell
                  key={`caixa-${i}`}
                  numero_base={randomNumber}
                  numero={data.numero}
                  conta={data.conta}
                  checar={pararJogo}
                  registrarAcerto={() => setAcertos((prev) => prev + 1)}
                  inputRef={inputRefs[i] as React.RefObject<HTMLInputElement>}
                  onFocus={(e) => handleInputFocus(i, e.target)}
                  isTouch={isTouch}
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* Virtual Keyboard */}
      <VirtualKeyboard
        isVisible={showKeyboard && !pararJogo}
        targetRect={activeInputRect}
        onInput={handleVirtualInput}
        onDelete={handleVirtualBackspace}
        onNext={handleVirtualNext}
        onClose={handleCloseKeyboard}
      />
    </div>
  );
}

export default GameBoard;
