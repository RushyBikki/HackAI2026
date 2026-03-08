#!/usr/bin/env bash
# CometPath dev startup
# Run from comet-path/ directory
echo "Starting CometPath..."
echo ""
echo "Server -> http://localhost:3001"
echo "Client -> http://localhost:5173"
echo ""

# Start server in background
(cd server && node index.js) &
SERVER_PID=$!

# Start client dev server
(cd client && npm run dev)

# Kill server when client exits
kill $SERVER_PID 2>/dev/null
