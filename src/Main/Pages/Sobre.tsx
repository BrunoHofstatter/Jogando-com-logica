import "../CSS/Sobre.css";
//import "../CSS/SobreSections.css";
import { useEffect } from "react";
import SectionBox from "../Components/sectionBox";

function Sobre() {
  useEffect(() => {
    document.body.style.backgroundColor = "#68c2e0";
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", "#68c2e0");
  }, []);

  return (
    <section className="sobre">

      <h2>Sobre Nós</h2>
      <div className="boxBoxes">
        <SectionBox
          title="O que é o Jogando com Lógica?"
          sectionClassName="oqeSection"
          boxClassName="oqeBox"
        >
          <p>
            O <strong>Jogando com Lógica</strong> é um projeto educacional que
            ensina matemática e raciocínio lógico por meio de jogos como cubos
            mágicos, xadrez, Stop Matemático e outros desafios criativos.
            Voltado para crianças do 1º ao 6º ano do ensino fundamental, o
            projeto promove o pensamento crítico de forma lúdica e acessível —
            tanto presencialmente quanto agora em uma nova versão digital.
          </p>
        </SectionBox>

        <SectionBox
          title="Equipe do projeto"
          sectionClassName="equSection"
          boxClassName="equBox"
        >
          <p>
            O projeto foi idealizado por{" "}
            <strong>Bruno da Silva Hofstatter</strong>. Além dele, o time conta
            com{" "}
            <span style={{ fontSize: "30px", color: "red" }}>
              <strong>Gabriel</strong>, <strong>Tiago</strong> e{" "}
              <strong>Rodrigo</strong>
            </span>
            , que colaboram na criação, programação e design da plataforma
            digital — todos comprometidos em tornar o aprendizado mais acessível
            e estimulante para crianças.
          </p>
        </SectionBox>

        <SectionBox
          title="Como surgiu?"
          sectionClassName="surgSection"
          boxClassName="surgBox"
        >
          <p>
            A ideia nasceu após uma oficina de cubo mágico ministrada para
            alunos do 7º ao 9º ano da escola. O interesse e a empolgação dos
            estudantes inspiraram a expansão do projeto para outras faixas
            etárias. Ao levá-lo a uma escola pública com alunos mais novos, foi
            necessário adaptar as atividades, criando jogos personalizados e
            estratégias didáticas para ensinar lógica de forma simples e
            envolvente.
          </p>
        </SectionBox>

        <SectionBox
          title="Objetivo"
          sectionClassName="objSection"
          boxClassName="objBox"
        >
          <p>
            O principal objetivo do projeto é mostrar que aprender matemática
            pode ser divertido. Sabemos que, muitas vezes, matérias como
            matemática e raciocínio lógico são vistas como difíceis ou
            desmotivadoras pelos alunos. Por isso, buscamos mudar essa percepção
            ao apresentar os conteúdos de forma lúdica e acessível. Através dos
            jogos, desenvolvemos o raciocínio lógico, a capacidade de resolver
            problemas e o trabalho em equipe, tornando o aprendizado mais leve,
            dinâmico e significativo para as crianças.
          </p>
        </SectionBox>

        <SectionBox
          title="Parte presencial do projeto"
          sectionClassName="presSection"
          boxClassName="presBox"
        >
          <p>
            Nas atividades presenciais, os alunos são divididos em pequenos
            grupos de 6 a 8 participantes por turma. Cada grupo participa de
            oficinas que envolvem cubos mágicos de diferentes tipos, jogos de
            tabuleiro como xadrez e damas, além de criações próprias como o{" "}
            <em>Stop Matemático</em>, o <em>Jogo da Velha Gigante</em>, e outras
            variantes de jogos tradicionais. Todas as aulas são planejadas para
            estimular o raciocínio lógico e a compreensão de operações
            matemáticas de forma interativa.
          </p>
        </SectionBox>

        <SectionBox
          title="Expansão para o digital"
          sectionClassName="digSection"
          boxClassName="digBox"
        >
          <p>
            Atualmente, o <strong>Jogando com Lógica</strong> está sendo
            transformado em uma plataforma digital. A ideia é levar os jogos e
            atividades do projeto para um ambiente online, onde crianças de
            diferentes lugares possam aprender e se divertir com lógica, mesmo
            fora da sala de aula.
          </p>
        </SectionBox>
      </div>
    </section>
  );
}

export default Sobre;
