import { useRef, useState, useEffect } from 'react';
import styles from '../CSS/manual.module.css';

function Manual() {
  const gameSections = useRef<(HTMLElement | null)[]>([]);
  const jogosSection = useRef<HTMLElement | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (jogosSection.current) {
        const jogosSectionBottom = jogosSection.current.offsetTop + jogosSection.current.offsetHeight;
        setShowScrollTop(window.scrollY > jogosSectionBottom);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    if (jogosSection.current) {
      const y = jogosSection.current.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const scrollToSection = (index: number) => {
    gameSections.current[index]?.scrollIntoView({ behavior: 'smooth' });
  };

  // Game routes - you can update these later
  const gameRoutes = {
    'stop-matematico': '/jogoStop',
    'caca-soma': '/cacasomaRg',
    'cubo-magico': '/dimensions',
    'super-velha': '/spttt',
    'caca-coroa': '/crownchaseRg',
    'guerra-matematica': '/mathwarRg'
  };

  const navigateToRules = (gameId: keyof typeof gameRoutes) => {
    // For now, just log - you can replace with actual navigation later

    window.location.href = gameRoutes[gameId];
  };

  const games = [
    { id: 'stop-matematico', name: 'Stop Matemático', description: 'Jogo de fazer contas matemáticas mentalmente com tempo', preview: 'stopPreview.png' },
    { id: 'caca-soma', name: 'Caça-soma', description: 'Jogo de achar combinações de números para formar somas', preview: 'cacasomaPreview.png' },
    { id: 'cubo-magico', name: 'Cubo mágico', description: 'Várias aulas de matemática usando o cubo mágico', preview: 'cuboPreview.png' },
    { id: 'super-velha', name: 'Super jogo da velha', description: 'Versão mais complexa do jogo da velha', preview: 'sptttPreview.png' },
    { id: 'caca-coroa', name: 'Caça coroa', description: 'Jogo de tabuleiro com objetivo de capturar o rei', preview: 'crownchasePreview.png' },
    { id: 'guerra-matematica', name: 'Guerra matemática', description: 'Jogo de tabuleiro com contas matemáticas para calcular movimento', preview: 'mathwarPreview.png' }
  ];

  return (
    <main className={styles.manualPage}>
      {/* Scroll to top button */}
      <button
        className={`${styles.scrollTopButton} ${showScrollTop ? styles.visible : ''}`}
        onClick={scrollToTop}
        aria-label="Voltar ao topo"
      >
        ↑
      </button>

      <header>
        <h1>Guia do site para professores</h1>
      </header>

      <section>
        <h2>Introdução</h2>
        <p>
          O Projeto Jogando com Lógica é uma iniciativa desenvolvida por jovens com o objetivo de estimular o raciocínio lógico em crianças, ajudando-as a pensar de forma mais estruturada e a resolver problemas com mais facilidade e criatividade.
        </p>
        <p>
          A proposta nasce da observação de uma dificuldade comum nas escolas: muitos alunos apresentam desafios ao lidar com situações que exigem pensamento analítico e resolução de problemas de forma independente.
        </p>
        <p>
          Por meio de jogos educativos e dinâmicos, o projeto busca transformar o aprendizado lógico em algo divertido, competitivo e colaborativo — mostrando que pensar logicamente também pode ser brincar.
        </p>
        <p>
          Se puder, envie seu feedback para o formulário abaixo!
        </p>
        <div className={styles.feedbackButtonContainer}>
          <button
            className={styles.feedbackButton}
            onClick={() =>
              window.open(
                'https://docs.google.com/forms/d/e/1FAIpQLSc6W0uOiy5uYFGhjVjqzS3Iw6mp_VzHSi5qNkfnTuqS0dffOQ/viewform?embedded=true',
                '_blank'
              )
            }
          >
            Formulário de feedback
          </button>
        </div>
      </section>

      <section ref={jogosSection}>
        <h2>Jogos</h2>
        <div className={styles.gamesList}>
          {games.map((game, index) => (
            <div key={index} className={styles.gameCard} data-game-id={game.id}>
              <h3>{game.name}</h3>
              <p>{game.description}</p>
              <button
                className={styles.viewButton}
                onClick={() => scrollToSection(index)}
              >
                Ver Detalhes
              </button>
            </div>
          ))}
        </div>
      </section>

      <section
        ref={el => {
          if (el) {
            gameSections.current[0] = el;
          }
        }}
        id="stop-matematico"
        className={styles.gameSection}
        data-game-id="stop-matematico"
      >
        <button
          className={styles.rulesButton}
          onClick={() => navigateToRules('stop-matematico')}
        >
          Ver regras completas
        </button>

        <h2> Stop Matemático</h2>


        <div className={styles.gameText}>
          <div className={styles.descriptionWithImage}>
            <div>
              <h3>Descrição do Jogo</h3>
              <p>
                O Stop Matemático funciona como o Stop tradicional, mas usando contas em vez de palavras. Cada rodada sorteia um <strong>Número Mágico</strong>, e o jogador precisa resolver rapidamente cálculos de adição, subtração, multiplicação ou divisão. Ao terminar, basta clicar em <strong>STOP</strong>, e o sistema corrige automaticamente.
              </p>

            </div>
            <img
              src={`${import.meta.env.BASE_URL}stopPreview.png`}
              alt="Stop Matemático Preview"
              className={styles.preview}
            />
          </div>
          <ul className={styles.gameDetails}>
            <li><strong>Número de jogadores:</strong> 1 (modo solo)</li>
            <li><strong>Modos de jogo:</strong> 6 níveis de dificuldade (Fácil 1 até Difícil 2)</li>
            <li><strong>Tempo médio:</strong> 1 a 5 minutos por rodada</li>
            <li><em>(Planejado futuramente: modo multijogador, quem fizer em menos tempo ganha)</em></li>
          </ul>



          <h3>Habilidades e Conteúdos Trabalhados</h3>
          <ul>
            <li>Cálculo mental rápido</li>
            <li>Operações básicas (adição, subtração, multiplicação e divisão)</li>
            <li>Atenção concentrada com limite de tempo</li>
          </ul>

          <h3>Dificuldades e Séries Recomendadas</h3>
          <ul>
            <li><strong>Dificuldades:</strong> a Fácil 1 tem adição e um pouco de subtração com números até 10; conforme a dificuldade aumenta, os número ficam maiores e multiplicação e divisão entram</li>
            <li><strong>Séries indicadas:</strong> 3º ao 7º ano</li>
          </ul>
        </div>



      </section>

      <section
        ref={el => {
          if (el) {
            gameSections.current[1] = el;
          }
        }}
        id="caca-soma"
        className={styles.gameSection}
        data-game-id="caca-soma"
      >
        <button
          className={styles.rulesButton}
          onClick={() => navigateToRules('caca-soma')}
        >
          Ver regras completas
        </button>

        <h2>Caça-Soma</h2>


        <div className={styles.gameText}>
          <div className={styles.descriptionWithImage}>
            <div>
              <h3>Descrição do Jogo</h3>
              <p>
                O Caça-Soma é um jogo de achar somas em uma tabela de 1 a 100. Cada rodada, o <strong>Número Mágico</strong> é sorteado e o jogador deve achar <strong>2 ou 3 números</strong> na tabela que somem ao número sorteado. Cada jogador faz uma rodada, e vence quem completar corretamente no menor tempo. O jogo continua até alguém conquistar 5 pontos.
              </p>

            </div>
            <img
              src={`${import.meta.env.BASE_URL}cacasomaPreview.png`}
              alt="Caça-Soma Preview"
              className={styles.preview}
            />
          </div>
          <ul className={styles.gameDetails}>
            <li><strong>Número de jogadores:</strong> 2 (mesmo aparelho)</li>
            <li><strong>Modos de jogo:</strong> partidas por rodada (melhor de 9)</li>
            <li><strong>Tempo médio:</strong> 4 a 8 minutos por partida</li>
            <li><strong>Dificuldade:</strong> varia conforme o adversário; números sorteados até 120</li>
          </ul>

          <h3>Habilidades e Conteúdos Trabalhados</h3>
          <ul>
            <li>Adição rápida</li>
            <li>Decomposição de números (separar um número em partes úteis)</li>
            <li>Velocidade e precisão em tempo real</li>
          </ul>

          <h3>Séries Recomendadas</h3>
          <ul>
            <li><strong>Séries indicadas:</strong> 4º ao 7º ano</li>
          </ul>
        </div>



      </section>

      <section
        ref={el => {
          if (el) {
            gameSections.current[2] = el;
          }
        }}
        id="cubo-magico"
        className={styles.gameSection}
        data-game-id="cubo-magico"
      >
        <button
          className={styles.rulesButton}
          onClick={() => navigateToRules('cubo-magico')}
        >
          Ver regras completas
        </button>

        <h2>Aula de cubo mágico</h2>


        <div className={styles.gameText}>
          <div className={styles.descriptionWithImage}>
            <div>
              <h3>Descrição do Jogo</h3>
              <p>
                As Aulas de Cubo Mágico usam cubos 2×2, 3×3, 4×4 e maiores para ensinar conceitos matemáticos de forma visual e concreta. Os alunos exploram dimensões, área, volume, contagem de quadradinhos, multiplicação e, futuramente, divisão e fração.
              </p>

            </div>
            <img
              src={`${import.meta.env.BASE_URL}cubomagicoPreview.png`}
              alt="Cubo Mágico Preview"
              className={styles.preview}
            />
          </div>
          <ul className={styles.gameDetails}>
            <li><strong>Número de jogadores:</strong> individual</li>
            <li><strong>Modos de jogo:</strong> aulas e desafios guiados</li>
            <li><strong>Status:</strong> temos somente 2 aulas por enquanto, temos mais em desenvolvimento</li>
          </ul>

          <h3>Séries Recomendadas</h3>
          <ul>
            <li><strong>Séries indicadas:</strong> 3º ao 6º ano (com módulos diferentes por série)</li>
          </ul>
        </div>



      </section>

      <section
        ref={el => {
          if (el) {
            gameSections.current[3] = el;
          }
        }}
        id="super-velha"
        className={styles.gameSection}
        data-game-id="super-velha"
      >
        <button
          className={styles.rulesButton}
          onClick={() => navigateToRules('super-velha')}
        >
          Ver regras completas
        </button>

        <h2>Super jogo da velha</h2>


        <div className={styles.gameText}>
          <div className={styles.descriptionWithImage}>
            <div>
              <h3>Descrição do Jogo</h3>
              <p>
                O Super Jogo da Velha expande o jogo tradicional para <strong>9 tabuleiros</strong>, onde cada jogada define em qual tabuleiro o próximo jogador atuará. Para vencer, é preciso conquistar 3 tabuleiros alinhados (horizontal, vertical ou diagonal) no tabuleiro maior.
              </p>

            </div>
            <img
              src={`${import.meta.env.BASE_URL}sptttPreview.png`}
              alt="Super Jogo da Velha Preview"
              className={styles.preview}
            />
          </div>
          <ul className={styles.gameDetails}>
            <li><strong>Número de jogadores:</strong> 2 (mesmo aparelho)</li>
            <li><strong>Tempo médio:</strong> 10 a 30 minutos</li>
          </ul>

          <h3>Habilidades e Conteúdos Trabalhados</h3>
          <ul>
            <li>Planejamento estratégico</li>
            <li>Antecipação de jogadas</li>
            <li>Raciocínio lógico</li>
          </ul>

          <h3>Séries Recomendadas</h3>
          <ul>
            <li><strong>Séries indicadas:</strong> 5º a 7º ano</li>
          </ul>
        </div>



      </section>

      <section
        ref={el => {
          if (el) {
            gameSections.current[4] = el;
          }
        }}
        id="caca-coroa"
        className={styles.gameSection}
        data-game-id="caca-coroa"
      >
        <button
          className={styles.rulesButton}
          onClick={() => navigateToRules('caca-coroa')}
        >
          Ver regras completas
        </button>

        <h2>Caça-Coroa</h2>


        <div className={styles.gameText}>
          <div className={styles.descriptionWithImage}>
            <div>
              <h3>Descrição do Jogo</h3>
              <p>
                O Caça-Coroa é um jogo de estratégia semelhante ao xadrez, porém mais simples e rápido, usando um tabuleiro 5×5. O objetivo é capturar o Rei inimigo, que fica parado. Os jogadores utilizam dois tipos de peças — <strong>Saltador</strong> e <strong>Assassino</strong> — com movimentos distintos.
              </p>

            </div>
            <img
              src={`${import.meta.env.BASE_URL}crownchasePreview.png`}
              alt="Caça-Coroa Preview"
              className={styles.preview}
            />
          </div>
          <ul className={styles.gameDetails}>
            <li><strong>Número de jogadores:</strong> 2 (mesmo aparelho)</li>
            <li><strong>Tempo médio:</strong> 5 a 20 minutos</li>
          </ul>

          <h3>Habilidades e Conteúdos Trabalhados</h3>
          <ul>
            <li>Planejamento estratégico</li>
            <li>Antecipação de jogadas</li>
            <li>Raciocínio lógico e tático</li>
          </ul>

          <h3>Séries Recomendadas</h3>
          <ul>
            <li><strong>Séries indicadas:</strong> 3º ao 7º ano</li>
          </ul>
        </div>



      </section>

      <section
        ref={el => {
          if (el) {
            gameSections.current[5] = el;
          }
        }}
        id="guerra-matematica"
        className={styles.gameSection}
        data-game-id="guerra-matematica"
      >
        <button
          className={styles.rulesButton}
          onClick={() => navigateToRules('guerra-matematica')}
        >
          Ver regras completas
        </button>

        <h2>Guerra Matemática</h2>


        <div className={styles.gameText}>
          <div className={styles.descriptionWithImage}>
            <div>
              <h3>Descrição do Jogo</h3>
              <p>
                A Guerra Matemática é um jogo de tabuleiro inspirado no Xadrez que combina estratégia com cálculo. Cada peça possui um valor, e a movimentação depende do resultado do dado + valor da peça, que gera a <strong>energia da peça</strong>. A energia é gasta para mover, que custa 2, e para capturar, que custa 4. O objetivo é eliminar o Capitão adversário.
              </p>

            </div>
            <img
              src={`${import.meta.env.BASE_URL}mathwarPreview.png`}
              alt="Guerra Matemática Preview"
              className={styles.preview}
            />
          </div>
          <ul className={styles.gameDetails}>
            <li><strong>Número de jogadores:</strong> 2 (mesmo aparelho)</li>
            <li><strong>Tempo médio:</strong> 10 a 30 minutos</li>
          </ul>

          <h3>Habilidades e Conteúdos Trabalhados</h3>
          <ul>
            <li>Cálculo mental rápido</li>
            <li>Estratégia e planejamento</li>
            <li>Raciocínio lógico e tático</li>
          </ul>

          <h3>Séries Recomendadas</h3>
          <ul>
            <li><strong>Séries indicadas:</strong> 6º e 7º ano</li>
          </ul>
        </div>



      </section>
    </main>
  );
}

export default Manual;