import type { CalculationMessages } from "./types";

export const defaultCalculationMessages: CalculationMessages = {
  chooseCell: "Escolha um espaço para preencher.",
  operandsIncomplete: "Preencha os números da conta antes de resolver.",
  unsupportedNegative: "Nesta versão, o número de cima precisa ser maior ou igual ao de baixo.",
  correct: "Muito bem! A conta está correta.",
  tryAgain: "Ainda tem algo para ajustar.",
  lockedWrongDigit: "Esse número não combina com este passo. Tente de novo.",
  lockedWrongCell: "Neste modo, resolva um passo de cada vez.",
  assistedNextStep: "Dica: comece pelo próximo passo destacado.",
  keypadToggle: "Teclado",
  checkAnswer: "Verificar",
  clear: "Limpar",
  closeKeypad: "Fechar teclado",
  openKeypad: "Abrir teclado",
};
