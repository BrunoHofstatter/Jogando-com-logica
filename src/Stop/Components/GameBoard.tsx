import { createRef, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import CalculationCell from "./CalculationCell";
import VirtualKeyboard from "./VirtualKeyboard";
import { formatTime } from "../Logic/gameLogic";
import {
  areAllStopAnswersFilled,
  evaluateStopRound,
  getFirstBlankStopAnswerIndex,
  type StopRound,
  type StopRoundResult,
} from "../Logic/stopRound";
import {
  getLevelById,
  saveLevelStars,
  type LevelConfig,
} from "../Logic/levelsConfig";
import { isTouchDevice } from "../Logic/domUtils";
import { ROUTES } from "../../routes";
import styles from "../styles/StopGame.module.css";

interface GameBoardProps {
  round: StopRound;
  levelConfig?: LevelConfig | null;
  onReset?: () => void;
  requireFilledBoardToStop?: boolean;
}

/**
 * Main game board component
 * Renders a pre-generated round and evaluates submitted answers.
 */
function GameBoard({
  round,
  levelConfig,
  onReset,
  requireFilledBoardToStop = false,
}: GameBoardProps) {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [roundResult, setRoundResult] = useState<StopRoundResult | null>(null);

  const [isTouch, setIsTouch] = useState(false);
  const inputRefs = useMemo(
    () => round.boxes.map(() => createRef<HTMLInputElement>()),
    [round],
  );
  const [answers, setAnswers] = useState(() => round.boxes.map(() => ""));

  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  const [activeInputRect, setActiveInputRect] = useState<DOMRect | null>(null);

  const [showLevelResult, setShowLevelResult] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);

  const roundEnded = roundResult !== null;
  const correctCount = roundResult?.correctCount ?? 0;
  const maxAcertos = round.boxes.length;
  const canStopRound =
    !requireFilledBoardToStop || areAllStopAnswersFilled(answers);
  const nextLevelExists = levelConfig ? Boolean(getLevelById(levelConfig.id + 1)) : false;

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  useEffect(() => {
    setAnswers(round.boxes.map(() => ""));
    setCount(0);
    setRoundResult(null);
    setShowLevelResult(false);
    setStarsEarned(0);
    setShowKeyboard(false);
    setActiveInputIndex(null);
    setActiveInputRect(null);
  }, [round]);

  useEffect(() => {
    if (roundEnded) {
      return;
    }

    const interval = setInterval(() => {
      setCount((prevCount) => prevCount + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [roundEnded]);

  useEffect(() => {
    if (!roundEnded || !levelConfig) {
      return;
    }

    let stars = 0;

    if (
      count <= levelConfig.stars[3].maxTime &&
      correctCount >= levelConfig.stars[3].minCorrect
    ) {
      stars = 3;
    } else if (
      count <= levelConfig.stars[2].maxTime &&
      correctCount >= levelConfig.stars[2].minCorrect
    ) {
      stars = 2;
    } else if (
      count <= levelConfig.stars[1].maxTime &&
      correctCount >= levelConfig.stars[1].minCorrect
    ) {
      stars = 1;
    }

    setStarsEarned(stars);
    saveLevelStars(levelConfig.id, stars);

    const timeout = window.setTimeout(() => {
      setShowLevelResult(true);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [count, correctCount, levelConfig, roundEnded]);

  const handleInputFocus = useCallback((index: number, element: HTMLInputElement) => {
    if (!isTouch || roundEnded) {
      return;
    }

    setActiveInputIndex(index);
    setActiveInputRect(element.getBoundingClientRect());
    setShowKeyboard(true);
  }, [isTouch, roundEnded]);

  const focusInputAt = useCallback((index: number) => {
    const input = inputRefs[index]?.current;
    if (!input) {
      return;
    }

    input.focus();
    if (isTouch) {
      handleInputFocus(index, input);
    }
  }, [handleInputFocus, inputRefs, isTouch]);

  const handleStop = useCallback(() => {
    if (roundEnded) {
      return;
    }

    if (!canStopRound) {
      const blankIndex = getFirstBlankStopAnswerIndex(answers);
      if (blankIndex !== -1) {
        focusInputAt(blankIndex);
      }
      return;
    }

    setRoundResult(evaluateStopRound(round, answers));
    setShowKeyboard(false);
    setActiveInputIndex(null);
  }, [answers, canStopRound, focusInputAt, round, roundEnded]);

  const handleEnter = useCallback((currentIndex: number) => {
    if (currentIndex < round.boxes.length - 1) {
      focusInputAt(currentIndex + 1);
      return;
    }

    handleStop();
  }, [focusInputAt, handleStop, round.boxes.length]);

  useEffect(() => {
    if (roundEnded) {
      return;
    }

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      const currentInput = document.activeElement as HTMLInputElement | null;
      const currentIndex = inputRefs.findIndex(
        (ref) => ref.current === currentInput,
      );

      if (currentIndex !== -1) {
        handleEnter(currentIndex);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [answers, canStopRound, handleEnter, inputRefs, isTouch, round, roundEnded]);

  const handleAnswerChange = (index: number, value: string) => {
    if (roundEnded) {
      return;
    }

    setAnswers((currentAnswers) =>
      currentAnswers.map((answer, currentIndex) =>
        currentIndex === index ? value : answer,
      ),
    );
  };

  const handleVirtualInput = (value: string) => {
    if (activeInputIndex === null || roundEnded) {
      return;
    }

    setAnswers((currentAnswers) =>
      currentAnswers.map((answer, index) =>
        index === activeInputIndex ? answer + value : answer,
      ),
    );
  };

  const handleVirtualBackspace = () => {
    if (activeInputIndex === null || roundEnded) {
      return;
    }

    setAnswers((currentAnswers) =>
      currentAnswers.map((answer, index) =>
        index === activeInputIndex ? answer.slice(0, -1) : answer,
      ),
    );
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
    if (!levelConfig) {
      return;
    }

    navigate(ROUTES.STOP_GAME, {
      state: { mode: "level", level: levelConfig.id + 1 },
    });
    window.location.reload();
  };

  const handleRetry = () => {
    onReset?.();
  };

  const handleMenu = () => {
    navigate(ROUTES.STOP_LEVELS);
  };

  return (
    <div className={styles.jogoStop}>
      {showLevelResult && levelConfig && (
        <div className={styles.modalOverlay}>
          <div className={styles.levelResultModal}>
            <div className={styles.levelTitle}>
              {starsEarned >= 1 ? `Nível ${levelConfig.id} Concluído!` : "Tente Novamente"}
            </div>

            <div className={styles.starsContainer}>
              {[1, 2, 3].map((star) => (
                <span
                  key={star}
                  className={star <= starsEarned ? styles.starFilled : styles.starEmpty}
                >
                  ★
                </span>
              ))}
            </div>

            <div className={styles.resultStats}>
              <div>Tempo: {formatTime(count)}</div>
              <div>Acertos: {correctCount}/{maxAcertos}</div>
            </div>

            <div className={styles.resultActions}>
              <button onClick={handleMenu} className={styles.actionBtn}>Menu</button>
              <button onClick={handleRetry} className={styles.actionBtn}>Tentar Novamente</button>
              {starsEarned >= 2 && nextLevelExists && (
                <button
                  onClick={handleNextLevel}
                  className={`${styles.actionBtn} ${styles.primaryBtn}`}
                >
                  Próximo Nível
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={styles.stopBorder}>
        {!roundEnded && <h2>{count}</h2>}

        {levelConfig && (
          <div className={styles.levelDisplay}>
            Nível: {levelConfig.id}
          </div>
        )}

        <div className={styles.numMagico}>
          <div className={styles.numeroCaixa}>
            <span className={styles.numeroO}>{round.magicNumber}</span>
          </div>
          {!roundEnded ? (
            <button
              data-target="stopbutton"
              className={styles.pararJogo}
              onClick={handleStop}
              disabled={requireFilledBoardToStop && !canStopRound}
            >
              STOP
            </button>
          ) : (
            !levelConfig && (
              <div className={styles.finalResultado}>
                <div>Tempo:</div>
                <div>{formatTime(count)}</div>
                <div>Acertos: {correctCount}</div>
              </div>
            )
          )}
        </div>

        <div className={styles.tabelaWrap}>
          <div
            data-target="board"
            className={styles.tabela}
            data-rows={Math.ceil(round.boxes.length / 2)}
            style={{ "--columns": round.columns } as React.CSSProperties}
          >
            {round.boxes.map((box, index) => (
              <CalculationCell
                key={box.id}
                box={box}
                value={answers[index] ?? ""}
                showFeedback={roundEnded}
                result={roundResult?.boxResults[index]}
                inputRef={inputRefs[index]}
                onChange={(value) => handleAnswerChange(index, value)}
                onFocus={(event) => handleInputFocus(index, event.target)}
                isTouch={isTouch}
                isLocked={roundEnded}
              />
            ))}
          </div>
        </div>
      </div>

      <VirtualKeyboard
        isVisible={showKeyboard && !roundEnded}
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
