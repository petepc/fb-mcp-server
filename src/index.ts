#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamable.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { initializeFirebase, firebaseTools, handleFirebaseTool } from './firebase.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    service: 'Firebase MCP Server', 
    status: 'running',
    version: '1.0.0'
  });
});

// MCP Server setup
const server = new Server(
  {
    name: 'firebase-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: firebaseTools,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return await handleFirebaseTool(request);
});

// MCP endpoint using Streamable HTTP transport
app.post('/mcp', async (req, res) => {
  // Basic auth check (use environment variable for API key)
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.MCP_API_KEY;
  
  if (expectedKey && (!authHeader || authHeader !== `Bearer ${expectedKey}`)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const transport = new StreamableHTTPServerTransport(req, res);
    await server.connect(transport);
  } catch (error) {
    console.error('MCP connection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function main() {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  
  try {
    // Initialize Firebase with either file path or JSON string
    if (serviceAccountJson) {
      initializeFirebase(undefined, serviceAccountJson);
    } else {
      initializeFirebase(serviceAccountPath);
    }
    
    console.log('Firebase MCP Server initialized');
    
    const port = parseInt(process.env.PORT || '3000');
    app.listen(port, '0.0.0.0', () => {
      console.log(`Firebase MCP Server running on port ${port}`);
      console.log(`Health check: http://localhost:${port}/health`);
      console.log(`MCP endpoint: http://localhost:${port}/mcp`);
    });
  } catch (error) {
    console.error('Failed to start Firebase MCP Server:', error);
    process.exit(1);
  }
}

main().catch(console.error);