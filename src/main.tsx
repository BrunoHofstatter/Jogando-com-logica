import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
const isProd = !window.location.hostname.includes('localhost');

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter  basename={'/'}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
