//import MainMenu from "../Components/mainMenu";
import "../CSS/Home.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RubiksCube from "../../RubiksClass/Components/RubiksCube";
import { resetLocalPlayerProgress } from "../../Shared/PlayerProgress/localPlayerProgress";
import { analytics } from "../../analytics/events";
import { ROUTES } from "../../routes";

function Home() {
  const navigate = useNavigate();
  const [resetFeedback, setResetFeedback] = useState("");
  const mudar_pagina = (pagina: string) => {
    navigate(pagina);
  };

  const switchPlayer = () => {
    const confirmed = window.confirm(
      "Trocar de jogador? O progresso dos jogos, tutoriais concluídos e o nome lembrado neste dispositivo serão apagados. As turmas online serão mantidas.",
    );

    if (!confirmed) {
      return;
    }

    resetLocalPlayerProgress(window.localStorage);
    analytics.localProgressReset({ reason: "player_switch" });
    setResetFeedback("Pronto! O próximo jogador começará com um progresso novo.");
  };
  return (
    <div className="homePage">
      <div className="imagens">
        <img src={`${import.meta.env.BASE_URL}imagemXadrez.png`} className="imagemXadrez" />
        <div className="imagemCuboWrapper">
          <RubiksCube size={3} cubeSize={15} />
        </div>
      </div>
      <div className="logo">
        {/* <picture>
          <source
            srcSet={`${import.meta.env.BASE_URL}logoEscritaVertical.png`}
            media="(orientation: portrait)"
          />
          <img
            src={`${import.meta.env.BASE_URL}logoEscritaHorizontal5.png`}
            className="logoTexto"
            alt="Logo"
          />
        </picture> */}
        <h1 className="logoTitle">
          <span className="jogando">JOGANDO</span>
          <span className="com">com</span>
          <span className="logica">LÓGICA</span>
        </h1>
      </div>
      <div className="buttonsHome">
        <button className="buttonJogar" onClick={() => mudar_pagina(ROUTES.GAMES)}>
          {" "}
          Jogar
        </button>
        <div className="buttonRow">
          <button className="buttonSobre" onClick={() => mudar_pagina(ROUTES.ABOUT)}>
            {" "}
            Sobre
          </button>
          <button
            className="buttonContato"
            onClick={() => mudar_pagina(ROUTES.CONTACT)}
          >
            {" "}
            Contato
          </button>
        </div>
      </div>
      <button className="buttonManual" onClick={() => mudar_pagina(ROUTES.MANUAL)}>
        {" "}
        Para Professores
      </button>
      <button className="buttonSwitchPlayer" onClick={switchPlayer} type="button">
        Trocar jogador
      </button>
      {resetFeedback && (
        <p className="switchPlayerFeedback" role="status">
          {resetFeedback}
        </p>
      )}
    </div>
  );
}

export default Home;
