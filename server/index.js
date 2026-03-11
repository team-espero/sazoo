import { getRuntime } from './runtime.js';

const { app, serverEnv } = getRuntime();

app.listen(serverEnv.port, () => {
  console.log(`[server] listening on http://localhost:${serverEnv.port}`);
  console.log(`[server] api prefix: ${serverEnv.apiPrefix}`);
});
