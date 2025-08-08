# Firebase MCP Server for Railway

A Firebase Model Context Protocol (MCP) server designed for deployment on Railway.com using Streamable HTTP transport.

## Features

- **Firebase Authentication**: User management (create, read, update, delete users)
- **Firestore Database**: Document and collection operations with advanced querying
- **HTTP/HTTPS API**: Streamable HTTP transport for remote MCP client connections
- **Railway Ready**: Optimized for Railway.com deployment with proper configuration

## Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/firebase-mcp-server)

Or manually:

1. Fork this repository
2. Connect to Railway.com
3. Set environment variables (see below)
4. Deploy!

## Environment Variables

### Required

Set these in Railway's environment variables:

```bash
# Firebase service account as JSON string (recommended for Railway)
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project",...}'

# OR use file path (less secure for cloud deployment)
# FIREBASE_SERVICE_ACCOUNT_PATH="/path/to/service-account.json"

# Optional API key for authentication
MCP_API_KEY="your-secret-api-key"
```

### Getting Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Settings → Service Accounts
3. Click "Generate new private key"
4. Copy the entire JSON content and set as `FIREBASE_SERVICE_ACCOUNT_JSON`

## Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your Firebase credentials

# Run in development mode
npm run dev

# Build for production
npm run build
npm start
```

## API Endpoints

Once deployed on Railway, your server will have:

- **Health Check**: `GET https://your-app.railway.app/health`
- **MCP Endpoint**: `POST https://your-app.railway.app/mcp`

## Connecting MCP Clients

### Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "firebase-remote": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch", "https://your-app.railway.app/mcp"],
      "env": {
        "AUTHORIZATION": "Bearer your-secret-api-key"
      }
    }
  }
}
```

### Other MCP Clients

Configure any MCP client to connect to:
- **URL**: `https://your-app.railway.app/mcp`
- **Transport**: Streamable HTTP
- **Auth**: `Bearer your-secret-api-key` (if `MCP_API_KEY` is set)

## Available Tools

### Firebase Authentication
- `firebase_get_user` - Get user by UID
- `firebase_create_user` - Create new user with email/password
- `firebase_list_users` - List all users (with pagination)
- `firebase_delete_user` - Delete user by UID

### Firestore Database
- `firebase_get_document` - Get single document
- `firebase_set_document` - Create/overwrite document
- `firebase_update_document` - Update specific fields
- `firebase_delete_document` - Delete document
- `firebase_query_collection` - Advanced collection queries with filters, ordering, limits

## Example Usage

After connecting to Claude Desktop:

```
"Create a new user with email test@example.com and password secret123"

"Get all documents from the 'products' collection where price > 100, ordered by name"

"Update the user document in 'users' collection with ID 'user123' to set status to 'active'"
```

## Security Considerations

- Always use HTTPS in production (Railway provides this automatically)
- Set `MCP_API_KEY` for authentication
- Use Firebase security rules to restrict database access
- Never expose service account keys in client-side code

## Deployment Architecture

```
MCP Client (Claude Desktop)
    ↓ HTTPS + Streamable HTTP
Railway.com Server
    ↓ Admin SDK
Firebase Project (Auth + Firestore)
```

## Local vs Official Firebase MCP

| Feature | This Server | Official Firebase CLI MCP |
|---------|-------------|----------------------------|
| Deployment | ✅ Railway.com | ❌ Local only (stdio) |
| Transport | ✅ Streamable HTTP | ❌ Stdio only |
| Remote Access | ✅ Yes | ❌ No |
| Tools Count | 9 core tools | 40+ tools |
| Maintenance | Custom | Google maintained |

Use this server for remote/cloud deployments. Use the official Firebase CLI MCP for local development.

## Support

- [Railway Documentation](https://docs.railway.app/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [MCP Specification](https://modelcontextprotocol.io/)

## License

MIT