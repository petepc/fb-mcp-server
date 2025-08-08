import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createGatewayServer } from './mcpServer.js';

dotenv.config();

const app = express();
app.use(morgan('tiny'));
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Health
app.get('/health', (_req, res) => {
  res.json({ service: 'PuzzleCats MCP Gateway', status: 'running', endpoints: [process.env.MCP_SSE_PATH || '/mcp', '/health'] });
});

// Static minimal connect page (placeholder for future OAuth)
app.use('/connect', express.static(path.join(__dirname, '../public')));

// SSE MCP endpoint (bearer protected)
const ssePath = process.env.MCP_SSE_PATH || '/mcp';
app.get(ssePath, async (req, res) => {
  const auth = req.header('authorization');
  const key = (process.env.MCP_ORG_KEY || '').trim();
  if (!key || !auth || !auth.toLowerCase().startsWith('bearer ') || auth.split(' ')[1] !== key) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid bearer key' });
  }
  // Attach a simple identity for per-connection routing (can be expanded later)
  const userHint = (req.header('x-user-email') || req.header('x-user-id') || 'unknown').toString();
  await createGatewayServer({ req, res, userHint });
});

const port = Number(process.env.PORT || 3001);
const host = process.env.MCP_HOST || '0.0.0.0';
app.listen(port, host, () => {
  console.log(`MCP Gateway listening on http://${host}:${port}${ssePath}`);
});