interface prop {
  mudarClicar: () => void;
  mudarRodada: () => void;
  clicar: boolean;
}
function Iniciar({ mudarClicar, clicar, mudarRodada }: prop) {
  return (
    <button
      onClick={() => {
        if (clicar) {
          mudarClicar();
        }
      }}
    >
      Começar
    </button>
  );
}

export default Iniciar;
