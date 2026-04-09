# Crown Chase Multiplayer Server

This service hosts private-room online multiplayer for Crown Chase.

## Local development

1. Create a local env file from `.env.example`.
2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm run dev
```

4. Health check:

```text
http://localhost:3001/health
```

## Render deployment

This repo includes a root-level [render.yaml](/C:/Users/bruno/Projeto Jogando com lógica/Jogando-com-logica/render.yaml) that deploys the server from `multiplayer-server/`.

### Required Render settings

- Service type: `Web Service`
- Runtime: `Node`
- Root directory: `multiplayer-server`
- Build command: `npm install`
- Start command: `npm run start`
- Health check path: `/health`

### Required environment variables

- `CLIENT_ORIGINS`
  Example:

```text
https://jogandocomlogica.com,https://www.jogandocomlogica.com
```

Optional:

- `HOST=0.0.0.0`
- `PORT` is provided by Render automatically

## Frontend deployment

After Render creates the public backend URL, set the frontend env before deploying the site:

```env
VITE_MULTIPLAYER_SERVER_URL=https://your-render-service.onrender.com
```

Then rebuild and redeploy the frontend.
