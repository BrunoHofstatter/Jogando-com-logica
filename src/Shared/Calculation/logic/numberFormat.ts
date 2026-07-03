export function toDigits(value: number, length: number) {
  const normalized = Math.max(0, Math.floor(value)).toString();
  return normalized.padStart(length, " ").slice(-length).split("");
}

export function normalizeDigitText(value: string) {
  return value.replace(/\D/g, "");
}

export function digitsToNumber(digits: string[]) {
  const normalized = digits.join("").replace(/\s/g, "").replace(/^0+(?=\d)/, "");
  if (!normalized) {
    return null;
  }

  return Number(normalized);
}

export function numberToAnswerDigits(value: number, length: number) {
  const rawDigits = Math.max(0, Math.floor(value)).toString().padStart(length, " ");
  return rawDigits.slice(-length).split("");
}

export function answerDigitsToNumber(values: string[]) {
  const joined = values.map((value) => value.trim()).join("");
  if (!joined) {
    return null;
  }

  return Number(joined);
}
