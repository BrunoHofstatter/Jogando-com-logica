import { useState } from "react";
import styles from "../styles/regras.module.css";
import { useNavigate } from "react-router-dom";
import { useTutorialCompleted } from "../Components/DynamicTutorial";

type MandatoryCapture = true | false;

function CrownChaseRegras() {
  const navigate = useNavigate();

  const [showDetailedRules, setShowDetailedRules] = useState(false);
  const [tutorialCompleted, resetTutorial] =
    useTutorialCompleted("crownchase_v1");

  function jogarStop() {
    navigate("/crownchasePg");
  }

  const startTutorial = () => {
    resetTutorial(); // Clear the "completed" flag
    navigate("/crownchasePg");
  };

  return (
    <div className={styles.regrasPage}>
      {/* Left Side - Rules */}

      <div className={styles.boxRegras}>
        <div className={styles.gameTitle}>Caça Coroa</div>
        <img
          src={`${import.meta.env.BASE_URL}crownchasePreview.png`}
          className={styles.preview}
        />
      </div>

      {/* Right Side - Game Controls */}
      <div className={styles.botoes}>
        <button className={styles.button} onClick={jogarStop}>
          <span>Jogar</span>
        </button>
        <button className={styles.tutorialButton} onClick={startTutorial}>
          <span>Tutorial</span>
        </button>
        <button
          className={styles.detailedRulesButton}
          onClick={() => setShowDetailedRules(true)}
        >
          Regras
        </button>
        {showDetailedRules && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowDetailedRules(false)}
          >
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.closeButton}
                onClick={() => setShowDetailedRules(false)}
              >
                X
              </button>

              <div className={styles.detailedRules}>
                <h2>Regras Caça Coroa</h2>

                <h3 className={styles.rulesTitle}>Posição Inicial</h3>
              <div className={styles.boardDiv}>
                <img
                  src={`${import.meta.env.BASE_URL}crownchaseBoard.png`}
                  className={styles.boardImage}
                />
                <ul className={styles.legend}>
                  <li>
                    <img
                      src={`${import.meta.env.BASE_URL}crownchaseJumper.png`}
                      className={styles.pieceImage}
                    />{" "}
                    -{">"} Saltador
                  </li>
                  <li>
                    <img
                      src={`${import.meta.env.BASE_URL}crownchaseAssassin.png`}
                      className={styles.pieceImage}
                    />{" "}
                    -{">"} Assassino
                  </li>
                  <li>
                    <img
                      src={`${import.meta.env.BASE_URL}crownchaseKing.png`}
                      className={styles.pieceImage}
                    />{" "}
                    -{">"} Rei
                  </li>
                </ul>
              </div>

                <h3 className={styles.rulesTitle}>Início da Partida</h3>
                <p className={styles.rulesText}>
                  O jogo "Caça Coroa" é disputado em um tabuleiro 5x5.
                </p>
                <p className={styles.rulesText}>
                  Um jogador controla o Rei no canto inferior esquerdo. O outro
                  jogador controla o Rei no canto superior direito.
                </p>

                <h3 className={styles.rulesTitle}>Ordem dos Turnos</h3>
                <p className={styles.rulesText}>
                  Os jogadores jogam em turnos alternados.
                </p>
                <p className={styles.rulesText}>
                  Em cada turno, o jogador deve mover{" "}
                  <span className={styles.rulesStrong}>
                    exatamente uma peça
                  </span>
                  .
                </p>
                <p className={styles.rulesText}>
                  Cada movimento conta como uma ação.
                </p>


                <h3 className={styles.rulesTitle}> Rei </h3>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Movimento:</span> Não pode
                  se mover.
                </p>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Captura:</span> Se for
                  capturado, o jogo acaba imediatamente.
                </p>

                <h3 className={styles.rulesTitle}>
                  Assassino 
                </h3>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Movimento:</span> Move{" "}
                  <span className={styles.rulesStrong}>1 casa</span> em qualquer
                  direção (horizontal, vertical ou diagonal).
                </p>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Captura:</span> Captura
                  entrando na casa ocupada por uma peça inimiga.
                </p>
                <p className={styles.rulesText}>
                  Pode capturar qualquer peça,{" "}
                  <span className={styles.rulesStrong}>inclusive o Rei</span>.
                </p>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Restrição:</span> Não pode
                  pular sobre outras peças.
                </p>

                <h3 className={styles.rulesTitle}>
                  Saltador 
                </h3>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Movimento Básico:</span>{" "}
                  Move <span className={styles.rulesStrong}>1 casa</span> em
                  linha reta (horizontal ou vertical) para uma casa vazia.
                </p>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Salto:</span> Pula{" "}
                  <span className={styles.rulesStrong}>exatamente 1 peça</span>{" "}
                  adjacente (aliada ou inimiga) em linha reta, aterrissando duas
                  casas adiante.
                </p>
                <p className={styles.rulesText}>
                  A casa de destino no salto deve estar{" "}
                  <span className={styles.rulesStrong}>
                    vazia ou conter o Rei inimigo
                  </span>
                  .
                </p>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Captura:</span> Saltadores{" "}
                  <span className={styles.rulesStrong}>
                    só podem capturar o Rei
                  </span>{" "}
                  e não podem capturar outras peças.
                </p>
                <p className={styles.rulesText}>
                  <span className={styles.rulesSpan}>Restrição:</span> Não
                  existe multi-salto em um mesmo turno.
                </p>

                <h3 className={styles.rulesTitle}>
                  Regras de Movimento Gerais
                </h3>
                <p className={styles.rulesText}>
                  Nenhuma peça pode ocupar uma casa já ocupada por uma peça
                  aliada.
                </p>
                <p className={styles.rulesText}>
                  Apenas os Jumpers podem saltar sobre peças.
                </p>
                <p className={styles.rulesText}>
                  Um movimento termina quando a peça chega ao destino permitido.
                </p>

                <h3 className={styles.rulesTitle}>Fim de Jogo</h3>
                <p className={styles.rulesText}>
                  O jogo acaba imediatamente quando um Rei é capturado.
                </p>
                <p className={styles.rulesText}>
                  O jogador que capturar o Rei adversário é o vencedor.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CrownChaseRegras;
