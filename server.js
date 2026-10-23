const http = require('http');
const next = require('next');
const path = require('path');
const fs = require('fs');

const logFile = path.join(__dirname, 'server-debug.log');
function logDebug(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(logFile, line);
  } catch {}
  console.log(msg);
}

process.env.NEXT_TELEMETRY_DISABLED = '1';

const hasBuild = fs.existsSync(path.join(__dirname, '.next', 'BUILD_ID'));
const dev = !hasBuild;
process.env.NODE_ENV = dev ? 'development' : 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

process.on('uncaughtException', (err) => {
  logDebug(`[SERVER] Uncaught Exception: ${err?.stack || err}`);
});

process.on('unhandledRejection', (reason) => {
  logDebug(`[SERVER] Unhandled Rejection: ${reason?.stack || reason}`);
});

process.on('exit', (code) => {
  logDebug(`[SERVER EXIT CODE] ${code}`);
});

process.stdin.resume();

process.on('SIGINT', () => {
  logDebug('[SERVER SIGINT]');
});

process.on('SIGTERM', () => {
  logDebug('[SERVER SIGTERM]');
});

process.on('beforeExit', (code) => {
  logDebug(`[SERVER BEFORE EXIT] ${code}`);
});

app.prepare().then(() => {
  const server = http.createServer(async (req, res) => {
    try {
      if (req.url && req.url.includes('/games/pen-fight/')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      await handle(req, res);
    } catch (err) {
      console.error('[SERVER] Request Error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }
  });

  server.listen(port, hostname, (err) => {
    if (err) {
      logDebug(`[SERVER] Listen Error: ${err}`);
      process.exit(1);
    }
    logDebug(`> [SERVER READY] Listening on http://localhost:${port} and http://${hostname}:${port}`);
  });

  // Keep process alive indefinitely with active heartbeat to avoid watchdog timeout
  setInterval(() => {
    console.log(`[HEARTBEAT ${new Date().toISOString()}] Server active on http://localhost:${port}`);
  }, 25000);
}).catch((err) => {
  console.error('[SERVER] Prepare Error:', err);
  process.exit(1);
});
