import "../CSS/Contato.css";
import { useEffect } from "react";
import Form from "../Components/form";

function Contato() {
  useEffect(() => {
    document.body.style.backgroundColor = "#68c2e0";
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", "#68c2e0");
  }, []);

  return <section className="contato">
    <h2>Contato</h2>
    <h3 className="contText">
      Se você quiser entrar em contato com a gente, pode usar o nosso e-mail ou Instagram abaixo — ou, se preferir, envie seu feedback preenchendo o formulário logo abaixo!
    </h3>
    <p>
      <strong>Email:</strong> jogandocomlogica@gmail.com<br />
      <strong>Instagram:</strong>{" "}
      <a href="https://instagram.com/jogandocomlogica" target="_blank">
        @jogandocomlogica
      </a>
    </p>

    <div className="feedbackButtonContainer">
      <button
        className="feedbackButton"
        onClick={() =>
          window.open(
            'https://docs.google.com/forms/d/e/1FAIpQLSc6W0uOiy5uYFGhjVjqzS3Iw6mp_VzHSi5qNkfnTuqS0dffOQ/viewform?embedded=true',
            '_blank'
          )
        }
      >
        Formulário de feedback para professores
      </button>
    </div>

    <div className="formBox">
      {/*<iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLSc3EG0F9zWgaMV9wXa8MAIVKCvnfZDMSy-cIm7o5-JV9pkt0w/viewform?embedded=true"
          width="100%"
          height="800"
          loading="lazy"
          title="Formulário de Feedback"
        >
          Carregando…
        </iframe>*/}
      <Form />
    </div>
  </section>

}

export default Contato;