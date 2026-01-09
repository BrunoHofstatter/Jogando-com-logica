import { useState } from "react";
import styles from "../styles/regras.module.css";
import { useNavigate } from "react-router-dom";
import { useTutorialCompleted } from "../componentes/DynamicTutorial";

type MandatoryCapture = true | false;

function CacaSomaRegras() {
  const navigate = useNavigate();

  const [showDetailedRules, setShowDetailedRules] = useState(false);
  const [tutorialCompleted, resetTutorial] =
      useTutorialCompleted("cacasoma_v1");
  function jogarNiveis() {
    navigate("/cacaSomaNiveis");
  }

  function jogarVersus() {
    navigate("/cacaSoma");
  }

  const startTutorial = () => {
    resetTutorial(); // Clear the "completed" flag
    navigate("/cacaSoma");
  };

  return (
    <div className={styles.regrasPage}>
      {/* Left Side - Rules */}
    
      <div className={styles.boxRegras}>
          <div className={styles.gameTitle}>Caça Soma</div>
        <img
          src={`${import.meta.env.BASE_URL}cacasomaPreview.png`}
          className={styles.preview}
        />
      </div>

      {/* Right Side - Game Controls */}
      <div className={styles.botoes}>
        <button className={styles.button} onClick={jogarNiveis}>
          <span>Jogar</span>
        </button>

        <div className={styles.modeButtons}>
          <button className={styles.modeButton} onClick={jogarNiveis}>
            <span>Todos os Níveis</span>
          </button>
          <button className={styles.modeButton} onClick={jogarVersus}>
            <span>Modo Versus</span>
          </button>
        </div>

        <button className={styles.tutorialButton} onClick={startTutorial}>
          <span>Tutorial</span>
        </button>
        <button
          className={styles.detailedRulesButton}
          onClick={() => setShowDetailedRules(true)}
        >
          Regras
        </button>
      </div>
        
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
              <h2>Regras Caça Soma</h2>

              <h3 className={styles.rulesTitle}>Início da Partida:</h3>
              <p className={styles.rulesText}>
                O Jogador 1 começa a partida. O jogo é disputado em rodadas.
              </p>

              <h3 className={styles.rulesTitle}>Sorteio do Número:</h3>
              <p className={styles.rulesText}>
                Em cada rodada, o sistema sorteia um número aleatório (de 3 a
                150) para o jogador da vez.
              </p>

              <h3 className={styles.rulesTitle}>Formando a Soma:</h3>
              <p className={styles.rulesText}>
                O jogador deve selecionar <strong>2 ou 3 números</strong> da
                tabela disponível que, quando somados, resultem exatamente no
                número sorteado.
              </p>

              <h3 className={styles.rulesTitle}>Ação:</h3>
              <p className={styles.rulesText}>
                O jogador clica em "Iniciar" para começar a rodada, seleciona os
                números na tabela e depois clica em "Enviar" para submeter a sua
                resposta.
              </p>

              <h3 className={styles.rulesTitle}>Sequência de Turnos:</h3>
              <p className={styles.rulesText}>
                O Jogador 2 recebe então um novo número sorteado e repete o
                processo, tentando formar a sua própria soma.
              </p>

              <h3 className={styles.rulesTitle}>Números Usados:</h3>
              <p className={styles.rulesText}>
                Os números utilizados em somas corretas são{" "}
                <strong>riscados da tabela</strong> e não podem ser usados
                novamente por nenhum jogador no restante da partida.
              </p>

              <h3 className={styles.rulesTitle}>
                Pontuação e Vencedor da Rodada:
              </h3>
              <p className={styles.rulesText}>
                A cada rodada, o jogador que encontrar e enviar uma soma correta
                em <strong>menos tempo</strong> vence a rodada e ganha{" "}
                <strong>1 ponto</strong>.
              </p>

              <h3 className={styles.rulesTitle}>Vencendo o Jogo:</h3>
              <p className={styles.rulesText}>
                O jogo termina quando um jogador alcançar{" "}
                <strong>5 pontos</strong>.
              </p>
              <p className={styles.rulesText}>
                Esse jogador será declarado o vencedor da partida.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CacaSomaRegras;
