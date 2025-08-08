import { Server as McpServer, Tool, TextContent } from '@modelcontextprotocol/sdk';
import type { IncomingMessage, ServerResponse } from 'http';
import { slackTools } from './providers/slack.js';
import { githubTools } from './providers/github.js';
import { linearTools } from './providers/linear.js';
import { sentryTools } from './providers/sentry.js';
import { hubspotTools } from './providers/hubspot.js';

export async function createGatewayServer({ req, res, userHint }: { req: IncomingMessage; res: ServerResponse; userHint: string; }) {
  const server = new McpServer({ name: 'puzzlecats-mcp-gateway', version: '0.1.0' });

  // Register tools from providers
  const tools: Tool[] = [
    ...slackTools(userHint),
    ...githubTools(userHint),
    ...linearTools(userHint),
    ...sentryTools(userHint),
    ...hubspotTools(userHint),
    // Meta tool: project pulse across sources (basic draft)
    {
      name: 'pulse_merge_clash',
      description: 'Cross-source project pulse for Merge Clash over a time window',
      inputSchema: {
        type: 'object',
        properties: {
          windowDays: { type: 'number', default: 14 },
          query: { type: 'string', default: 'Merge Clash' }
        }
      },
      handler: async ({ windowDays = 14, query = 'Merge Clash' }) => {
        const parts: string[] = [];
        parts.push(`# Merge Clash — Project Pulse (last ${windowDays} days)`);
        parts.push((await slackTools(userHint)[0].handler({ query, days: windowDays })).content[0].text || '');
        // In a real build you’d aggregate all providers; here we stub the shape.
        return { content: [{ type: 'text', text: parts.join('\n\n') } as TextContent] };
      }
    }
  ];

  tools.forEach(t => server.tool(t));

  await server.connectSse(req, res);
}