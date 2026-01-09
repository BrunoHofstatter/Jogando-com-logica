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
    }
  | {
      numero_base: number;
      numeros: [number, number];
      contas: [string, string];
      checar: boolean;
      registrarAcerto: () => void;
      isDual: true;
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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValorInput(event.target.value);
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
      <form className={styles.cellBorder} onSubmit={handleSubmit}>
        <input
          className={styles.inputCell}
          type="number"
          value={valorInput}
          onChange={handleChange}
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
