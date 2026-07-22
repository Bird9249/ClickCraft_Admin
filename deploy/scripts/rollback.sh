#!/bin/bash
# Rollback ClickCraft Admin to the previous release

set -e

APP_NAME="${APP_NAME:-clickcraft-admin}"
SERVER_ROOT="${SERVER_ROOT:-/opt/clickcraft-admin}"
API_SERVICE="${API_SERVICE:-clickcraft-admin}"

echo "🔄 Rolling back $APP_NAME..."

PREVIOUS_RELEASES=$(ls -1 "$SERVER_ROOT/releases" | sort | tail -n 2 | head -n 1)

if [ -z "$PREVIOUS_RELEASES" ]; then
    echo "❌ No previous releases found for rollback"
    exit 1
fi

echo "📦 Rolling back to release: $PREVIOUS_RELEASES"

echo "🔗 Updating symlinks..."
sudo ln -sfn "$SERVER_ROOT/releases/$PREVIOUS_RELEASES" "$SERVER_ROOT/current"

echo "🔄 Restarting services..."
sudo systemctl restart "$API_SERVICE"

echo "⏳ Waiting for services to start..."
sleep 5

API_STATUS=$(systemctl is-active "$API_SERVICE")

if [ "$API_STATUS" = "active" ]; then
    echo "✅ Rollback successful!"
    echo "📊 Service status:"
    echo "   API: $API_STATUS"
else
    echo "❌ Rollback failed!"
    echo "📊 Service status:"
    echo "   API: $API_STATUS"
    exit 1
fi
