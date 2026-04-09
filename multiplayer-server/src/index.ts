import { createMultiplayerServer } from "./server.ts";

const port = Number(process.env.PORT ?? "3001");
const host = process.env.HOST ?? "0.0.0.0";

const { httpServer } = createMultiplayerServer();

httpServer.listen(port, host, () => {
  console.log(`Crown Chase multiplayer server listening on http://${host}:${port}`);
});
