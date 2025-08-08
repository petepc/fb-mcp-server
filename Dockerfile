# Use official Node.js 20 image
FROM node:20-slim

# Install dependencies: firebase-tools
RUN npm install -g firebase-tools@latest

# Create app directory
WORKDIR /app

# Copy an optional startup script (we'll define below)
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Railway will use this port (though MCP is stdio by default)
ENV PORT=8080

# Start the MCP server
CMD ["./start.sh"]