const fs = require('fs');
const path = 'c:/Users/bruno/Projeto Jogando com lógica/Jogando-com-logica/src/Stop/Components/GameBoard.tsx';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

content = content.replace(
  `        </div>

        <button onClick={handleRetry} className={styles.resetButton}>
          Reiniciar
        </button>
      </div>`,
  `        </div>
      </div>`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Button removed successfully!");
