import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ArrowLeft, Lightbulb, X } from 'lucide-react';
import { createDiscoveryModel, initialDiscoveryState } from '../logic/discoveryMultiplication';
import type { SharedCalculationProps } from '../types';
import { useForegroundDelay } from './useForegroundDelay';
import { MultiplicationArrows, type HintConnection } from './MultiplicationArrows';
import styles from '../DiscoveryMultiplication.module.css';

type Props = SharedCalculationProps & { topNumber: number; bottomNumber: number; maxTopDigits: number };
const place = (column: number, digits: number) => ['unidades', 'dezenas', 'centenas', 'milhares'][digits - column] ?? `coluna ${column + 1}`;

/** Free work, with optional column-level visual explanations. No prescribed entry order. */
export function DiscoveryMultiplication({ topNumber, bottomNumber, maxTopDigits, readOnly = false,
  keypadMode = 'auto', adaptiveGuidance, className, showClearButton = true, processValidation = 'warn',
  onComplete, onCheck, onMistake }: Props) {
  const model = useMemo(() => createDiscoveryModel(topNumber, bottomNumber, maxTopDigits, processValidation), [topNumber, bottomNumber, maxTopDigits, processValidation]);
  const [state, dispatch] = useReducer(model.reducer, initialDiscoveryState);
  const [coarse, setCoarse] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const reportedMistakes = useRef(0);
  const disabled = readOnly || state.complete;
  const readyToCheck = model.result(state).isCorrect;
  const hint = model.columns.find(column => column.column === state.support?.column);
  const level = state.support?.level ?? 0;
  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)');
    const update = () => setCoarse(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const count = state.mistakes - reportedMistakes.current;
    reportedMistakes.current = state.mistakes;
    for (let i = 0; i < count; i++) onMistake?.();
  }, [onMistake, state.mistakes]);
  useForegroundDelay(1200, state.revision, !disabled, () => dispatch({ type: 'inspect' }));
  useForegroundDelay(adaptiveGuidance?.autoHintDelayMs ?? 25000,
    `${state.revision}:${state.offered}:${state.support?.column}:${level}`, !disabled && !readyToCheck && level < 3,
    () => dispatch({ type: 'idle' }));

  const connections: HintConnection[] = !hint ? [] : level < 3 ? [
    { from: 'multiplier', to: 'hint-multiplier', kind: 'multiplier' },
    { from: hint.operand, to: 'hint-digit', kind: 'operand' },
    ...(hint.incoming && level >= 2 ? [{ from: `carry-${hint.column}`, to: 'hint-incoming', kind: 'carry' } as const] : []),
  ] : [
    { from: 'hint-units', to: hint.answer, kind: 'units' },
    ...(hint.leading ? [{ from: 'hint-leading', to: hint.destination, kind: 'carry' } as const] : []),
  ];
  const cueFor = (id: string) => connections.find(link => link.from === id || link.to === id)?.kind;
  const select = (cell: string) => { if (!disabled && state.active !== cell) dispatch({ type: 'select', cell }); };
  const enter = (value: string) => { if (!disabled) dispatch({ type: 'enter', value }); };
  const check = () => {
    if (disabled) return;
    const result = model.result(state);
    dispatch({ type: 'check' });
    onCheck?.(result);
    if (result.isCorrect) onComplete?.(result);
  };
  const showKeypad = keypadMode === 'visible' || (keypadMode === 'auto' && coarse) || (keypadMode !== 'hidden' && keypadOpen);
  const toggleKeypad = keypadMode === 'toggle' || (keypadMode === 'auto' && !coarse);
  const cell = (id: string, carry = false) => {
    const column = Number(id.split('-')[1]);
    const value = state.values[id] ?? '';
    return <button key={id} type="button" data-anchor={id} data-cell={id} data-cue={cueFor(id)}
      data-selected={state.active === id || undefined} data-wrong={state.wrong.includes(id) || undefined}
      className={`${styles.cell} ${carry ? styles.carryCell : ''}`}
      aria-label={`${carry ? 'Número levado para' : 'Resultado em'} ${place(column, maxTopDigits)}: ${value || 'vazio'}`}
      aria-pressed={state.active === id} aria-invalid={state.wrong.includes(id) || undefined}
      onFocus={() => select(id)} onClick={() => select(id)}>{value}</button>;
  };
  const operand = (id: string, value: string) => <span key={id} data-anchor={id} data-cue={cueFor(id)} className={styles.operandCell}>{value}</span>;
  return <section className={`${styles.root} ${className ?? ''}`} aria-label={`Conta ${topNumber} vezes ${bottomNumber}`}
    onKeyDown={event => {
      if (disabled || event.ctrlKey || event.metaKey || event.altKey || event.nativeEvent.isComposing) return;
      // Enter/Space remain native button activation, including help and the keypad.
      if (/^\d$/.test(event.key) && state.active) { event.preventDefault(); enter(event.key); }
      if ((event.key === 'Backspace' || event.key === 'Delete') && state.active) { event.preventDefault(); enter(''); }
    }}>
    <fieldset disabled={disabled} className={styles.fieldset}>
      <legend className={styles.srOnly}>Multiplicação. Escolha um espaço e digite. Você pode preencher em qualquer ordem.</legend>
      <div className={styles.workspace} ref={host}>
        <div className={styles.grid} data-calculation-grid style={{ gridTemplateColumns: `repeat(${maxTopDigits + 2}, minmax(0, 1fr))` }}>
          <span />{Array.from({ length: maxTopDigits + 1 }, (_, column) => column > 0 && column < maxTopDigits ? cell(`carry-${column}`, true) : <span key={`blank-${column}`} />)}
          <span /><span />{String(topNumber).padStart(maxTopDigits, ' ').split('').map((digit, i) => operand(`operand-${i + 1}`, digit))}
          <span className={styles.operator}>×</span>{Array.from({ length: maxTopDigits }, (_, i) => <span key={`bottom-${i}`} />)}{operand('multiplier', String(bottomNumber))}
          <span className={styles.bar} style={{ gridColumn: '1 / -1' }} />
          <span />{Array.from({ length: maxTopDigits + 1 }, (_, column) => cell(`answer-${column}`))}
        </div>
        <aside className={styles.hintArea} data-hint-area aria-label="Ajuda visual">
          {hint ? <div className={styles.hintCard}>
            <span className={styles.hintTitle}>{level === 1 ? 'Multiplique' : level === 2 && hint.incoming ? 'Some o que levou' : level === 2 ? 'Veja o resultado' : 'Cada algarismo no seu lugar'}</span>
            <div className={styles.equation}>
              <span data-anchor="hint-multiplier" data-cue={level < 3 ? 'multiplier' : undefined}>{hint.multiplier}</span><span>×</span>
              <span data-anchor="hint-digit" data-cue={level < 3 ? 'operand' : undefined}>{hint.digit}</span><span>=</span>
              <span>{level === 1 ? '?' : hint.product}</span>
            </div>
            {level >= 2 && hint.incoming > 0 && <div className={styles.equation}>
              <span>{hint.product}</span><span>+</span><span data-anchor="hint-incoming" data-cue="carry">{hint.incoming}</span><span>=</span><span>{hint.total}</span>
            </div>}
            {level === 3 && <div className={styles.splitResult}>
              {hint.leading && <span data-anchor="hint-leading" data-cue="carry">{hint.leading}</span>}
              <span data-anchor="hint-units" data-cue="units">{hint.units}</span>
            </div>}
            <div className={styles.hintActions}>
              <button type="button" className={styles.closeHint} disabled={level <= 1} aria-label="Voltar uma dica" onClick={() => dispatch({ type: 'previousHint' })}><ArrowLeft aria-hidden="true" /></button>
              {level < 3 && <button type="button" onClick={() => dispatch({ type: 'help' })}>{level === 1 ? 'Ver resultado' : 'Onde escrever?'}</button>}
              <button type="button" className={styles.closeHint} aria-label="Fechar dica e tentar sozinho" onClick={() => dispatch({ type: 'dismiss' })}><X aria-hidden="true" /></button>
            </div>
            <span className={styles.srOnly} role="status">{level === 1
              ? `Multiplique ${hint.multiplier} por ${hint.digit}.`
              : `${hint.multiplier} vezes ${hint.digit} é ${hint.product}.${hint.incoming ? ` Some ${hint.incoming}, levado da coluna anterior: ${hint.total}.` : ''}${level === 3 ? ` Escreva ${hint.units} em ${place(hint.column, maxTopDigits)}.${hint.leading ? ` ${hint.destination.startsWith('carry') ? 'Leve' : 'Escreva'} ${hint.leading} para ${place(hint.column - 1, maxTopDigits)}.` : ''}` : ''}`}</span>
          </div> : state.offered ? <span className={styles.offer} role="status">Quer uma dica?</span> : null}
        </aside>
        <MultiplicationArrows host={host} connections={connections} />
      </div>
      <div className={styles.toolbar}>
        <button type="button" className={styles.checkButton} onClick={check}>Verificar</button>
        <button type="button" className={styles.helpButton} data-offered={state.offered || undefined} onClick={() => dispatch({ type: 'help' })}><Lightbulb aria-hidden="true" /> Dica</button>
        {showClearButton && <button type="button" onClick={() => dispatch({ type: 'clear' })}>Limpar</button>}
        {toggleKeypad && <button type="button" onClick={() => setKeypadOpen(value => !value)}>{showKeypad ? 'Fechar teclado' : 'Teclado'}</button>}
      </div>
      {showKeypad && <div className={styles.keypad} aria-label="Teclado numérico">
        {'1234567890'.split('').map(digit => <button type="button" key={digit} disabled={!state.active || disabled} onClick={() => enter(digit)}>{digit}</button>)}
        <button type="button" disabled={!state.active || disabled} onClick={() => enter('')}>Apagar</button>
      </div>}
      <div className={styles.feedback} role="status" key={`${state.mistakes}:${state.complete}`}>
        {state.complete ? 'Correto!' : state.wrong.length ? 'Confira os espaços marcados.' : state.attempts ? 'Você pode conferir e tentar de novo.' : ''}
      </div>
    </fieldset>
  </section>;
}
