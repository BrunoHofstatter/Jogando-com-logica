import "../CSS/Jogos.css";
import GameButton from "../Components/GameButton";
import { useNavigate } from "react-router-dom";

function Jogos() {
  const navigate = useNavigate();

  const handleRubiksClick = () => {
    const hasSeen = localStorage.getItem("hasSeenRubiksClass1");
    if (!hasSeen) {
      localStorage.setItem("hasSeenRubiksClass1", "true");
      navigate("/class1");
    } else {
      navigate("/classMenu");
    }
  };

  return (
    <div className="jogosPg">
      <div className="jogosHeader">
        <h2>Jogos</h2>
      </div>
      <div className="grade_jogos">
        <GameButton
          pagina="jogoStop"
          label="Stop Matemático"
          imageSrc={`${import.meta.env.BASE_URL}iconStop.png`}
        />
        <GameButton
          pagina="cacasomaRg"
          label="Caça Soma"
          imageSrc={`${import.meta.env.BASE_URL}cacasomaLogo.png`}
        />
        <GameButton
          pagina="classMenu"
          label="Cubo Mágico"
          imageSrc={`${import.meta.env.BASE_URL}3x3.png`}
          onClick={handleRubiksClick}
        />
        <GameButton
          pagina="spttt"
          label="Super Jogo da Velha"
          imageSrc={`${import.meta.env.BASE_URL}sptttLogo.png`}
        />


        <GameButton
          pagina="crownchaseRg"
          label="Caça Coroa"
          imageSrc={`${import.meta.env.BASE_URL}cacacoroaLogo.png`}
        />

        <GameButton
          pagina="mathwarRg"
          label="Guerra Matemática"
          imageSrc={`${import.meta.env.BASE_URL}mathwarLogo.png`}
        />

      </div>
    </div>
  );
}

export default Jogos;