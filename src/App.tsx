import StopPage from "./Stop/Pages/StopGamePage";
import Home from "./Main/Pages/Home";
import Jogos from "./Main/Pages/Jogos";
import Sobre from "./Main/Pages/Sobre";
import Contato from "./Main/Pages/Contato";
import JogoStop from "./Stop/Pages/RegrasPage";
import Teste from "./Main/Pages/Teste";
import SPTTT from "./SPTTT/Pages/RegrasSPTTT";
import JogoSPTTT from "./SPTTT/Pages/SPTTTpage";
import SPTTTAIPage from "./SPTTT/Pages/aiGamePage";
import VersusModePage from "./Caca_soma/Pages/VersusModePage";
import LevelSelectionPage from "./Caca_soma/Pages/LevelSelectionPage";
import LevelGamePage from "./Caca_soma/Pages/LevelGamePage";
// import ResultsPage from "./Caca_soma/Pages/ResultsPage";
import "./App.css";
import BaseGame from "./AA_baseGame/Pages/baseGamePage";
import RotateDeviceOverlay from "./Main/Components/RotateDeviceOverlay";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import ReactGA from "react-ga4";
import { useEffect } from "react";
import DamasRegras from "./AA_baseGame/Pages/regrasPage";
import CrownChasePage from "./CrownChase/Pages/baseGamePage";
import CrownChaseRegras from "./CrownChase/Pages/regrasPage";
import CrownChaseAIPage from "./CrownChase/Pages/aiGamePage";
import CrownChaseMultiplayerGamePage from "./CrownChase/Pages/multiplayerGamePage";
import CrownChaseMultiplayerLobbyPage from "./CrownChase/Pages/multiplayerLobbyPage";
import CacaSomaRegras from "./Caca_soma/Pages/Regras_CacaSoma";
import ClassMenu from "./RubiksClass/Classes/ClassMenu";
import Dimensions from "./RubiksClass/Classes/oldClass1/old_class1.tsx";
import CubeTestPage from "./RubiksClass/Classes/Class1_dimensions/CubeTestPage";
import Class1Dimensions from "./RubiksClass/Classes/Class1_dimensions/Class1Dimensions";
import Class2FaceArea from "./RubiksClass/Classes/Class2_faceArea/Class2FaceArea";
import MathWarRegras from "./MathWar/Pages/regrasPage";
import MathWarPage from "./MathWar/Pages/baseGamePage";
import MathWarAIPage from "./MathWar/Pages/aiGamePage";
import Manual from "./Main/Pages/manual";
import LevelsMenuPage from "./Stop/Pages/LevelsMenuPage";
import BombGameRulesPage from "./BombGame/Pages/RegrasPage";
import BombGameLevelsMenuPage from "./BombGame/Pages/LevelsMenuPage";
import BombGamePage from "./BombGame/Pages/BombGamePage";
import PuzzleWireRulesPage from "./PuzzleWire/Pages/RegrasPage";
import PuzzleWireLevelsMenuPage from "./PuzzleWire/Pages/LevelsMenuPage";
import PuzzleWirePage from "./PuzzleWire/Pages/PuzzleWirePage";
import HousesRulesPage from "./Houses/Pages/RegrasPage";
import HousesLevelsMenuPage from "./Houses/Pages/LevelsMenuPage";
import HousesPage from "./Houses/Pages/HousesPage";
import {
  hasActiveCrownChaseMultiplayerSession,
  leaveCrownChaseMultiplayerRoom,
} from "./CrownChase/Hooks/useCrownChaseMultiplayer";
import { ROUTES } from "./routes";

function trackGameTime() {
  const sessionData = localStorage.getItem("activeGameSession");
  if (sessionData) {
    try {
      const { game, startTime } = JSON.parse(sessionData);
      const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);

      ReactGA.event({
        category: "Game_Engagement",
        action: "Time_Spent_In_Game",
        label: game,
        value: timeSpentSeconds,
      });
    } catch (e) {
      console.error("Error tracking game time:", e);
    }
    localStorage.removeItem("activeGameSession");
  }
}

function BackButton() {
  const location = useLocation();

  // Don't show on homepage
  if (location.pathname === "/") return null;

  return (
    <Link to="/" onClick={trackGameTime}>
      <button className="back-button">
        <img
          src={`${import.meta.env.BASE_URL}homeButton.png`}
          className="homeButton"
        />
      </button>
    </Link>
  );
}

function App() {
  const location = useLocation();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        trackGameTime();
      }
    };

    const handleBeforeUnload = () => {
      trackGameTime();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const isCrownChaseOnlineRoute = location.pathname.startsWith(ROUTES.CROWN_CHASE_MP_LOBBY);

    if (!isCrownChaseOnlineRoute && hasActiveCrownChaseMultiplayerSession()) {
      leaveCrownChaseMultiplayerRoom({ preserveName: true });
    }
  }, [location.pathname]);

  return (
    <main>
      <RotateDeviceOverlay />
      <BackButton />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path={ROUTES.GAMES} element={<Jogos />} />
        <Route path={ROUTES.ABOUT} element={<Sobre />} />
        <Route path={ROUTES.CONTACT} element={<Contato />} />
        <Route path={ROUTES.STOP_RULES} element={<JogoStop />} />
        <Route path={ROUTES.STOP_GAME} element={<StopPage />} />
        <Route path={ROUTES.STOP_LEVELS} element={<LevelsMenuPage />} />
        <Route path={ROUTES.BOMB_GAME_RULES} element={<BombGameRulesPage />} />
        <Route path={ROUTES.BOMB_GAME_GAME} element={<BombGamePage />} />
        <Route path={ROUTES.BOMB_GAME_LEVELS} element={<BombGameLevelsMenuPage />} />
        <Route path={ROUTES.PUZZLE_WIRE_RULES} element={<PuzzleWireRulesPage />} />
        <Route path={ROUTES.PUZZLE_WIRE_GAME} element={<PuzzleWirePage />} />
        <Route path={ROUTES.PUZZLE_WIRE_LEVELS} element={<PuzzleWireLevelsMenuPage />} />
        <Route path={ROUTES.HOUSES_RULES} element={<HousesRulesPage />} />
        <Route path={ROUTES.HOUSES_GAME} element={<HousesPage />} />
        <Route path={ROUTES.HOUSES_LEVELS} element={<HousesLevelsMenuPage />} />
        <Route path={ROUTES.TEST} element={<Teste />} />
        <Route path={ROUTES.SPTTT_RULES} element={<SPTTT />} />
        <Route path={ROUTES.SPTTT_GAME} element={<JogoSPTTT />} />
        <Route path={ROUTES.SPTTT_AI} element={<SPTTTAIPage />} />
        <Route path={ROUTES.CACA_SOMA_GAME} element={<VersusModePage />} />
        <Route path={ROUTES.CACA_SOMA_LEVELS} element={<LevelSelectionPage />} />
        <Route path={ROUTES.CACA_SOMA_LEVEL_DYNAMIC} element={<LevelGamePage />} />
        <Route path={ROUTES.BASE_GAME} element={<BaseGame />} />
        <Route path={ROUTES.DAMAS_RULES_BASE} element={<DamasRegras />} />
        <Route path={ROUTES.CROWN_CHASE_GAME} element={<CrownChasePage />} />
        <Route path={ROUTES.CROWN_CHASE_RULES} element={<CrownChaseRegras />} />
        <Route path={ROUTES.CROWN_CHASE_AI} element={<CrownChaseAIPage />} />
        <Route path={ROUTES.CROWN_CHASE_MP_LOBBY} element={<CrownChaseMultiplayerLobbyPage />} />
        <Route path={ROUTES.CROWN_CHASE_MP_GAME} element={<CrownChaseMultiplayerGamePage />} />
        <Route path={ROUTES.CACA_SOMA_RULES} element={<CacaSomaRegras />} />
        <Route path={ROUTES.CLASS_1_OLD} element={<Dimensions />} />
        <Route path={ROUTES.CLASS_MENU} element={<ClassMenu />} />
        <Route path={ROUTES.MATH_WAR_RULES} element={<MathWarRegras />} />
        <Route path={ROUTES.MATH_WAR_GAME} element={<MathWarPage />} />
        <Route path={ROUTES.MATH_WAR_AI} element={<MathWarAIPage />} />
        <Route path={ROUTES.MANUAL} element={<Manual />} />
        <Route path={ROUTES.CUBE_TEST} element={<CubeTestPage />} />
        <Route path={ROUTES.CLASS_1} element={<Class1Dimensions />} />
        <Route path={ROUTES.CLASS_2} element={<Class2FaceArea />} />
      </Routes>
    </main>
  );
}

export default App;
