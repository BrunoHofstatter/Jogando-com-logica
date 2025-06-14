import { useState } from "react";
import "../CSS/form.css"

export default function CustomFeedbackForm() {
  const [formData, setFormData] = useState({
    nome: "",
    idade: "",
    comoConheceu: "",
    maisGostou: "",
    melhorar: "",
    jogoBugado: "",
    mensagem: "",
    nota: ""
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await fetch("https://script.google.com/macros/s/AKfycbwbWoE0fvFX7YY23nhthasnPdk_HLdDRnFZs6FUZDAcGaXDYyI23_VvMjj71uLfeCmNlg/exec", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    nome: formData.nome,
    idade: formData.idade,
    comoConheceu: formData.comoConheceu,
    maisGostou: formData.maisGostou,
    melhorar: formData.melhorar,
    jogoBugado: formData.jogoBugado,
    mensagem: formData.mensagem,
    nota: formData.nota
  }),
});

    const result = await response.json();
    if (result.status === true) {
      alert("Feedback enviado com sucesso!");
      setFormData({
        nome: "",
        idade: "",
        comoConheceu: "",
        maisGostou: "",
        melhorar: "",
        jogoBugado: "",
        mensagem: "",
        nota: ""
      });
    } else {
      alert("Algo deu errado ao enviar o formulário.");
    }
  } catch (error) {
    console.error("Erro ao enviar:", error);
    alert("Erro de conexão ao enviar o formulário.");
  }
};

  return (
    <div className="form-wrapper">
      <h2 className="form-title">Formulário de Feedback</h2>
      <form autoComplete="off" onSubmit={handleSubmit} className="feedback-form">

        <div className="topRow">
            <label>
              Nome:
              <input type="text" name="nome" onChange={handleChange} />
            </label>
            <label>
              Idade:
              <input type="number" name="idade" onChange={handleChange}  />
            </label>
        </div>

        <label>
          Como você conheceu o projeto?
          <input name="comoConheceu" onChange={handleChange}  />
        </label>

        <label>
          O que você mais gostou?
          <input name="maisGostou" onChange={handleChange}  />
        </label>

        <label>
          O que poderia melhorar?
          <input name="melhorar" onChange={handleChange} />
        </label>

        <label>
          Tem algum jogo que não está funcionando direito?
          <input name="jogoBugado" onChange={handleChange} />
        </label>

        <label>
          Algo que queira nos falar?
          <input name="mensagem" onChange={handleChange} />
        </label>

        <label>
          Se você fosse dar uma nota para o site de 1 a 10, qual seria?
          <input type="number" name="nota" min="1" max="10" onChange={handleChange}  />
        </label>

        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}