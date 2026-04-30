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
import SPTTTMultiplayerGamePage from "./SPTTT/Pages/multiplayerGamePage";
import SPTTTMultiplayerLobbyPage from "./SPTTT/Pages/multiplayerLobbyPage";
import VersusModePage from "./Caca_soma/Pages/VersusModePage";
import LevelSelectionPage from "./Caca_soma/Pages/LevelSelectionPage";
import LevelGamePage from "./Caca_soma/Pages/LevelGamePage";
import CacaSomaMultiplayerLobbyPage from "./Caca_soma/Pages/multiplayerLobbyPage";
import CacaSomaMultiplayerGamePage from "./Caca_soma/Pages/multiplayerGamePage";
// import ResultsPage from "./Caca_soma/Pages/ResultsPage";
import "./App.css";
import BaseGame from "./AA_baseGame/Pages/baseGamePage";
import RotateDeviceOverlay from "./Main/Components/RotateDeviceOverlay";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
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
import MathWarMultiplayerGamePage from "./MathWar/Pages/multiplayerGamePage";
import MathWarMultiplayerLobbyPage from "./MathWar/Pages/multiplayerLobbyPage";
import Manual from "./Main/Pages/manual";
import LevelsMenuPage from "./Stop/Pages/LevelsMenuPage";
import StopMultiplayerGamePage from "./Stop/Pages/multiplayerGamePage";
import StopMultiplayerLobbyPage from "./Stop/Pages/multiplayerLobbyPage";
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
  hasActiveCacaSomaMultiplayerSession,
  leaveCacaSomaMultiplayerRoom,
} from "./Caca_soma/Hooks/useCacaSomaMultiplayer";
import {
  hasActiveCrownChaseMultiplayerSession,
  leaveCrownChaseMultiplayerRoom,
} from "./CrownChase/Hooks/useCrownChaseMultiplayer";
import {
  hasActiveMathWarMultiplayerSession,
  leaveMathWarMultiplayerRoom,
} from "./MathWar/Hooks/useMathWarMultiplayer";
import {
  hasActiveStopMultiplayerSession,
  leaveStopMultiplayerRoom,
} from "./Stop/Hooks/useStopMultiplayer";
import {
  hasActiveSPTTTMultiplayerSession,
  leaveSPTTTMultiplayerRoom,
} from "./SPTTT/Hooks/useSPTTTMultiplayer";
import { ROUTES } from "./routes";

const HIDDEN_RETURN_ROUTES = new Set([
  ROUTES.HOME,
  ROUTES.GAMES,
  ROUTES.ABOUT,
  ROUTES.CONTACT,
  ROUTES.MANUAL,
]);

const RETURN_ROUTE_MAP: Record<string, string> = {
  [ROUTES.TEST]: ROUTES.HOME,
  [ROUTES.STOP_RULES]: ROUTES.GAMES,
  [ROUTES.STOP_GAME]: ROUTES.STOP_RULES,
  [ROUTES.STOP_LEVELS]: ROUTES.STOP_RULES,
  [ROUTES.STOP_MP_LOBBY]: ROUTES.STOP_RULES,
  [ROUTES.STOP_MP_GAME]: ROUTES.STOP_MP_LOBBY,
  [ROUTES.BOMB_GAME_RULES]: ROUTES.GAMES,
  [ROUTES.BOMB_GAME_GAME]: ROUTES.BOMB_GAME_RULES,
  [ROUTES.BOMB_GAME_LEVELS]: ROUTES.BOMB_GAME_RULES,
  [ROUTES.PUZZLE_WIRE_RULES]: ROUTES.GAMES,
  [ROUTES.PUZZLE_WIRE_GAME]: ROUTES.PUZZLE_WIRE_RULES,
  [ROUTES.PUZZLE_WIRE_LEVELS]: ROUTES.PUZZLE_WIRE_RULES,
  [ROUTES.HOUSES_RULES]: ROUTES.GAMES,
  [ROUTES.HOUSES_GAME]: ROUTES.HOUSES_RULES,
  [ROUTES.HOUSES_LEVELS]: ROUTES.HOUSES_RULES,
  [ROUTES.SPTTT_RULES]: ROUTES.GAMES,
  [ROUTES.SPTTT_GAME]: ROUTES.SPTTT_RULES,
  [ROUTES.SPTTT_AI]: ROUTES.SPTTT_RULES,
  [ROUTES.SPTTT_MP_LOBBY]: ROUTES.SPTTT_RULES,
  [ROUTES.SPTTT_MP_GAME]: ROUTES.SPTTT_MP_LOBBY,
  [ROUTES.CACA_SOMA_RULES]: ROUTES.GAMES,
  [ROUTES.CACA_SOMA_GAME]: ROUTES.CACA_SOMA_RULES,
  [ROUTES.CACA_SOMA_MP_LOBBY]: ROUTES.CACA_SOMA_RULES,
  [ROUTES.CACA_SOMA_MP_GAME]: ROUTES.CACA_SOMA_MP_LOBBY,
  [ROUTES.CACA_SOMA_LEVELS]: ROUTES.CACA_SOMA_RULES,
  [ROUTES.DAMAS_RULES_BASE]: ROUTES.GAMES,
  [ROUTES.BASE_GAME]: ROUTES.DAMAS_RULES_BASE,
  [ROUTES.CROWN_CHASE_RULES]: ROUTES.GAMES,
  [ROUTES.CROWN_CHASE_GAME]: ROUTES.CROWN_CHASE_RULES,
  [ROUTES.CROWN_CHASE_AI]: ROUTES.CROWN_CHASE_RULES,
  [ROUTES.CROWN_CHASE_MP_LOBBY]: ROUTES.CROWN_CHASE_RULES,
  [ROUTES.CROWN_CHASE_MP_GAME]: ROUTES.CROWN_CHASE_MP_LOBBY,
  [ROUTES.CLASS_MENU]: ROUTES.GAMES,
  [ROUTES.CLASS_1_OLD]: ROUTES.CLASS_MENU,
  [ROUTES.CLASS_1]: ROUTES.CLASS_MENU,
  [ROUTES.CLASS_2]: ROUTES.CLASS_MENU,
  [ROUTES.CUBE_TEST]: ROUTES.CLASS_MENU,
  [ROUTES.MATH_WAR_RULES]: ROUTES.GAMES,
  [ROUTES.MATH_WAR_GAME]: ROUTES.MATH_WAR_RULES,
  [ROUTES.MATH_WAR_AI]: ROUTES.MATH_WAR_RULES,
  [ROUTES.MATH_WAR_MP_LOBBY]: ROUTES.MATH_WAR_RULES,
  [ROUTES.MATH_WAR_MP_GAME]: ROUTES.MATH_WAR_MP_LOBBY,
};

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

function getReturnRoute(pathname: string): string | null {
  if (HIDDEN_RETURN_ROUTES.has(pathname)) {
    return null;
  }

  if (pathname.startsWith(`${ROUTES.CACA_SOMA_LEVELS}/`)) {
    return ROUTES.CACA_SOMA_LEVELS;
  }

  return RETURN_ROUTE_MAP[pathname] ?? ROUTES.GAMES;
}

function HomeButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on homepage
  if (location.pathname === "/") return null;

  return (
    <button
      className="back-button"
      onClick={() => {
        trackGameTime();
        navigate(ROUTES.HOME);
      }}
      aria-label="Ir para a página inicial"
      type="button"
    >
      <img
        src={`${import.meta.env.BASE_URL}homeButton.png`}
        className="homeButton"
        alt=""
      />
    </button>
  );
}

function ReturnButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnRoute = getReturnRoute(location.pathname);

  if (!returnRoute) {
    return null;
  }

  return (
    <button
      className="universal-return-button"
      onClick={() => {
        trackGameTime();
        navigate(returnRoute);
      }}
      aria-label="Voltar"
      type="button"
    >
      <span aria-hidden="true">{"<"}</span>
    </button>
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
    const isMathWarOnlineRoute = location.pathname.startsWith(ROUTES.MATH_WAR_MP_LOBBY);
    const isStopOnlineRoute = location.pathname.startsWith(ROUTES.STOP_MP_LOBBY);
    const isSPTTTOnlineRoute = location.pathname.startsWith(ROUTES.SPTTT_MP_LOBBY);
    const isCacaSomaOnlineRoute = location.pathname.startsWith(ROUTES.CACA_SOMA_MP_LOBBY);

    if (!isCrownChaseOnlineRoute && hasActiveCrownChaseMultiplayerSession()) {
      leaveCrownChaseMultiplayerRoom({ preserveName: true });
    }

    if (!isMathWarOnlineRoute && hasActiveMathWarMultiplayerSession()) {
      leaveMathWarMultiplayerRoom({ preserveName: true });
    }

    if (!isStopOnlineRoute && hasActiveStopMultiplayerSession()) {
      leaveStopMultiplayerRoom({ preserveName: true });
    }

    if (!isSPTTTOnlineRoute && hasActiveSPTTTMultiplayerSession()) {
      leaveSPTTTMultiplayerRoom({ preserveName: true });
    }

    if (!isCacaSomaOnlineRoute && hasActiveCacaSomaMultiplayerSession()) {
      leaveCacaSomaMultiplayerRoom({ preserveName: true });
    }
  }, [location.pathname]);

  return (
    <main>
      <RotateDeviceOverlay />
      <ReturnButton />
      <HomeButton />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path={ROUTES.GAMES} element={<Jogos />} />
        <Route path={ROUTES.ABOUT} element={<Sobre />} />
        <Route path={ROUTES.CONTACT} element={<Contato />} />
        <Route path={ROUTES.STOP_RULES} element={<JogoStop />} />
        <Route path={ROUTES.STOP_GAME} element={<StopPage />} />
        <Route path={ROUTES.STOP_LEVELS} element={<LevelsMenuPage />} />
        <Route path={ROUTES.STOP_MP_LOBBY} element={<StopMultiplayerLobbyPage />} />
        <Route path={ROUTES.STOP_MP_GAME} element={<StopMultiplayerGamePage />} />
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
        <Route path={ROUTES.SPTTT_MP_LOBBY} element={<SPTTTMultiplayerLobbyPage />} />
        <Route path={ROUTES.SPTTT_MP_GAME} element={<SPTTTMultiplayerGamePage />} />
        <Route path={ROUTES.CACA_SOMA_GAME} element={<VersusModePage />} />
        <Route path={ROUTES.CACA_SOMA_MP_LOBBY} element={<CacaSomaMultiplayerLobbyPage />} />
        <Route path={ROUTES.CACA_SOMA_MP_GAME} element={<CacaSomaMultiplayerGamePage />} />
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
        <Route path={ROUTES.MATH_WAR_MP_LOBBY} element={<MathWarMultiplayerLobbyPage />} />
        <Route path={ROUTES.MATH_WAR_MP_GAME} element={<MathWarMultiplayerGamePage />} />
        <Route path={ROUTES.MANUAL} element={<Manual />} />
        <Route path={ROUTES.CUBE_TEST} element={<CubeTestPage />} />
        <Route path={ROUTES.CLASS_1} element={<Class1Dimensions />} />
        <Route path={ROUTES.CLASS_2} element={<Class2FaceArea />} />
      </Routes>
    </main>
  );
}

export default App;
