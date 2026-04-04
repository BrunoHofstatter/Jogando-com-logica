import Tabuleiro from "../componentes/tabuleiro";
import Girar from "../componentes/sorteio";
import DynamicTutorial, { TutorialStep } from '../../Shared/Components/DynamicTutorial';
import tutorialStyles from '../styles/DynamicTutorial.module.css';
import GameButton from "../componentes/GameButton";
import { useEffect, useState, useCallback } from "react";
import styles from "../styles/design.module.css";

function Caca_soma() {
  const [showTutorial, setShowTutorial] = useState(false);
  useEffect(() => {
    document.body.style.backgroundColor = "#efc9c9";
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", "#efc9c9");
  }, []);

  useEffect(() => {
    const completed = localStorage.getItem('tutorial_cacasoma_v1_completed');
    if (completed !== 'true') {
      setTimeout(() => setShowTutorial(true), 500); // Delay for DOM
    }
  }, []);
  const tutorialSteps: TutorialStep[] = [
    {
      id: 'numeroMagico',
      target: '[data-target="numeroMagico"]',
      highlight: true,
      placement: 'auto',
      title: 'Número Mágico',
      body: <div className={tutorialStyles.stepBody}>
        <span>- O <span className={tutorialStyles.highlight}>Número Mágico</span> vai ser sorteado</span>
        <span>- Clique em <span className={tutorialStyles.highlight}>Começar</span> para iniciar o jogo</span>
      </div>
    },
    {
      id: 'tabuleiro',
      target: '[data-target*="tabuleiro"]',
      highlight: true,
      placement: 'auto',
      title: 'Tabuleiro',
      body: <div className={tutorialStyles.stepBody}>
        <span>- <span className={tutorialStyles.highlight}>Monte</span> o Número Mágico com <span className={tutorialStyles.highlight}>2 ou 3</span> números.</span>
        <span>- A <span className={tutorialStyles.highlight}>soma</span> desses números tem que ser <span className={tutorialStyles.highlight}>igual</span> ao Número Mágico</span>
        <span>- Clique <span className={tutorialStyles.highlight}>Fora do Tabuleiro</span> quando terminar</span>
      </div>
    },
    {
      id: 'placar',
      target: '[data-target="placar"]',
      highlight: true,
      placement: 'auto',
      title: 'Placar',
      body: <div className={tutorialStyles.stepBody}>
        <span>- Veja quanto <span className={tutorialStyles.highlight}>tempo</span> o jogador levou</span>
        <span>- Depois que os dois jogadores jogarem, quem acertar com menos tempo ganha <span className={tutorialStyles.highlight}>1 ponto</span></span>
        <span>- Quem fizer <span className={tutorialStyles.highlight}>5 pontos</span> primeiro <span className={tutorialStyles.highlight}>ganha</span> o jogo</span>
      </div>
    }
  ];



  const [jogar, setJogar] = useState(false);
  const [clicar, setClicar] = useState(true);
  const [qualRodada, setQualRodada] = useState(0);
  const [sorteado, setSorteado] = useState(0);
  const [soma, setSoma] = useState(0);
  const [quantos, setQuantos] = useState(0);

  const mudarRodada = useCallback(() => setQualRodada(prev => prev + 1), []);
  const mudarClicar = useCallback(() => setClicar(prev => !prev), []);
  const mudarJogar = useCallback(() => setJogar(prev => !prev), []);
  const mudarSorteado = useCallback((x: number) => setSorteado(x), []);
  const mudarSoma = useCallback((x: number) => setSoma(prev => prev + x), []);

  const [pontu_1, setPontu_1] = useState(0);
  const [pontu_2, setPontu_2] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [okayFunction, setOkayFunction] = useState<(() => void) | null>(null);

  const addPontu = (qual: boolean) => {
    if (qual) {
      const newScore = pontu_1 + 1;
      setPontu_1(newScore);
      if (newScore >= 5) {
        setGameOver(true);
        setWinner("Jogador 1");
      }
    } else {
      const newScore = pontu_2 + 1;
      setPontu_2(newScore);
      if (newScore >= 5) {
        setGameOver(true);
        setWinner("Jogador 2");
      }
    }
  };

  const [tempo_1, setTempo_1] = useState(0.0);
  const [tempo_2, setTempo_2] = useState(0.0);
  const [liveTime, setLiveTime] = useState(0.0);

  const handleTimeUpdate = (tempo: number) => {
    setLiveTime(tempo);
  };

  const addTempo = (aumento: number, currentSoma?: number) => {
    const somaToCheck = currentSoma !== undefined ? currentSoma : soma;
    if (qualRodada % 2 !== 0) {
      if (somaToCheck === sorteado) setTempo_1(aumento);
      else setTempo_1(10000);
    } else {
      if (somaToCheck === sorteado) setTempo_2(aumento);
      else setTempo_2(10000);
    }
    setSoma(0);
  };

  useEffect(() => {
    if (qualRodada !== 0 && qualRodada % 2 === 0) {
      if (tempo_1 > 0 && tempo_2 > 0) {
        const delay = setTimeout(() => {
          if (tempo_1 !== tempo_2) {
            if (tempo_1 < tempo_2) addPontu(true);
            else addPontu(false);
          }
          setTempo_1(0);
          setTempo_2(0);
        }, 2000);

        return () => clearTimeout(delay);
      }
    }
  }, [tempo_1, tempo_2, qualRodada]);

  const reiniciar = () => {
    setPontu_1(0);
    setPontu_2(0);
    setQualRodada(0);
    setGameOver(false);
    setWinner(null);
  };

  const onStartGame = () => {
    if (clicar) {
      mudarClicar();
    }
  };

  const handleOkayChange = useCallback((okayFn: () => void) => {
    setOkayFunction(okayFn);
  }, []);

  // Global click handler for submitting the game (replacing the button)
  const handleGlobalClick = () => {
    if (jogar && okayFunction) {
      okayFunction();
    }
  };

  // Listen for "Enter" key to submit
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && jogar && okayFunction) {
        event.preventDefault();
        okayFunction();
      }
    };

    if (jogar && okayFunction) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [jogar, okayFunction]);

  return (
    <div className={styles.container} onClick={handleGlobalClick}>
      <div className={styles.leftPanel}>
        <div className={styles.gameControlsPanel} data-target="numeroMagico">
          <div className={styles.sorteContainer} >
            <div className={styles.textoSorte}>Número Mágico</div>
            <div className={styles.numSorte}>
              <Girar
                rodada={qualRodada}
                mudarSorteado={mudarSorteado}
                clicar={clicar}
                mudarJogar={mudarJogar}
              />
            </div>
          </div>

          <div className={styles.botaoIni}>
            {jogar ? (
              <div className={styles.instructionText}>
                Clique fora do tabuleiro para confirmar
              </div>
            ) : (
              <GameButton
                clicar={clicar}
                jogar={jogar}
                gameOver={gameOver}
                onStartGame={onStartGame}
                onSubmit={okayFunction || undefined}
              />
            )}
          </div>
        </div>

        <div className={styles.scorePanel}>
          <div className={styles.scoreHeader}>PLACAR</div>

          <div className={styles.playersRow} data-target='placar'>
            <div className={styles.playerSection}>
              <div className={`${styles.playerLabel} ${qualRodada % 2 === 0 ? styles.playerLabelActive : ''}`}>Jogador 1</div>
              <div className={styles.playerInfoRow}>
                <div className={styles.playerInfo}>
                  <span className={styles.infoLabel}>Pontos:</span>
                  <span className={styles.numPontu2}>{pontu_1}</span>
                </div>
                <div className={styles.playerInfo}>
                  <span className={styles.infoLabel}>Tempo:</span>
                  <span className={styles.numTempo}>
                    {qualRodada % 2 === 0 && jogar
                      ? `${liveTime.toFixed(1)}s`
                      : tempo_1 === 10000
                        ? "X"
                        : tempo_1 > 0
                          ? `${tempo_1.toFixed(1)}s`
                          : "0.0s"}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.playerSection}>
              <div className={`${styles.playerLabel} ${qualRodada % 2 !== 0 ? styles.playerLabelActive : ''}`}>Jogador 2</div>
              <div className={styles.playerInfoRow}>
                <div className={styles.playerInfo}>
                  <span className={styles.infoLabel}>Pontos:</span>
                  <span className={styles.numPontu1}>{pontu_2}</span>
                </div>
                <div className={styles.playerInfo}>
                  <span className={styles.infoLabel}>Tempo:</span>
                  <span className={styles.numTempo}>
                    {qualRodada % 2 !== 0 && jogar
                      ? `${liveTime.toFixed(1)}s`
                      : tempo_2 === 10000
                        ? "X"
                        : tempo_2 > 0
                          ? `${tempo_2.toFixed(1)}s`
                          : "0.0s"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {gameOver && (
            <button className={styles.button} onClick={reiniciar}>
              Jogar de novo
            </button>
          )}
        </div>
      </div>

      <div className={styles.gameBoard}>
        <Tabuleiro
          addTempo={addTempo}
          mudarClicar={mudarClicar}
          jogar={jogar}
          mudarJogar={mudarJogar}
          mudarRodada={mudarRodada}
          mudarSoma={mudarSoma}
          soma={soma}
          qualRodada={qualRodada}
          setQuantos={setQuantos}
          quantos={quantos}
          sorteado={sorteado}
          onTimeUpdate={handleTimeUpdate}
          onOkayChange={handleOkayChange}
        //styles={styles} // se quiser passar styles para Tabuleiro
        />
      </div>
      {showTutorial && (
        <DynamicTutorial
          steps={tutorialSteps}
          onFinish={() => setShowTutorial(false)}
          storageKey="cacasoma_v1"
          locale="pt"
          styles={tutorialStyles}
        />
      )}
    </div>
  );
}

export default Caca_soma;
