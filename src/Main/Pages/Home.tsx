//import MainMenu from "../Components/mainMenu";
import { useEffect } from "react";
import "../CSS/Home.css";
import { useNavigate } from "react-router-dom";
import RubiksCube from "../../RubiksClass/Components/RubiksCube";
import { ROUTES } from "../../routes";

function Home() {
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

  const navigate = useNavigate();
  const mudar_pagina = (pagina: string) => {
    navigate(pagina);
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
    </div>
  );
}

export default Home;
