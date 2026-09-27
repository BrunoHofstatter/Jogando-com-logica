# Shared Calculation System

Reusable vertical arithmetic components for classroom-style calculations.

The system is intentionally independent from any game or lesson meaning. A game/class decides why the student is doing the calculation; these components only handle the written calculation itself.

Current components:

- `VerticalMultiplication`
- `VerticalAddition`
- `VerticalSubtraction`

Import from the module index:

```tsx
import {
  VerticalAddition,
  VerticalMultiplication,
  VerticalSubtraction,
} from "../../Shared/Calculation";
```

Adjust the relative path for the file using it.

## Basic Examples

### Multiplication

```tsx
<VerticalMultiplication
  topNumber={36}
  bottomNumber={6}
  maxTopDigits={3}
  guidanceMode="locked"
  processValidation="require"
  onComplete={(result) => {
    console.log(result.finalAnswer);
  }}
/>
```

Supported in v1:

- top number up to `maxTopDigits`
- one-digit bottom number
- carry cells

### Addition

```tsx
<VerticalAddition
  numbers={[25, 36, 14]}
  maxDigits={3}
  maxRows={3}
  guidanceMode="assisted"
  processValidation="warn"
/>
```

Supported in v1:

- multiple rows
- up to `maxRows` rows
- each number up to `maxDigits`
- carry cells

### Subtraction

```tsx
<VerticalSubtraction
  topNumber={102}
  bottomNumber={47}
  maxDigits={3}
  guidanceMode="free"
  processValidation="ignore"
/>
```

Supported in v1:

- two numbers
- up to `maxDigits`
- borrowing through replacement cells
- no negative results

If the bottom number is larger than the top number, the component shows the default unsupported message.

## Editable Operands

Use `editableOperands` when the student should type the original numbers too.

```tsx
<VerticalMultiplication
  editableOperands
  maxTopDigits={3}
  guidanceMode="free"
/>
```

When `editableOperands` is false, operand cells are shown but not editable.

## Guidance Modes

```ts
type GuidanceMode = "free" | "assisted" | "locked" | "adaptive";
```

### `free`

- Student can fill cells freely.
- No live wrong-answer blocking.
- Pressing `Verificar` checks the final answer.
- Best for review games or confident practice.

### `assisted`

- Student can still click around.
- The component can suggest the next useful step.
- Wrong input is not blocked immediately.
- Pressing `Verificar` checks the calculation.

### `locked`

- Student must solve one step at a time.
- Wrong cells are rejected.
- Wrong digits shake, clear, and show a hint.
- Best for first teaching of the written algorithm.

In locked mode, the result digit is filled before the carry. Example: for `36 x 6`, the flow starts with writing `6`, then carrying `3`.

### `adaptive` multiplication: free entry with visual support (2026-09-27)

Fixed-operand `VerticalMultiplication` uses `DiscoveryMultiplication` in this mode.
Other operations and editable-operand calculations retain their existing modes.
Class 3 is the production consumer. Its new behavior is:

- Initially no cell is selected, highlighted as the next step, or locked. Select
  any result/carry cell and enter or erase a digit; no automatic cursor movement.
- The selected cell is yellow with a purple outline. Carry cells are neutral and
  present above internal columns even if no carry is needed, rather than exposing
  the algorithm before help is requested. Accessible names include place and value.
- Input is preserved. A 1.2-second foreground settling delay allows quick edits
  before assessing incorrect entries. Valid alternative entry orders are accepted.
- Help appears in a reserved area to the right, with measured SVG arrows tied to
  the actual cells. Level 1 connects multiplier/operand to an unknown product;
  level 2 reveals the product and, where needed, adds the incoming carry;
  level 3 connects separate result digits to their answer/carry destinations.
- Arrows leave and arrive at the top centers of boxes, with tips ending at the
  border. Curved paths use the gaps above rows and between the calculation and hint
  panel to avoid crossing adjacent digits. Each curve ends in a short vertical
  landing so the entire arrowhead points into its box, clear of the curve's bend.
  The two multiplication factors have
  distinct matching colors. Written operands are 30% larger than the original skin.
- Solving the helped column closes its support; the next column is free again.
  Children may also dismiss hints. No help stage restricts which cell is editable.
- A compact back button revisits the previous hint within the same column (disabled
  at its first level). Revisiting levels in either direction does not count extra
  help. Only automatic help is monotonic; deliberate backward navigation is allowed.
- After 25 idle foreground seconds (configurable with `autoHintDelayMs`), offer
  help; subsequent intervals reveal the next level. Manual help is immediate.
  Background time does not consume the delay. Correct results awaiting verification
  receive no unsolicited help. Automatic levels never decrease and repeated levels aren't
  counted again. The older detailed-delay/mistake-threshold options are not used
  by the new multiplication UI.
- `Verificar` submits. Native Enter/Space activation remains available on buttons;
  digits and erase keys are handled only inside the component. The keypad reflects
  current `keypadMode`, including changes while mounted.
- Class 3 uses `processValidation="warn"`: omitted carries are accepted when the
  final answer is correct, but explicitly wrong entered digits must be corrected.
  `require` still requires carries and `ignore` skips carry validation. This mode
  defaults to `warn`. Completion makes the component read-only immediately.

`usedHints` counts newly revealed levels per column. `onMistake` reports settled
incorrect entries and failed checks, never cell selection or timer expiry. Edits
corrected within the grace period aren't errors. A failed check accounts for its
current wrong entries so their pending timer does not count them again.

The new UI has its own responsive CSS module, `DiscoveryMultiplication.module.css`,
and accepts `className` for its root. The legacy cell/coach `classNames` skin and
text-heavy guidance messages apply to `VerticalCalculation`, not this visual mode.
Class 3 no longer carries a duplicate calculation skin. Its mobile layout keeps
the calculation and explanation side by side, with controls/keypad below them.

Implementation: `logic/discoveryMultiplication.ts` owns mathematical column
relationships, progression, and accounting; `components/useForegroundDelay.ts`
owns visibility-aware timers; `components/MultiplicationArrows.tsx` measures actual
anchors and updates on resizing. DOM interaction tests exercise this mode without
using a browser, screenshots, or local preview.

Visual follow-up (2026-09-27): browser verification was explicitly authorized.
Checked curved operand arrows, carry addition, and both result-placement stages
on the actual Class 3 25 × 6 lesson at 1280 × 800 and 390 × 844. Restored smooth
curves, increased row clearance, and aligned arrowheads with their landing segments.
The inspected browser session reported no console errors.

## Process Validation

```ts
type ProcessValidation = "ignore" | "warn" | "require";
```

This controls how carry/borrow cells affect correctness when checking.

### `ignore`

Only the final answer matters.

### `warn`

The final answer can be correct while process mistakes are reported in `result.mistakes`.

### `require`

The final answer and process cells must be correct for `result.isCorrect` to be true.

Recommended defaults:

- `free`: `processValidation="ignore"`
- `assisted`: `processValidation="warn"`
- `locked`: `processValidation="require"`

## Keypad Modes

```ts
type KeypadMode = "auto" | "visible" | "toggle" | "hidden";
```

### `auto`

- Touch/coarse pointer devices show the virtual keypad immediately.
- Desktop/laptop devices keep the keypad behind a toggle.

### `visible`

Always show the virtual keypad.

### `toggle`

Hide the virtual keypad until the student opens it.

### `hidden`

Never show the virtual keypad.

Physical keyboard input is supported:

- number keys fill the active cell
- `Backspace` / `Delete` clear the active cell
- `Enter` checks the answer

## Shared Props

All three components support these props:

```ts
type SharedCalculationProps = {
  editableOperands?: boolean;
  guidanceMode?: GuidanceMode;
  processValidation?: ProcessValidation;
  keypadMode?: KeypadMode;
  className?: string;
  classNames?: CalculationClassNames;
  messages?: Partial<CalculationMessages>;
  onCheck?: (result: CalculationCheckResult) => void;
  onComplete?: (result: CalculationCheckResult) => void;
};
```

Defaults:

- `editableOperands`: `false`
- `guidanceMode`: `"free"`
- `processValidation`: `"ignore"`
- `keypadMode`: `"auto"`

## Operation-Specific Props

### `VerticalMultiplication`

```ts
type VerticalMultiplicationProps = SharedCalculationProps & {
  topNumber?: number;
  bottomNumber?: number;
  maxTopDigits?: number;
};
```

Defaults:

- `topNumber`: `16`
- `bottomNumber`: `6`
- `maxTopDigits`: `3`

### `VerticalAddition`

```ts
type VerticalAdditionProps = SharedCalculationProps & {
  numbers?: number[];
  maxDigits?: number;
  maxRows?: number;
};
```

Defaults:

- `numbers`: `[25, 36]`
- `maxDigits`: `3`
- `maxRows`: `Math.max(2, numbers.length)`

Numbers beyond `maxRows` are ignored.

### `VerticalSubtraction`

```ts
type VerticalSubtractionProps = SharedCalculationProps & {
  topNumber?: number;
  bottomNumber?: number;
  maxDigits?: number;
};
```

Defaults:

- `topNumber`: `52`
- `bottomNumber`: `18`
- `maxDigits`: `3`

## Result Object

`onCheck` runs every time the student presses `Verificar`.

`onComplete` runs only when `result.isCorrect` is true.

```ts
type CalculationCheckResult = {
  isCorrect: boolean;
  answerCorrect: boolean;
  processCorrect: boolean;
  finalAnswer: number | null;
  expectedAnswer: number;
  mistakes: CalculationMistake[];
  usedHints: number;
  attempts: number;
};
```

Use this object to let the parent game/class decide feedback.

Example:

```tsx
<VerticalMultiplication
  topNumber={25}
  bottomNumber={6}
  guidanceMode="assisted"
  processValidation="warn"
  onCheck={(result) => {
    if (result.answerCorrect && !result.processCorrect) {
      setFeedback("Você acertou o resultado, mas vamos revisar o vai.");
    }
  }}
/>
```

## Mistakes

```ts
type CalculationMistake = {
  cellId: string;
  kind: "answer" | "carry" | "borrow" | "operand" | "step";
  expected: string;
  actual: string;
  message: string;
};
```

`cellId` is internal but stable enough for feedback/debugging. Examples:

- `answer-2`
- `carry-1`
- `borrow-0`
- `operand-1-2`

The parent should usually show `message`, not parse `cellId`.

## CSS Slot System

Each game/class can fully restyle the calculation UI by passing CSS Module classes through `classNames`.

Example:

```tsx
import styles from "./RubiksCalculation.module.css";

<VerticalMultiplication
  topNumber={16}
  bottomNumber={6}
  classNames={{
    root: styles.root,
    grid: styles.grid,
    cell: styles.cell,
    operandCell: styles.operandCell,
    resultCell: styles.resultCell,
    carryCell: styles.carryCell,
    activeCell: styles.activeCell,
    operator: styles.operator,
    bar: styles.bar,
    keypad: styles.keypad,
    keypadButton: styles.keypadButton,
    actionButton: styles.actionButton,
    message: styles.message,
  }}
/>
```

Different CSS Module files can reuse the same local class names. CSS Modules scope them independently.

### Available Class Slots

```ts
type CalculationClassNames = {
  root?: string;
  expression?: string;
  grid?: string;
  row?: string;
  operandRow?: string;
  processRow?: string;
  answerRow?: string;
  cell?: string;
  operandCell?: string;
  resultCell?: string;
  carryCell?: string;
  borrowCell?: string;
  operator?: string;
  bar?: string;
  activeCell?: string;
  correctCell?: string;
  wrongCell?: string;
  disabledCell?: string;
  keypad?: string;
  keypadButton?: string;
  actionButton?: string;
  toolbar?: string;
  message?: string;
  checkButton?: string;
};
```

Important notes:

- The component keeps the HTML structure.
- The consuming page controls size, spacing, colors, borders, and layout through classes.
- `Calculation.module.css` is only the default fallback style.
- Some slots are reserved for future state styling, such as `correctCell` and `wrongCell`.

## Message Overrides

Default text is in Brazilian Portuguese. Override only the messages a game needs to change.

```tsx
<VerticalSubtraction
  messages={{
    checkAnswer: "Conferir",
    correct: "Boa! A conta fechou.",
    tryAgain: "Ainda não. Olhe com calma para cada coluna.",
  }}
/>
```

Available messages:

```ts
type CalculationMessages = {
  chooseCell: string;
  operandsIncomplete: string;
  unsupportedNegative: string;
  correct: string;
  tryAgain: string;
  lockedWrongDigit: string;
  lockedWrongCell: string;
  assistedNextStep: string;
  keypadToggle: string;
  checkAnswer: string;
  clear: string;
  closeKeypad: string;
  openKeypad: string;
};
```

## Hidden Demo Page

There is a hidden route for manual testing:

```text
/teste-calculo
```

It demonstrates:

- locked multiplication
- assisted addition
- free subtraction
- editable multiplication

This route is not linked from the normal UI.

## Verification

Focused tests:

```bash
npm run test -- --run src/Shared/Calculation/logic/calculation.test.ts src/Shared/Calculation/components/VerticalCalculation.test.tsx
```

Focused lint:

```bash
npx eslint src/Shared/Calculation
```

Production build:

```bash
npm run build
```

Browser-based visual verification is prohibited by default in this project. Only use browser checks when the user explicitly allows them for the task.

## Current Limitations

- Multiplication v1 supports a multi-digit top number and one-digit bottom number.
- Subtraction v1 does not support negative results.
- Borrowing is shown as replacement cells, not crossed-out original digits.
- The component does not teach the meaning of the numbers. Parent games/classes should provide the context.
- The component has default styling, but production use should pass game/class-specific `classNames`.
