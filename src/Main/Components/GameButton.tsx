import { useNavigate } from "react-router-dom";

interface GameButtonProps {
  pagina: string;
  label: string;
  imageSrc?: string;
  onClick?: () => void;
}

function GameButton({ pagina, label, imageSrc, onClick }: GameButtonProps) {
  const navigate = useNavigate();

  const entrarJogo = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/${pagina}`);
    }
  };

  return (
    <button onClick={entrarJogo} className="game-button">
      <div className="game-button-inner">
        <div className="game-icon-container">
          {imageSrc && <img src={imageSrc} className="game-icon" alt={label} />}
        </div>
        <span className="game-label">{label}</span>
      </div>
    </button>
  );
}

export default GameButton;