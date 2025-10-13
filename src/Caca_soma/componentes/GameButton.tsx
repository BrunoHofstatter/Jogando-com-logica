import { useEffect } from "react";
import styles from "../styles/design.module.css";

interface GameButtonProps {
  clicar: boolean;
  jogar: boolean;
  gameOver: boolean;
  onStartGame: () => void;
  onSubmit?: () => void;
}

function GameButton({ clicar, jogar, gameOver, onStartGame, onSubmit }: GameButtonProps) {
  // Don't show button if game is over (Jogar de novo handles that)
  if (gameOver) {
    return null;
  }

  // Add keyboard event listener for Enter key when game is active and submit function exists
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && jogar && onSubmit) {
        event.preventDefault();
        onSubmit();
      }
    };

    if (jogar && onSubmit) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [jogar, onSubmit]);

  // Determine button text and action based on game state
  const getButtonProps = () => {
    if (!jogar && clicar) {
      // Game hasn't started yet, show start button
      return {
        text: "Começar",
        onClick: onStartGame,
        disabled: false,
        className: `${styles.gameButton} ${styles.comecarButton}`
      };
    } else if (jogar && onSubmit) {
      // Game in progress, show submit button
      return {
        text: "Enviar",
        onClick: onSubmit,
        disabled: false,
        className: `${styles.gameButton} ${styles.enviarButton}`
      };
    } else {
      // Game started but not player's turn yet
      return {
        text: "Aguardando",
        onClick: () => {},
        disabled: true,
        className: `${styles.gameButton} ${styles.waitButton}`
      };
    }
  };

  const { text, onClick, disabled, className } = getButtonProps();

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </button>
  );
}

export default GameButton;
