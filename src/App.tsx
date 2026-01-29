import StopPage from "./Stop/Pages/StopGamePage";
import Home from "./Main/Pages/Home";
import Jogos from "./Main/Pages/Jogos";
import Sobre from "./Main/Pages/Sobre";
import Contato from "./Main/Pages/Contato";
import JogoStop from "./Stop/Pages/RegrasPage";
import PaginaDamas from "./Damas/Pages/RegrasDamas";
import Teste from "./Main/Pages/Teste";
import SPTTT from "./SPTTT/Pages/RegrasSPTTT";
import JogoSPTTT from "./SPTTT/Pages/SPTTTpage";
import SPTTTAIPage from "./SPTTT/Pages/aiGamePage";
import VersusModePage from "./Caca_soma/Pages/VersusModePage";
import LevelSelectionPage from "./Caca_soma/Pages/LevelSelectionPage";
import LevelGamePage from "./Caca_soma/Pages/LevelGamePage";
// import ResultsPage from "./Caca_soma/Pages/ResultsPage";
import "./App.css";
import BaseGame from "./AA_baseGame/Pages/baseGamePage"
import { Routes, Route, useLocation, Link } from "react-router-dom";
import JogoDamas from "./Damas/Pages/JogoDamas"
import DamasRegras from "./AA_baseGame/Pages/regrasPage";
import CrownChasePage from "./CrownChase/Pages/baseGamePage";
import CrownChaseRegras from "./CrownChase/Pages/regrasPage";
import CrownChaseAIPage from "./CrownChase/Pages/aiGamePage";
import CacaSomaRegras from "./Caca_soma/Pages/Regras_CacaSoma";
import ClassMenu from "./RubiksClass/Classes/ClassMenu";
import Dimensions from "./RubiksClass/Classes/Dimensions/class1";
import MathWarRegras from "./MathWar/Pages/regrasPage"
import MathWarPage from "./MathWar/Pages/baseGamePage"
import MathWarAIPage from "./MathWar/Pages/aiGamePage"
import Manual from "./Main/Pages/manual"
import LevelsMenuPage from "./Stop/Pages/LevelsMenuPage";
import Class2 from "./RubiksClass/Classes/FaceArea/class2.tsx"

function BackButton() {
  const location = useLocation();

  // Don't show on homepage
  if (location.pathname === "/") return null;

  return (
    <Link to="/">
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
  return (
    <main>
      <BackButton />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jogodamas" element={<JogoDamas />} />
        <Route path="/jogos" element={<Jogos />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/jogoStop" element={<JogoStop />} />
        <Route path="/stoppage" element={<StopPage />} />
        <Route path="/stop-levels" element={<LevelsMenuPage />} />
        <Route path="/damas" element={<PaginaDamas />} />
        <Route path="/teste" element={<Teste />} />
        <Route path="/spttt" element={<SPTTT />} />
        <Route path="/jogospttt" element={<JogoSPTTT />} />
        <Route path="/spttt-ai" element={<SPTTTAIPage />} />
        <Route path="/cacaSoma" element={<VersusModePage />} />
        <Route path="/cacaSomaNiveis" element={<LevelSelectionPage />} />
        <Route path="/cacaSomaNivel/:levelId" element={<LevelGamePage />} />
        {/* <Route path="/cacaSomaResultado" element={<ResultsPage />} /> */}
        <Route path="/baseGame" element={<BaseGame />} />
        <Route path="/damasregras" element={<DamasRegras />} />
        <Route path="/crownchasePg" element={<CrownChasePage />} />
        <Route path="/crownchaseRg" element={<CrownChaseRegras />} />
        <Route path="/crownchase-ai" element={<CrownChaseAIPage />} />
        <Route path="/cacasomaRg" element={<CacaSomaRegras />} />
        <Route path="/dimensions" element={<Dimensions />} />
        <Route path="/classMenu" element={<ClassMenu />} />
        <Route path="/mathwarRg" element={<MathWarRegras />} />
        <Route path="/mathwarPg" element={<MathWarPage />} />
        <Route path="/mathwar-ai" element={<MathWarAIPage />} />
        <Route path="/manual" element={<Manual />} />
        <Route path="/class2" element={<Class2 />} />
      </Routes>
    </main>
  );
}

export default App;
