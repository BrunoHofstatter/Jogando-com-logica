import { useRef, useState, useEffect } from 'react';
import styles from '../CSS/manual.module.css';
import { analytics, type GameId as AnalyticsGameId } from '../../analytics/events';
import { ROUTES } from "../../routes";

type GameId =
  | 'stop-matematico'
  | 'caca-soma'
  | 'cubo-magico'
  | 'super-velha'
  | 'caca-coroa'
  | 'guerra-matematica';

type GameGuide = {
  id: GameId;
  analyticsId: AnalyticsGameId;
  name: string;
  shortUse: string;
  grades: string;
  time: string;
  format: string;
  setup: string;
  preview: string;
  rulesRoute: string;
  description: string;
  teaches: string[];
  modes: string[];
  notes: string[];
  limitations: string;
};

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

  const navigateToRules = (game: GameGuide) => {
    analytics.gameSelected({
      gameId: game.analyticsId,
      entryPoint: 'teacher_manual',
    });
    window.location.href = game.rulesRoute;
  };

  const games: GameGuide[] = [
    {
      id: 'stop-matematico',
      analyticsId: 'stop_matematico',
      name: 'Stop Matemático',
      shortUse: 'Cálculo mental rápido com pressão de tempo.',
      grades: '3º ao 7º ano',
      time: '1 a 5 min por rodada',
      format: 'Individual, online e turma',
      setup: 'Baixa mediação',
      preview: 'stopPreview.png',
      rulesRoute: ROUTES.STOP_RULES,
      description:
        'Um jogo de aritmética inspirado no Stop tradicional. A cada rodada, aparece um Número Mágico, e os alunos resolvem contas usando esse número como ponto de partida. O foco é calcular de cabeça com rapidez e precisão.',
      teaches: [
        'Cálculo mental com adição, subtração, multiplicação e divisão',
        'Atenção concentrada sob limite de tempo',
        'Estratégias flexíveis para chegar ao resultado com agilidade',
      ],
      modes: [
        'Modo aleatório para rodadas rápidas',
        'Modo níveis com progressão por estrelas',
        'Tutorial inicial para apresentar a lógica do jogo',
        'Modo online com salas para 2 a 8 jogadores, configurações do anfitrião e turmas online',
      ],
      notes: [
        'Cada caixa começa de novo a partir do Número Mágico.',
        'Caixas com duas operações pedem apenas o resultado final.',
        'O modo online permite partidas rápidas com vários alunos na mesma sala.',
      ],
      limitations:
        'A pressão de tempo pode ser intensa para alguns alunos; nesses casos, use níveis iniciais ou rodadas sem foco em competição.',
    },
    {
      id: 'caca-soma',
      analyticsId: 'caca_soma',
      name: 'Caça Soma',
      shortUse: 'Encontrar combinações de números que formam uma soma.',
      grades: '4º ao 7º ano',
      time: '1 a 4 min nos níveis',
      format: 'Individual, duplas, online e turma',
      setup: 'Baixa mediação',
      preview: 'cacasomaPreview.png',
      rulesRoute: ROUTES.CACA_SOMA_RULES,
      description:
        'O aluno recebe um Número Mágico e precisa selecionar números no tabuleiro cuja soma chegue exatamente ao alvo. As células usadas em respostas corretas ficam bloqueadas, então o jogo também exige planejamento.',
      teaches: [
        'Adição rápida e conferência mental',
        'Composição e decomposição de números',
        'Busca visual, precisão e tomada de decisão sob tempo',
        'Coordenação em equipe no modo online 2 contra 2',
      ],
      modes: [
        'Modo níveis com estrelas e desbloqueio de fases',
        'Modo local de 2 jogadores no mesmo dispositivo',
        'Modo online 1 contra 1',
        'Modo online 2 contra 2, em que cada colega escolhe parte da soma',
        'Salas privadas e salas visíveis por código de turma',
      ],
      notes: [
        'O modo 2 contra 2 destaca a colaboração, porque cada colega escolhe uma parte da soma.',
        'Uma mesma meta pode ter diferentes combinações possíveis.',
        'Células usadas em respostas corretas ficam bloqueadas, criando decisões de planejamento.',
      ],
      limitations:
        'O modo local antigo ainda existe, mas o online é a direção principal para partidas competitivas em turma.',
    },
    {
      id: 'cubo-magico',
      analyticsId: 'cubo_magico',
      name: 'Cubo Mágico',
      shortUse: 'Aulas interativas de matemática com cubos.',
      grades: '3º ao 6º ano',
      time: 'Bloco de aula guiado',
      format: 'Individual ou professor guiando',
      setup: 'Mediação média',
      preview: 'cubomagicoPreview.png',
      rulesRoute: ROUTES.CLASS_MENU,
      description:
        'O Cubo Mágico não é um jogo tradicional. Ele funciona como uma sequência de aulas interativas e revisões jogáveis, usando cubos para tornar conceitos matemáticos mais visuais e concretos.',
      teaches: [
        'Percepção espacial e leitura da estrutura do cubo',
        'Contagem, agrupamento e multiplicação visual',
        'Dimensões, quadradinhos em uma face e padrões geométricos',
        'Resolução de problemas por tentativa, dica e descoberta',
      ],
      modes: [
        'Aula 1: Dimensões',
        'Aula 2: Quadradinhos em uma face e multiplicação visual',
        'Opção Aprender para seguir a aula completa',
        'Opção Jogar para ir direto à revisão da aula',
      ],
      notes: [
        'É mais próximo de uma aula interativa do que de uma partida competitiva.',
        'As dicas aparecem de forma progressiva, mantendo a ideia de tentar antes da explicação completa.',
        'As revisões são mais jogáveis e servem para retomar o conteúdo da aula.',
      ],
      limitations:
        'Apenas as primeiras aulas estão implementadas por enquanto; os próximos módulos ainda são planejamento.',
    },
    {
      id: 'super-velha',
      analyticsId: 'super_jogo_da_velha',
      name: 'Super Jogo da Velha',
      shortUse: 'Estratégia com objetivos locais e globais.',
      grades: '5º ao 7º ano',
      time: '10 a 30 min',
      format: 'Duplas, computador, online e turma',
      setup: 'Mediação média',
      preview: 'sptttPreview.png',
      rulesRoute: ROUTES.SPTTT_RULES,
      description:
        'Uma versão mais estratégica do jogo da velha. Existem 9 tabuleiros pequenos dentro de um tabuleiro maior, e cada jogada define onde o próximo jogador deverá jogar. Vence quem conquistar 3 tabuleiros pequenos em linha.',
      teaches: [
        'Planejamento de curto e longo prazo',
        'Antecipação de jogadas do adversário',
        'Reconhecimento de padrões e tomada de decisão com restrições',
        'Gestão de objetivos locais e globais ao mesmo tempo',
      ],
      modes: [
        '2 jogadores no mesmo dispositivo',
        'Contra o computador',
        'Online 1 contra 1 com sala privada',
        'Salas visíveis por código de turma',
      ],
      notes: [
        'Cada jogada define o tabuleiro em que o adversário joga em seguida.',
        'O jogo combina objetivos pequenos, dentro de cada tabuleiro, com o objetivo maior da partida.',
        'O modo contra o computador permite prática individual.',
      ],
      limitations:
        'Pode ser abstrato para alunos que ainda não estão confortáveis em pensar várias jogadas à frente.',
    },
    {
      id: 'caca-coroa',
      analyticsId: 'caca_coroa',
      name: 'Caça Coroa',
      shortUse: 'Estratégia de tabuleiro simples e rápida.',
      grades: '3º ao 7º ano',
      time: '5 a 20 min',
      format: 'Duplas, computador, online e turma',
      setup: 'Baixa a média mediação',
      preview: 'crownchasePreview.png',
      rulesRoute: ROUTES.CROWN_CHASE_RULES,
      description:
        'Um jogo de estratégia em tabuleiro 5x5, parecido com uma introdução ao pensamento do xadrez, mas mais curto e simples. O objetivo é capturar o Rei adversário, que permanece parado.',
      teaches: [
        'Raciocínio espacial em grade',
        'Planejamento, ataque, defesa e antecipação',
        'Comparação de riscos antes de mover uma peça',
      ],
      modes: [
        '2 jogadores no mesmo dispositivo',
        'Contra o computador',
        'Online 1 contra 1 com sala privada',
        'Salas visíveis por código de turma',
      ],
      notes: [
        'O tabuleiro 5x5 torna as partidas mais curtas que jogos estratégicos tradicionais.',
        'O Rei fica parado, então a partida gira em torno de ataque, defesa e proteção de espaço.',
        'É uma boa ponte para raciocínio estratégico sem exigir as regras completas do xadrez.',
      ],
      limitations:
        'Algumas turmas podem precisar de uma rodada demonstrativa para diferenciar as peças e suas formas de movimento.',
    },
    {
      id: 'guerra-matematica',
      analyticsId: 'guerra_matematica',
      name: 'Guerra Matemática',
      shortUse: 'Estratégia de tabuleiro com energia calculada.',
      grades: '6º ao 7º ano',
      time: '10 a 30 min',
      format: 'Duplas, computador, online e turma',
      setup: 'Mediação média',
      preview: 'mathwarPreview.png',
      rulesRoute: ROUTES.MATH_WAR_RULES,
      description:
        'Um jogo de tabuleiro inspirado no xadrez, mas com movimento baseado em cálculo. Cada peça tem um valor, os dados geram uma energia, e o aluno precisa decidir se aquela energia basta para mover ou capturar. O objetivo é capturar o Capitão adversário.',
      teaches: [
        'Cálculo mental em decisões de jogo',
        'Gestão de recursos e comparação de custos',
        'Planejamento tático, proteção do Capitão e leitura do tabuleiro',
        'Tomada de decisão em múltiplas etapas',
      ],
      modes: [
        '2 jogadores no mesmo dispositivo',
        'Contra o computador com dificuldades desbloqueáveis',
        'Online 1 contra 1 com sala privada',
        'Salas visíveis por código de turma',
      ],
      notes: [
        'A energia é calculada a partir do valor da peça e dos dados.',
        'Mover custa energia por casa, e capturar tem custo adicional.',
        'É o jogo com maior carga de regras entre os jogos atuais da plataforma.',
      ],
      limitations:
        'É um dos jogos mais complexos da plataforma e tende a funcionar melhor depois que os alunos já experimentaram jogos estratégicos mais simples.',
    },
  ];

  const onlineGames = games.filter(game => game.id !== 'cubo-magico');

  return (
    <main className={styles.manualPage}>
      <button
        className={`${styles.scrollTopButton} ${showScrollTop ? styles.visible : ''}`}
        onClick={scrollToTop}
        aria-label="Voltar ao topo"
      >
        ↑
      </button>

      <header>
        <h1>Guia para professores</h1>
        <p className={styles.headerIntro}>
          Escolha jogos, organize a turma e use o Jogando com Lógica como apoio prático para aulas de matemática e raciocínio lógico.
        </p>
      </header>

      <section>
        <h2>Como usar o projeto</h2>
        <p>
          O Jogando com Lógica é uma plataforma gratuita de jogos educativos para alunos do ensino fundamental. A ideia é ajudar professores a trabalhar cálculo mental, estratégia, lógica espacial e resolução de problemas por meio de atividades rápidas, acessíveis e sem cadastro.
        </p>
        <p>
          As indicações de série são sugestões práticas. Cada turma pode responder de um jeito diferente, então o professor pode adaptar o jogo, o tempo e o nível de ajuda conforme a realidade dos alunos.
        </p>

        <div className={styles.teacherHighlights}>
          <div>
            <strong>Sem login</strong>
            <p>Os alunos entram no site e começam a jogar sem conta, senha ou cadastro.</p>
          </div>
          <div>
            <strong>Uso flexível</strong>
            <p>Funciona como aquecimento, rotação por estações, prática individual, disputa em duplas ou desafio online.</p>
          </div>
          <div>
            <strong>Professor no controle</strong>
            <p>O projeto apoia a aula, mas não substitui a mediação do professor e a discussão das estratégias usadas.</p>
          </div>
        </div>
      </section>

      <section className={styles.classroomSection}>
        <div>
          <h2>Turmas Online</h2>
          <p>
            Para organizar partidas online em sala, o professor pode criar uma turma temporária. O site gera um código de quatro letras, os alunos entram com esse código no lobby online do jogo, e passam a ver as salas abertas daquela turma.
          </p>
          <ul className={styles.gameDetails}>
            <li>O código da turma dura 8 horas.</li>
            <li>Não há login, senha, lista de alunos ou cadastro permanente.</li>
            <li>Salas privadas continuam disponíveis para quem preferir entrar por código de sala.</li>
            <li>Jogos com turma online: {onlineGames.map(game => game.name).join(', ')}.</li>
          </ul>
        </div>
        <button
          className={styles.classroomsButton}
          onClick={() => {
            window.location.href = ROUTES.CLASSROOMS;
          }}
        >
          Gerenciar turmas online
        </button>
      </section>

      <section ref={jogosSection}>
        <h2>Jogos</h2>
        <div className={styles.gamesList}>
          {games.map((game, index) => (
            <div key={game.id} className={styles.gameCard} data-game-id={game.id}>
              <h3>{game.name}</h3>
              <p>{game.shortUse}</p>
              <div className={styles.cardMeta}>
                <span>{game.grades}</span>
                <span>{game.time}</span>
                <span>{game.format}</span>
                <span>{game.setup}</span>
              </div>
              <button
                className={styles.viewButton}
                onClick={() => scrollToSection(index)}
              >
                Ver detalhes
              </button>
            </div>
          ))}
        </div>
      </section>

      {games.map((game, index) => (
        <section
          key={game.id}
          ref={el => {
            if (el) {
              gameSections.current[index] = el;
            }
          }}
          id={game.id}
          className={styles.gameSection}
          data-game-id={game.id}
        >
          <button
            className={styles.rulesButton}
            onClick={() => navigateToRules(game)}
          >
            Ver regras completas
          </button>

          <h2>{game.name}</h2>

          <div className={styles.gameText}>
            <div className={styles.descriptionWithImage}>
              <div>
                <h3>Para que serve em aula</h3>
                <p>{game.description}</p>
                <div className={styles.infoBadges}>
                  <span>{game.grades}</span>
                  <span>{game.time}</span>
                  <span>{game.format}</span>
                  <span>{game.setup}</span>
                </div>
              </div>
              <img
                src={`${import.meta.env.BASE_URL}${game.preview}`}
                alt={`Prévia de ${game.name}`}
                className={styles.preview}
              />
            </div>

            <h3>Habilidades trabalhadas</h3>
            <ul>
              {game.teaches.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3>Modos disponíveis</h3>
            <ul className={styles.gameDetails}>
              {game.modes.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3>Observações úteis</h3>
            <ul>
              {game.notes.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3>Limitação atual</h3>
            <p>{game.limitations}</p>
          </div>
        </section>
      ))}

      <section>
        <h2>Feedback</h2>
        <div className={styles.feedbackButtonContainer}>
          <div className={styles.feedbackHighlight}>
            Sua opinião é fundamental para melhorar o projeto.
          </div>
          <button
            className={styles.feedbackButton}
            onClick={() => {
              analytics.feedbackOpened({ entryPoint: 'teacher_manual' });
              window.open(
                'https://docs.google.com/forms/d/e/1FAIpQLSc6W0uOiy5uYFGhjVjqzS3Iw6mp_VzHSi5qNkfnTuqS0dffOQ/viewform?embedded=true',
                '_blank'
              );
            }}
          >
            Formulário de feedback
          </button>
          <div className={styles.feedbackBox}>
            <p>
              Depois de usar os jogos com uma turma, conte o que funcionou, o que confundiu os alunos e quais melhorias fariam diferença na sala de aula.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Manual;
