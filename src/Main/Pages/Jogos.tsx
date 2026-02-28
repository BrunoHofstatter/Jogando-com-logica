import { useState } from "react";
import "../CSS/Jogos.css";
import GameButton from "../Components/GameButton";
import { useNavigate } from "react-router-dom";

function Jogos() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const gamesPerPage = 6;

  const handleRubiksClick = () => {
    const hasSeen = localStorage.getItem("hasSeenRubiksClass1");
    if (!hasSeen) {
      localStorage.setItem("hasSeenRubiksClass1", "true");
      navigate("/class1");
    } else {
      navigate("/classMenu");
    }
  };

  const allGames = [
    {
      pagina: "jogoStop",
      label: "Stop Matemático",
      imageSrc: `${import.meta.env.BASE_URL}iconStop.png`,
    },
    {
      pagina: "cacasomaRg",
      label: "Caça Soma",
      imageSrc: `${import.meta.env.BASE_URL}cacasomaLogo.png`,
    },
    {
      pagina: "classMenu",
      label: "Cubo Mágico",
      imageSrc: `${import.meta.env.BASE_URL}3x3.png`,
      onClick: handleRubiksClick,
    },
    {
      pagina: "spttt",
      label: "Super Jogo da Velha",
      imageSrc: `${import.meta.env.BASE_URL}sptttLogo.png`,
    },
    {
      pagina: "crownchaseRg",
      label: "Caça Coroa",
      imageSrc: `${import.meta.env.BASE_URL}cacacoroaLogo.png`,
    },
    {
      pagina: "mathwarRg",
      label: "Guerra Matemática",
      imageSrc: `${import.meta.env.BASE_URL}mathwarLogo.png`,
    }

  ];

  const totalPages = Math.ceil(allGames.length / gamesPerPage);
  const currentGames = allGames.slice(currentPage * gamesPerPage, (currentPage + 1) * gamesPerPage);

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div className="jogosPg">
      <div className="jogosHeader">
        <div className="jogosTitle">Jogos</div>
      </div>

      <div className="jogos-carousel-container">
        <button
          className={`nav-arrow prev-arrow ${currentPage === 0 ? 'disabled' : ''}`}
          onClick={prevPage}
          disabled={currentPage === 0}
        />

        <div className="grade_jogos">
          {currentGames.map((game, index) => (
            <GameButton
              key={index}
              pagina={game.pagina}
              label={game.label}
              imageSrc={game.imageSrc}
              onClick={game.onClick}
            />
          ))}
        </div>

        <button
          className={`nav-arrow next-arrow ${currentPage >= totalPages - 1 ? 'disabled' : ''}`}
          onClick={nextPage}
          disabled={currentPage >= totalPages - 1}
        />
      </div>
    </div>
  );
}

export default Jogos;