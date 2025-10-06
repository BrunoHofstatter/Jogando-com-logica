import { useState } from "react";
import styles from "../styles/regras.module.css";
import { useNavigate } from "react-router-dom";

type MandatoryCapture = true | false;

function CrownChaseRegras() {
  const navigate = useNavigate();
 
  const [showDetailedRules, setShowDetailedRules] = useState(false);
  
  function jogarStop() {
    navigate("/crownchasePg");
  }
  
  return (
    <div className={styles.regrasPage}>
      {/* Left Side - Rules */}
      <div className={styles.boxBorder}>
        <div className={styles.boxRegras}>
          
          <ul className={styles.regras}>
            <li>
              <h3>Capture o Rei para ganhar, mas o Rei não pode se mover</h3>
              <img
                src={`${import.meta.env.BASE_URL}ComoJogarStop1.png`}
                className={`${styles.como} ${styles.c1}`}
              />
            </li>
            <li>
              <img
                src={`${import.meta.env.BASE_URL}ComoJogarStop2.png`}
                className={`${styles.como} ${styles.c2}`}
              />
              <h3>O assassino pode matar qualquer peça</h3>
            </li>
            <li>
              <h3>O saltador pode pular sobre qualquer peça</h3>
              <div className={styles.c3Box}>
                <img
                  src={`${import.meta.env.BASE_URL}ComoJogarStop3.png`}
                  className={`${styles.como} ${styles.c3}`}
                />
              </div>
            </li>
            <li>
              <img
                src={`${import.meta.env.BASE_URL}ComoJogarStop4.png`}
                className={`${styles.como} ${styles.c4}`}
              />
              <h3>O saltador só pode matar o Rei</h3>
            </li>
          </ul>
        </div>
      </div>

      {/* Right Side - Game Controls */}
      <div className={styles.botoes}>
        <button className={styles.button} onClick={jogarStop}>
          <span>Jogar</span>
        </button>
        <button
        className={styles.detailedRulesButton}
        onClick={() => setShowDetailedRules(true)}
      >
        Regras Completas
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
              <h2>Como Jogar - Caça Soma</h2>

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
    </div>
  );
}

export default CrownChaseRegras;
