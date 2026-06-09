const http = require('http');

const port = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    port: port,
    env: process.env.NODE_ENV || 'development',
    db: process.env.DATABASE_URL ? 'configured' : 'not configured'
  }));
});

server.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});
