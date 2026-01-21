import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { validateAnswer, validateDualAnswer } from "../Logic/validationUtils";
import styles from "../styles/StopGame.module.css";

type CalculationCellProps =
  | {
    numero_base: number;
    numero: number;
    conta: string;
    checar: boolean;
    registrarAcerto: () => void;
    isDual?: false;
    inputRef?: React.RefObject<HTMLInputElement>;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    isTouch?: boolean;
  }
  | {
    numero_base: number;
    numeros: [number, number];
    contas: [string, string];
    checar: boolean;
    registrarAcerto: () => void;
    isDual: true;
    inputRef?: React.RefObject<HTMLInputElement>;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    isTouch?: boolean;
  };

/**
 * Individual calculation cell component
 * Displays operation(s), input field, and validation feedback
 * Supports both single and dual (chained) operations
 */
function CalculationCell(props: CalculationCellProps) {
  const [certo, setCerto] = useState<boolean | null>(null);
  const [respostaCorreta, setRespostaCorreta] = useState<number | null>(null);
  const [valorInput, setValorInput] = useState("");

  const isDual = props.isDual === true;

  // Expose methods to parent if needed, but for now we rely on refs passed down or standard onChange
  // Actually, to support Virtual Keyboard, we need to allow parent to set value?
  // Or simpler: CalculationCell manages state, but detects external changes via ref?
  // Best: CalculationCell listens to props. But standard input is uncontrolled-ish here? No it's controlled.

  // To allow VirtualKeyboard to drive this, we should expose a way to set value.
  // OR we keep it controlled by State, but GameBoard updates that State? GameBoard doesn't own individual cell state.

  // STRATEGY CHANGE:
  // CalculationCell is controlled by `valorInput`. 
  // We will add an effect to sync `valorInput` with the DOM element's value if it changes externally?
  // No, that's messy.

  // CLEANEST WAY:
  // The VirtualKeyboard simulates native input events.
  // When VirtualKeyboard types "5", we programmatically set input.value = "5" and dispatch "input" event.
  // Then the standard `onChange` handler will pick it up and update state.
  // So we just need to pass the Refs down so GameBoard can find the DOM element.

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValorInput(event.target.value);
  };

  // Dual cell needs two states
  const [valorInput2, setValorInput2] = useState("");

  const handleChangeDual1 = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValorInput(event.target.value);
  };
  const handleChangeDual2 = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValorInput2(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
  };

  // Validate answer when checar prop becomes true
  useEffect(() => {
    if (!props.checar) return;

    if (isDual) {
      // Validate dual operation
      const result = validateDualAnswer(
        props.contas,
        props.numero_base,
        props.numeros,
        valorInput
      );

      setCerto(result.isCorrect);
      if (result.isCorrect) {
        props.registrarAcerto();
      } else {
        setRespostaCorreta(result.correctAnswer);
      }
    } else {
      // Validate single operation
      const result = validateAnswer(
        props.conta,
        props.numero_base,
        props.numero,
        valorInput
      );

      setCerto(result.isCorrect);
      if (result.isCorrect) {
        props.registrarAcerto();
      } else {
        setRespostaCorreta(result.correctAnswer);
      }
    }
  }, [props.checar]);

  return (
    <div>
      {/* Header showing operation(s) */}
      <div className={isDual ? styles.headerDual : styles.header}>
        {isDual ? (
          <>
            <div>
              {props.contas[0]}
              {props.numeros[0]}
            </div>
            <div>
              {props.contas[1]}
              {props.numeros[1]}
            </div>
          </>
        ) : (
          <>
            {props.conta}
            {props.numero}
          </>
        )}
      </div>

      {/* Input field */}
      <form className={styles.cellBorder} onSubmit={handleSubmit} onClick={(e) => isDual && e.preventDefault()}>
        {/* If it is Dual, do we need two inputs? 
             The current implementation suggests single input. 
             If the request implied fixing this, I would. But "Stop game" usually implies just the final result.
             I will Proceed assuming Single Input for now to avoid scope creep, unless I see obvious evidence otherwise.
             Actually, `validateDualAnswer` usually checks the sequence.
             Let's use the passed `inputRef` for the single input.
         */}
        <input
          ref={props.inputRef}
          className={styles.inputCell}
          type={props.isTouch ? "text" : "number"} // "text" for touch to support inputMode more flexibly, or just "number"
          inputMode={props.isTouch ? "none" : "numeric"} // Suppress native keyboard on touch
          pattern="[0-9]*"
          readOnly={!!props.isTouch} // If strict suppression needed
          value={valorInput}
          onChange={handleChange}
          onFocus={(e) => props.onFocus && props.onFocus(e)}
          autoComplete="off"
        />
      </form>

      {/* Feedback (shown after checking) */}
      {props.checar && (
        <div className={styles.feedback}>
          {certo === true && (
            <div className={styles.iconStack}>
              <CheckCircle
                className={`${styles.icon} ${styles.check} out`}
                strokeWidth={4}
                color="black"
              />
              <CheckCircle
                className={`${styles.icon} ${styles.check}`}
                strokeWidth={1.5}
                color="#0fb11d"
              />
            </div>
          )}
          {certo === false && (
            <>
              <div className={styles.iconStack}>
                <XCircle
                  className={`${styles.icon} ${styles.xmark} out`}
                  strokeWidth={4}
                  color="black"
                />
                <XCircle
                  className={`${styles.icon} ${styles.xmark}`}
                  strokeWidth={1.5}
                  color="#f02121"
                />
              </div>
              <div className={styles.correction}> {respostaCorreta}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default CalculationCell;
