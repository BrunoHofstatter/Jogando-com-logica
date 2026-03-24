const fs = require('fs');
const css = `
/* --- PORTRAIT MOBILE LAYOUT STRATEGY --- */
@media (orientation: portrait) and (max-width: 650px) {
    .sortPage {
        min-height: 100dvh;
        width: 100vw;
        overflow: hidden;
    }

    .bordaSort {
        border: min(1vw, 0.8dvh) solid #a11425;
        border-radius: min(12vw, 9dvh);
        padding: min(4vw, 3dvh);
        box-shadow: 0 min(1.6vw, 1.2dvh) 0 #a11425;
    }

    .divSort {
        gap: min(4vw, 3dvh);
        border: min(1vw, 0.8dvh) solid #a11425;
        border-radius: min(10vw, 7.5dvh);
        padding: min(3vw, 2dvh) min(7vw, 5dvh) min(4vw, 3dvh);
        box-shadow: 0 min(1.2vw, 0.9dvh) 0 #a11425;
    }

    .sort {
        font-size: min(12vw, 9dvh);
        -webkit-text-stroke: min(0.6vw, 0.45dvh) #a11425;
        text-shadow: 0 min(0.6vw, 0.4dvh) 0 #da9500;
        line-height: 1.1;
    }

    .numeroBox {
        border: min(0.8vw, 0.6dvh) solid #a11425;
        border-radius: min(6vw, 4.5dvh);
        padding: min(2vw, 1.5dvh) min(6vw, 4.5dvh);
        box-shadow: 0 min(1.2vw, 0.9dvh) 0 #a11425;
    }

    .numero {
        font-size: min(30vw, 22.5dvh);
        -webkit-text-stroke: min(0.8vw, 0.6dvh) #a11425;
        text-shadow: 0 min(0.8vw, 0.6dvh) 0 #da9500;
        transform: translateY(calc(-1 * min(2vw, 1.5dvh)));
    }

    /* GAME BOARD */
    .jogoStop {
        height: 100dvh;
        width: 100vw;
        padding: 0;
        overflow: hidden;
        display: block;
    }

    .stopBorder {
        display: grid;
        grid-template-rows: 15dvh 65dvh 20dvh;
        width: 100vw;
        height: 100dvh;
        padding: 0;
        border: none;
        border-radius: 0;
        background: transparent;
        position: relative;
    }

    .numMagico {
        display: contents;
    }

    .jogoStop h2 {
        position: static;
        grid-row: 1;
        grid-column: 1;
        justify-self: start;
        align-self: center;
        margin-left: min(4vw, 3dvh);
        font-size: min(10vw, 7.5dvh);
        -webkit-text-stroke: min(0.5vw, 0.4dvh) #a11425;
        text-shadow: 0 min(0.6vw, 0.45dvh) 0 #da9500;
    }

    .levelDisplay {
        position: static;
        grid-row: 1;
        grid-column: 1;
        justify-self: center;
        align-self: center;
        font-size: min(5vw, 4dvh);
        padding: min(1vw, 0.8dvh) min(3vw, 2.5dvh);
        border: min(0.6vw, 0.45dvh) solid #a11425;
        border-radius: min(3vw, 2.5dvh);
        box-shadow: 0 min(1vw, 0.8dvh) 0 #a11425;
        -webkit-text-stroke: min(0.3vw, 0.2dvh) #a11425;
    }

    .numeroCaixa {
        grid-row: 1;
        grid-column: 1;
        justify-self: end;
        align-self: center;
        margin-right: min(4vw, 3dvh);
        border: min(0.8vw, 0.6dvh) solid #a11425;
        border-radius: min(4vw, 3dvh);
        padding: min(1vw, 0.8dvh) min(3vw, 2.5dvh);
        box-shadow: 0 min(1vw, 0.8dvh) 0 #a11425;
    }

    .numeroO {
        font-size: min(12vw, 9dvh);
        -webkit-text-stroke: min(0.4vw, 0.3dvh) #a11425;
        text-shadow: 0 min(0.5vw, 0.4dvh) 0 #da9500;
        transform: translateY(calc(-1 * min(1vw, 0.8dvh)));
    }

    /* MIDDLE ROW (Scrollable Grid) */
    .tabelaWrap {
        grid-row: 2;
        grid-column: 1;
        height: 100%;
        overflow-y: auto;
        padding-bottom: min(4vw, 3dvh);
    }
    
    .tabela {
        grid-template-columns: repeat(2, 1fr) !important;
        width: 90vw;
        margin: 0 auto;
        column-gap: min(4vw, 3dvh);
        row-gap: min(4vw, 3dvh);
    }

    /* CALCULATION CELLS */
    .header, .headerDual {
        border: min(0.6vw, 0.4dvh) solid #a11425;
        border-radius: min(1.5vw, 1.2dvh);
        font-size: min(6vw, 4.5dvh);
        -webkit-text-stroke: min(0.3vw, 0.25dvh) #a11425;
        box-shadow: 0 min(0.8vw, 0.6dvh) 0 #a11425;
        margin-bottom: min(1vw, 0.8dvh);
    }

    .cellBorder {
        border: min(0.6vw, 0.4dvh) solid #a11425;
        border-radius: min(2vw, 1.5dvh);
        padding: min(1.5vw, 1.2dvh);
        box-shadow: 0 min(1vw, 0.8dvh) 0 #a11425;
    }

    .inputCell {
        font-size: min(6vw, 4.5dvh);
        border: min(0.6vw, 0.4dvh) solid #a11425;
        border-radius: min(1.5vw, 1.2dvh);
        padding: min(2vw, 1.5dvh) 0 min(2vw, 1.5dvh) min(1vw, 0.8dvh);
        box-shadow: inset 0 min(0.6vw, 0.4dvh) 0 #00000018;
    }

    .feedback {
        position: static;
        width: 100%;
        margin-top: min(1vw, 0.8dvh);
        justify-content: center;
        align-items: center;
    }

    .check, .xmark {
        width: min(8vw, 6dvh);
        height: min(8vw, 6dvh);
    }

    .correction {
        font-size: min(6vw, 4.5dvh);
        -webkit-text-stroke: min(0.3vw, 0.2dvh) #080303;
        bottom: 0;
        height: auto;
    }
    
    .iconStack {
        width: min(8vw, 6dvh);
        height: min(8vw, 6dvh);
        position: relative;
    }

    /* BOTTOM ROW */
    .pararJogo {
        grid-row: 3;
        grid-column: 1;
        justify-self: center;
        align-self: center;
        width: 80vw;
        height: min(18vw, 13dvh);
        font-size: min(10vw, 7.5dvh);
        border: min(0.8vw, 0.6dvh) solid #a11425;
        border-radius: min(8vw, 6dvh);
        -webkit-text-stroke: min(0.4vw, 0.3dvh) #a11425;
        box-shadow: 0 min(1.6vw, 1.2dvh) 0 #a11425;
        margin-bottom: min(3vw, 2.5dvh);
        z-index: 10;
        position: static;
    }

    .resetButton {
        position: static;
        grid-row: 3;
        grid-column: 1;
        justify-self: end;
        align-self: end;
        margin-right: min(4vw, 3dvh);
        margin-bottom: min(4vw, 3dvh);
        font-size: min(4vw, 3dvh);
        padding: min(1vw, 0.8dvh) min(3vw, 2.5dvh);
        border: min(0.6vw, 0.4dvh) solid #a11425;
        border-radius: min(3vw, 2.5dvh);
        box-shadow: 0 min(1vw, 0.8dvh) 0 #a11425;
        -webkit-text-stroke: min(0.2vw, 0.15dvh) #a11425;
    }

    .finalResultado {
        grid-row: 3;
        grid-column: 1;
        justify-self: center;
        align-self: center;
        width: 80vw;
        max-width: none;
        font-size: min(5vw, 4dvh);
        border: min(0.8vw, 0.6dvh) solid #a11425;
        border-radius: min(8vw, 6dvh);
        padding: min(3vw, 2dvh) min(6vw, 4dvh);
        box-shadow: 0 min(1.2vw, 0.9dvh) 0 #a11425;
        -webkit-text-stroke: min(0.2vw, 0.15dvh) #a11425;
        position: static;
    }
}
\n\n`;
fs.appendFileSync('c:/Users/bruno/Projeto Jogando com lógica/Jogando-com-logica/src/Stop/styles/StopGame.module.css', css);
