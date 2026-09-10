import { useState } from "react";
import "../CSS/Jogos.css";
import GameButton from "../Components/GameButton";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes";
import { analytics, type GameId } from "../../analytics/events";
import { resetLocalPlayerProgress } from "../../Shared/PlayerProgress/localPlayerProgress";


function Jogos() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [progressFeedback, setProgressFeedback] = useState("");
  const gamesPerPage = 6;

  const handleGameClick = (gameId: GameId, navigatePath: string) => {
    analytics.gameSelected({ gameId, entryPoint: "game_catalog" });
    // navigatePath already contains the leading slash from the ROUTES constant
    navigate(navigatePath);
  };

  const handleRubiksClick = () => {
    analytics.gameSelected({
      gameId: "cubo_magico",
      entryPoint: "game_catalog",
    });

    const hasSeen = localStorage.getItem("hasSeenRubiksClass1");
    if (!hasSeen) {
      localStorage.setItem("hasSeenRubiksClass1", "true");
      navigate(ROUTES.CLASS_1);
    } else {
      navigate(ROUTES.CLASS_MENU);
    }
  };

  const allGames = [
    {
      pagina: "jogoStop",
      label: "Stop Matemático",
      imageSrc: `${import.meta.env.BASE_URL}iconStop.png`,
      onClick: () => handleGameClick("stop_matematico", ROUTES.STOP_RULES)
    },
    {
      pagina: "cacasomaRg",
      label: "Caça Soma",
      imageSrc: `${import.meta.env.BASE_URL}cacasomaLogo.png`,
      onClick: () => handleGameClick("caca_soma", ROUTES.CACA_SOMA_RULES)
    },
    {
      pagina: "classMenu",
      label: "Cubo Mágico",
      imageSrc: `${import.meta.env.BASE_URL}3x3.png`,
      onClick: handleRubiksClick,
    },
    {
      pagina: "crownchaseRg",
      label: "Caça Coroa",
      imageSrc: `${import.meta.env.BASE_URL}cacacoroaLogo.png`,
      onClick: () => handleGameClick("caca_coroa", ROUTES.CROWN_CHASE_RULES)
    },
    {
      pagina: "spttt",
      label: "Super Jogo da Velha",
      imageSrc: `${import.meta.env.BASE_URL}sptttLogo.png`,
      onClick: () => handleGameClick("super_jogo_da_velha", ROUTES.SPTTT_RULES)
    },
    {
      pagina: "mathwarRg",
      label: "Guerra Matemática",
      imageSrc: `${import.meta.env.BASE_URL}mathwarLogo.png`,
      onClick: () => handleGameClick("guerra_matematica", ROUTES.MATH_WAR_RULES)
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

  const deleteProgress = () => {
    const confirmed = window.confirm(
      "Deletar o progresso salvo neste dispositivo? As estrelas, dificuldades liberadas, tutoriais concluídos e o nome lembrado serão apagados. As turmas online serão mantidas.",
    );

    if (!confirmed) {
      return;
    }

    try {
      const deletedCount = resetLocalPlayerProgress(window.localStorage);
      analytics.localProgressReset({ reason: "manual_delete" });
      setProgressFeedback(
        deletedCount > 0
          ? "Progresso deletado."
          : "Não havia progresso salvo neste dispositivo.",
      );
    } catch {
      setProgressFeedback("Não foi possível deletar o progresso.");
    }
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

      <div className="progressActions">
        {progressFeedback && (
          <p className="progressFeedback" role="status">
            {progressFeedback}
          </p>
        )}
        <button className="deleteProgressButton" onClick={deleteProgress} type="button">
          Deletar progresso
        </button>
      </div>
    </div>
  );
}

export default Jogos;
