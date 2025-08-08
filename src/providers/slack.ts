import { WebClient } from '@slack/web-api';
import { Tool, TextContent } from '@modelcontextprotocol/sdk';

export function slackTools(userHint: string): Tool[] {
  const token = process.env.SLACK_XOXP_TOKEN;
  const client = token ? new WebClient(token) : null;
  const allowList = (process.env.SLACK_CHANNEL_ALLOWLIST || '').split(',').map(s => s.trim()).filter(Boolean);

  const ensure = () => {
    if (!client) throw new Error('Slack is not configured: set SLACK_XOXP_TOKEN');
  };

  return [
    {
      name: 'slack_search',
      description: 'Search Slack messages (read-only). Filters to an optional channel allowlist.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          days: { type: 'number', default: 14 }
        },
        required: ['query']
      },
      handler: async ({ query, days = 14 }) => {
        ensure();
        const latest = Math.floor(Date.now() / 1000);
        const oldest = latest - days * 86400;
        const res = await client!.search.messages({ query, sort: 'timestamp', sort_dir: 'desc' });
        const matches = (res.messages?.matches || []).filter(m => Number(m.ts) >= oldest && Number(m.ts) <= latest);
        const filtered = allowList.length
          ? matches.filter(m => m.channel && allowList.includes(`#${m.channel.name}`))
          : matches;
        const lines = filtered.slice(0, 10).map(m => `• [#${m.channel?.name}] ${m.username}: ${m.text} (https://slack.com/app_redirect?channel=${m.channel?.id}&message=${m.ts})`);
        const text = lines.length ? lines.join('\n') : 'No results.';
        return { content: [{ type: 'text', text } as TextContent] };
      }
    }
  ];
}