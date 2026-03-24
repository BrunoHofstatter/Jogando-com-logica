import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import ReactGA from "react-ga4";

ReactGA.initialize("G-BXWR3NBDQL");

const isProd = !window.location.hostname.includes('localhost');

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={'/'}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
