const fs = require('fs');
const path = 'c:/Users/bruno/Projeto Jogando com lógica/Jogando-com-logica/src/Stop/Components/GameBoard.tsx';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// Target 1
content = content.replace(
    '{/* Magic number display and STOP button */}',
    `{/* Level Display */}
        {levelConfig && (
            <div className={styles.levelDisplay}>
              Nível: {levelConfig.id}
            </div>
        )}

        {/* Magic number display and STOP button */}`
);

// Target 2
content = content.replace(
    `            )}
          </div>
        </div>
      </div>

      {/* Virtual Keyboard */}`,
    `            )}
          </div>
        </div>

        <button onClick={handleRetry} className={styles.resetButton}>
          Reiniciar
        </button>
      </div>

      {/* Virtual Keyboard */}`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Replaced successfully!");
