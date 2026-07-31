const UNSAFE_CODE_FRAGMENTS = [
  "CU",
  "KU",
  "PAU",
  "PICA",
  "PIKA",
  "PUTA",
  "PUTO",
  "FODA",
  "FODE",
  "FUD",
  "MERD",
  "BOST",
  "PORR",
  "BUC",
  "ROLA",
  "TETA",
  "PUNH",
  "BIXA",
  "KKK",
  "NAZI",
] as const;

const LEETSPEAK_CHARACTERS: Readonly<Record<string, string>> = {
  "0": "O",
  "1": "I",
  "3": "E",
  "4": "A",
  "5": "S",
  "7": "T",
  "8": "B",
};

export function isSafeGeneratedCode(code: string): boolean {
  const normalizedCode = code
    .toUpperCase()
    .replace(/[0134578]/g, (character) => LEETSPEAK_CHARACTERS[character]);

  return !UNSAFE_CODE_FRAGMENTS.some((fragment) =>
    normalizedCode.includes(fragment),
  );
}
