import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTutorialCompleted } from "../Components/DynamicTutorial";
import styles from "../styles/Regras.module.css";

/**
 * Rules and difficulty selection page for Stop Matemático
 */
function RegrasPage() {
  const navigate = useNavigate();
  const [showDetailedRules, setShowDetailedRules] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [difficulty, setDifficulty] = useState("d1");
  const [, resetTutorial] = useTutorialCompleted("stop_v1");

  function jogarStop() {
    navigate("/stopPage", { state: { difficulty } });
  }

  const startTutorial = () => {
    resetTutorial(); // Clear the "completed" flag
    navigate("/stopPage", { state: { difficulty } });
  };

  return (
    <div className={styles.regrasPage}>
      {/* Left Side - Rules */}
      <div className={styles.boxRegras}>
        <div className={styles.gameTitle}>Stop Matemático</div>
        <img
          src={`${import.meta.env.BASE_URL}stopPreview.png`}
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
        <div className={styles.difPart}>
          <div className={styles.difToggle} onClick={() => setIsOpen(!isOpen)}>
            <h2 className={styles.difLabel}>Dificuldade</h2>
            <span className={styles.arrow}>{isOpen ? "▼" : "▶"}</span>
          </div>

          {isOpen && (
            <div className={styles.difMenu}>
              <div
                className={`${styles.difMenuItem} ${
                  difficulty === "d1" ? styles.selected : ""
                }`}
                style={{
                  color: "#4169E1",
                }}
                onClick={() => {
                  setDifficulty("d1");
                }}
              >
                Fácil 1
              </div>
              <div
                className={`${styles.difMenuItem} ${
                  difficulty === "d3" ? styles.selected : ""
                }`}
                style={{
                  color: "#32CD32",
                }}
                onClick={() => {
                  setDifficulty("d3");
                }}
              >
                Médio 1
              </div>
              <div
                className={`${styles.difMenuItem} ${
                  difficulty === "d5" ? styles.selected : ""
                }`}
                style={{
                  color: "#FF6347",
                }}
                onClick={() => {
                  setDifficulty("d5");
                }}
              >
                Difícil 1
              </div>
              <div
                className={`${styles.difMenuItem} ${
                  difficulty === "d2" ? styles.selected : ""
                }`}
                style={{
                  color: "#20B2AA",
                }}
                onClick={() => {
                  setDifficulty("d2");
                }}
              >
                Fácil 2
              </div>

              <div
                className={`${styles.difMenuItem} ${
                  difficulty === "d4" ? styles.selected : ""
                }`}
                style={{
                  color: "#FFA500",
                }}
                onClick={() => {
                  setDifficulty("d4");
                }}
              >
                Médio 2
              </div>

              <div
                className={`${styles.difMenuItem} ${
                  difficulty === "d6" ? styles.selected : ""
                }`}
                style={{
                  color: "#DC143C",
                }}
                onClick={() => {
                  setDifficulty("d6");
                }}
              >
                Difícil 2
              </div>
            </div>
          )}
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
                  <h2>Regras do Stop Matemático</h2>
                  <p className={styles.rulesText}>
                    Este jogo adapta o formato clássico do "Stop" para um
                    desafio de raciocínio rápido e cálculo mental.
                  </p>

                  <h3 className={styles.rulesTitle}>
                    Sorteio do Número Mágico
                  </h3>
                  <p className={styles.rulesText}>
                    No início de cada rodada, o sistema gera e exibe um "Número
                    Mágico" aleatório. Este número será a base para todos os
                    cálculos daquela rodada.
                  </p>

                  <h3 className={styles.rulesTitle}>
                    Geração dos Desafios (Cálculos)
                  </h3>
                  <p className={styles.rulesText}>
                    O jogo apresenta 10 caixas de desafio. A dificuldade e o
                    tipo de cálculo (adição, subtração, multiplicação e/ou
                    divisão) nas caixas dependem do nível de dificuldade
                    configurado.
                  </p>

                  <h3 className={styles.rulesTitle}>
                    Execução dos Cálculos
                  </h3>
                  <p className={styles.rulesText}>
                    O jogador deve utilizar o "Número Mágico" sorteado como o
                    valor inicial para resolver cada um dos 10 desafios
                    (caixas).
                    <br />
                    <br />
                    <strong>Atenção:</strong> O valor resultante de uma caixa
                    NÃO é utilizado como entrada para a caixa seguinte. O
                    "Número Mágico" deve ser aplicado separadamente em cada um
                    dos 10 cálculos.
                  </p>

                  <h3 className={styles.rulesTitle}>Caixas Duplas</h3>
                  <p className={styles.rulesText}>
                    Existem caixas especiais que contêm 2 cálculos distintos. O
                    jogador deve usar o "Número Mágico" para resolver ambos os
                    cálculos e, a partir deles, chegar a uma única resposta para
                    a caixa dupla.
                  </p>

                  <h3 className={styles.rulesTitle}>Fim da Rodada</h3>
                  <p className={styles.rulesText}>
                    Ao finalizar todos os 10 desafios, o jogador deve clicar no
                    botão "Stop" para encerrar o seu tempo de jogo.
                  </p>

                  <h3 className={styles.rulesTitle}>
                    Pontuação e Resultado Final
                  </h3>
                  <p className={styles.rulesText}>
                    Ao clicar em "Stop", o jogo exibe um relatório final
                    contendo:
                    <br />• <strong>Correção:</strong> Uma verificação das
                    respostas dadas pelo jogador.
                    <br />• <strong>Pontuação:</strong> O total de acertos
                    (cálculos resolvidos corretamente).
                    <br />• <strong>Tempo:</strong> O tempo total decorrido para
                    a conclusão da rodada.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegrasPage;
