import { useState } from "react";
import type { CalculationCheckResult, CalculationClassNames } from "./types";
import { VerticalAddition, VerticalMultiplication, VerticalSubtraction } from "./index";
import styles from "./CalculationDemoPage.module.css";

const calculationClasses: CalculationClassNames = {
  root: styles.calcRoot,
  grid: styles.calcGrid,
  cell: styles.calcCell,
  operandCell: styles.operandCell,
  resultCell: styles.resultCell,
  carryCell: styles.carryCell,
  borrowCell: styles.borrowCell,
  activeCell: styles.activeCell,
  operator: styles.operator,
  bar: styles.bar,
  keypad: styles.keypad,
  keypadButton: styles.keypadButton,
  actionButton: styles.actionButton,
  message: styles.message,
};

function formatResult(result: CalculationCheckResult | null) {
  if (!result) {
    return "Nenhuma verificação ainda.";
  }

  if (result.isCorrect) {
    return `Correto: ${result.finalAnswer}`;
  }

  if (result.answerCorrect && !result.processCorrect) {
    return "Resultado certo, mas existe algo para revisar no processo.";
  }

  return `Ainda não: resultado esperado ${result.expectedAnswer}.`;
}

export default function CalculationDemoPage() {
  const [lastResult, setLastResult] = useState<CalculationCheckResult | null>(null);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Teste de Cálculo</h1>
        <p>Rota escondida para testar os componentes compartilhados de conta armada.</p>
      </header>

      <section className={styles.statusPanel} aria-live="polite">
        {formatResult(lastResult)}
      </section>

      <section className={styles.demoGrid}>
        <article className={styles.demoCard}>
          <h2>Multiplicação travada</h2>
          <VerticalMultiplication
            topNumber={36}
            bottomNumber={6}
            maxTopDigits={3}
            guidanceMode="locked"
            processValidation="require"
            keypadMode="toggle"
            classNames={calculationClasses}
            onCheck={setLastResult}
            onComplete={setLastResult}
          />
        </article>

        <article className={styles.demoCard}>
          <h2>Soma assistida</h2>
          <VerticalAddition
            numbers={[25, 36, 14]}
            maxDigits={3}
            maxRows={3}
            guidanceMode="assisted"
            processValidation="warn"
            keypadMode="toggle"
            classNames={calculationClasses}
            onCheck={setLastResult}
            onComplete={setLastResult}
          />
        </article>

        <article className={styles.demoCard}>
          <h2>Subtração livre</h2>
          <VerticalSubtraction
            topNumber={102}
            bottomNumber={47}
            maxDigits={3}
            guidanceMode="free"
            processValidation="ignore"
            keypadMode="toggle"
            classNames={calculationClasses}
            onCheck={setLastResult}
            onComplete={setLastResult}
          />
        </article>

        <article className={styles.demoCard}>
          <h2>Multiplicação editável</h2>
          <VerticalMultiplication
            editableOperands
            maxTopDigits={3}
            guidanceMode="free"
            processValidation="ignore"
            keypadMode="toggle"
            classNames={calculationClasses}
            onCheck={setLastResult}
            onComplete={setLastResult}
          />
        </article>
      </section>
    </main>
  );
}
