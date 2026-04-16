import path from "node:path";
import { createMultiplayerServer } from "./server.ts";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({
  path: path.resolve(currentDirectory, "../.env"),
});

const port = Number(process.env.PORT ?? "3001");
const host = process.env.HOST ?? "0.0.0.0";

const { httpServer } = createMultiplayerServer();

httpServer.listen(port, host, () => {
  console.log(`Jogando com Lógica multiplayer server listening on http://${host}:${port}`);
});
