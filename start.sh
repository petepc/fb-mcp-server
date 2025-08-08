#!/bin/bash
set -e

# Optional: authenticate with service account if provided
if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
  echo "Using service account from $GOOGLE_APPLICATION_CREDENTIALS"
  firebase login:ci --token "$(cat $GOOGLE_APPLICATION_CREDENTIALS)"
else
  firebase login:ci --token "$FIREBASE_TOKEN"
fi

# Start the Firebase MCP server
exec firebase experimental:mcp