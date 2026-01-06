import React, { useState } from "react";
import styles from "./class2.module.css";
import hintStyles from "./class2Hint.module.css";
import Hint from "../../Components/hintButton";
import { CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

type CubeSize = "2x2" | "3x3" | "4x4" | "5x5" | "6x6";

interface Cube {
  id: number;
  size: CubeSize;
}

const Class2: React.FC = () => {
  const navigate = useNavigate();
  const [score, setScore] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [corrections, setCorrections] = useState<boolean[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>(["", "", "", "", ""]);

  const goToNextClass = () => {
    navigate("/class2"); // Adjust the path based on your routing
  };

  // Function to get image path based on cube size
  const getCubeImage = (size: CubeSize) => {
    return `${import.meta.env.BASE_URL}${size}.png`;
  };

  // Fixed array of cubes in order
  const cubes: Cube[] = [
    { id: 1, size: "2x2" },
    { id: 2, size: "3x3" },
    { id: 3, size: "4x4" },
    { id: 4, size: "5x5" },
    { id: 5, size: "6x6" },
  ];

  // Get the correct answer for a cube (size squared)
  const getCorrectAnswer = (size: CubeSize): number => {
    const dimension = parseInt(size.split('x')[0]);
    return dimension * dimension;
  };

  // Handle input change
  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      const newAnswers = [...userAnswers];
      newAnswers[index] = value;
      setUserAnswers(newAnswers);
    }
  };

  // Check answers and calculate score
  const checkAnswers = () => {
    setIsChecking(true);

    let correct = 0;
    const correctionResults: boolean[] = cubes.map((cube, index) => {
      const userAnswer = parseInt(userAnswers[index]);
      const correctAnswer = getCorrectAnswer(cube.size);
      const isCorrect = userAnswer === correctAnswer;
      if (isCorrect) correct++;
      return isCorrect;
    });

    setCorrections(correctionResults);
    const calculatedScore = (correct / cubes.length) * 100;
    setScore(calculatedScore);
  };

  // Reset the game
  const resetGame = () => {
    setUserAnswers(["", "", "", "", ""]);
    setScore(null);
    setIsChecking(false);
    setCorrections([]);
  };

  // Get score message
  const getScoreMessageE = () => {
    if (score === null) return "";
    if (score === 100) return "🎉";
    if (score >= 80) return "👏";
    if (score >= 60) return "👍";
    return "💪";
  };
  const getScoreMessage = () => {
    if (score === null) return "";
    if (score >= 80) return "Excelente!";
    if (score >= 60) return "Muito Bem!";
    return "Tente de novo!";
  };
  // Create hints with images
  const hint1Content = (
    <div>
      <p>Lembre da altura e largura de cada cubo</p>
    </div>
  );

  const hint2Content = (
    <div>
      <p>
        O cubo 3x3 tem 3 linhas com 3 quadradinhos em cada. 3 grupos com 3
      </p>
      <img
        src={getCubeImage("3x3")}
        alt="3x3 Rubik's Cube"
        className={styles.hintImage}
      />
    </div>
  );

  const hint3Content = (
    <div>
      <p>Em cada cubo, faça a altura vezes a largura</p>
    </div>
  );

  const hint4Content = (
    <div>
      <p>No cubo 2x2, faça 2 vezes 2, que é igual a 4</p>
      <img
        src={getCubeImage("2x2")}
        alt="2x2 Rubik's Cube"
        className={styles.hintImage}
      />
    </div>
  );

  const hint5Content = (
    <div>
      <p><strong>Cubo 3x3:</strong> 3 vezes 3 = 9 quadradinhos</p>
      <img
        src={getCubeImage("3x3")}
        alt="3x3 Rubik's Cube"
        className={styles.hintImage}
      />
      <p><strong>Cubo 4x4:</strong> 4 vezes 4 = 16 quadradinhos</p>
      <img
        src={getCubeImage("4x4")}
        alt="4x4 Rubik's Cube"
        className={styles.hintImage}
      />
      <p><strong>Cubo 5x5:</strong> 5 vezes 5 = 25 quadradinhos</p>
      <img
        src={getCubeImage("5x5")}
        alt="5x5 Rubik's Cube"
        className={styles.hintImage}
      />
      <p><strong>Cubo 6x6:</strong> 6 vezes 6 = 36 quadradinhos</p>
      <img
        src={getCubeImage("6x6")}
        alt="6x6 Rubik's Cube"
        className={styles.hintImage}
      />
    </div>
  );

  return (
    <>
      <div className={styles.container}>
        <div className={styles.menuButtonContainer}>
          <button
            onClick={() => navigate("/classMenu")}
            className={styles.menuButton}
          >
            Aulas
          </button>
        </div>
        <h2>Área das Faces do Cubo</h2>
        <h3>Descubra quantos quadradinhos tem em um lado do cubo</h3>

        <Hint
          title="Dicas: Área das Faces"
          hint1={hint1Content}
          hint2={hint2Content}
          hint3={hint3Content}
          hint4={hint4Content}
          hint5={hint5Content}
          styleFile={hintStyles}
        />

        {/* Score display at top when checking */}
        {isChecking && score !== null && (
          <div className={styles.scoreContainer}>
            <div className={styles.scoreRow}>
              <div className={styles.scoreText}>
                <div className={styles.scoreTitle}>{getScoreMessage()}</div>
                <div className={styles.scoreDisplay}>
                  {score !== null ? `${Math.round(score / 20)}/5` : "0/5"} -{" "}
                  {getScoreMessageE()}
                </div>
              </div>
              <button onClick={resetGame} className={styles.resetButton}>
                Tentar de novo
              </button>
            </div>
          </div>
        )}

        {/* Cubes with input boxes */}
        <div className={styles.cubesContainer}>
          {cubes.map((cube, index) => (
            <div key={cube.id} className={styles.cubeWithInput}>
              <div className={styles.cubeImageWrapper}>
                <img
                  src={getCubeImage(cube.size)}
                  alt={`${cube.size} Rubik's Cube`}
                  className={styles.cubeImg}
                />
              </div>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={userAnswers[index]}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  placeholder="Escreva aqui"
                  className={styles.inputBox}
                  disabled={isChecking}
                />
                {/* Correction indicators */}
                {isChecking && (
                  <div className={styles.correctionIndicator}>
                    {corrections[index] ? (
                      <div className={styles.iconStack}>
                        <CheckCircle
                          className={styles.check}
                          strokeWidth={4}
                          color="black"
                        />
                        <CheckCircle
                          className={styles.check}
                          strokeWidth={1.5}
                          color="#0fb11d"
                        />
                      </div>
                    ) : (
                      <div className={styles.iconStack}>
                        <XCircle
                          className={styles.xmark}
                          strokeWidth={4}
                          color="black"
                        />
                        <XCircle
                          className={styles.xmark}
                          strokeWidth={1.5}
                          color="#f02121"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!isChecking && (
          <div className={styles.submitContainer}>
            <button
              onClick={checkAnswers}
              className={styles.submitButton}
              disabled={userAnswers.some((answer) => answer === "")}
            >
              Corrigir
            </button>
          </div>
        )}
        {isChecking && (
          <div className={styles.submitContainer}>
            <button
              onClick={goToNextClass}
              className={styles.nextButton}
            >
              Próximo
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default Class2;
