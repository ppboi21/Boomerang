import http from 'node:http';
import { env, validateEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { initSockets } from './sockets/index.js';
import { emailDevMode } from './services/email.js';
import { storageMode } from './services/storage.js';

validateEnv();
await connectDB(env.mongoUri);

const server = http.createServer(createApp());
initSockets(server, env.clientUrls);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n✖ Port ${env.port} is already in use. Change PORT in server/.env or stop the other program.\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(env.port, () => {
  console.log(`✔ API ready on http://localhost:${env.port}  (health: /api/health)`);
  console.log(`  Allowed frontend(s): ${env.clientUrls.join(', ')}`);
  console.log(`  College domains: ${env.collegeDomains.map((d) => '@' + d).join(', ')}`);
  if (storageMode === 'local') console.log('  ⚠ Images: saved locally in server/uploads (dev only - set CLOUDINARY_* to use Cloudinary)');
  if (emailDevMode) console.log('  ⚠ Email: DEV MODE - verification links are printed here, not emailed');
});
