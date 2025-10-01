import StopPage from "./Stop/PageStop";
/*import StopJogo from "./Stop/JogoStop";*/
import Home from "./Main/Pages/Home";
import Jogos from "./Main/Pages/Jogos";
import Sobre from "./Main/Pages/Sobre";
import Contato from "./Main/Pages/Contato";
import JogoStop from "./Stop/RegrasStop";
import PaginaDamas from "./Damas/Pages/RegrasDamas";
import Teste from "./Main/Pages/Teste";
import SPTTT from "./SPTTT/RegrasSPTTT";
import JogoSPTTT from "./SPTTT/SPTTT";
import Pagina_Soma from "./Caca_soma/Pages/Pagina_principal";
import "./App.css";
import BaseGame from "./AA_baseGame/Pages/baseGamePage"
import { Routes, Route, useLocation, Link } from "react-router-dom";
import JogoDamas from "./Damas/Pages/JogoDamas"
import DamasRegras from "./AA_baseGame/Pages/regrasPage";
import CrownChasePage from "./CrownChase/Pages/baseGamePage";
import CrownChaseRegras from "./CrownChase/Pages/regrasPage";
import CacaSomaRegras from "./Caca_soma/Pages/Regras_CacaSoma";
import Dimensions from "./RubiksClass/Classes/Dimensions/class1";
import MathWarRegras from "./MathWar/Pages/regrasPage"
import MathWarPage from "./MathWar/Pages/baseGamePage"
import Manual from "./Main/Pages/manual"

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
        <Route path="/damas" element={<PaginaDamas />} />
        <Route path="/teste" element={<Teste />} />
        <Route path="/spttt" element={<SPTTT />} />
        <Route path="/jogospttt" element={<JogoSPTTT />} />
        <Route path="/cacaSoma" element={<Pagina_Soma />} />
        <Route path="/baseGame" element={<BaseGame />} />
        <Route path="/damasregras" element={<DamasRegras />} />
        <Route path="/crownchasePg" element={<CrownChasePage />} />
        <Route path="/crownchaseRg" element={<CrownChaseRegras />} />
        <Route path="/cacasomaRg" element={<CacaSomaRegras />} />
        <Route path="/dimensions" element={<Dimensions />} />
        <Route path="/mathwarRg" element={<MathWarRegras />} />
        <Route path="/mathwarPg" element={<MathWarPage />} />
        <Route path="/manual" element={<Manual />} />
      </Routes>
    </main>
  );
}

export default App;
