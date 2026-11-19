import http from 'node:http';
import env from './config/env.js';
import { connectDatabase } from './config/db.js';
import { createApp } from './app.js';
import { initSocketServer } from './sockets/index.js';

async function start() {
  await connectDatabase();
  const app = createApp();
  const server = http.createServer(app);
  initSocketServer(server);

  server.listen(env.port, () => {
    console.log(`CampusQuest API listening on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start CampusQuest API:', error);
  process.exit(1);
});
