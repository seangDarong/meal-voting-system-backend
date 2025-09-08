#!/bin/bash

# ==== CONFIG ====
REPO_PATH="."
BRANCH="docker"
POLL_INTERVAL=30                    # seconds
COMPOSE_FILE="docker-compose.yml"   # or docker-compose.prod.yml
SERVICE_NAME="backend-baycanteen"
TZ="Asia/Phnom_Penh"

# Set timezone
export TZ=$TZ

echo "✅ Git poller started. Checking branch '$BRANCH' every ${POLL_INTERVAL}s."

while true; do
    echo "🔄 [$(date '+%Y-%m-%d %H:%M:%S')] Checking for updates..."

    # Fetch latest from remote
    git fetch origin "$BRANCH" --quiet

    # Get local and remote commit hashes
    LOCAL_COMMIT=$(git rev-parse HEAD)
    REMOTE_COMMIT=$(git rev-parse "origin/$BRANCH")

    if [[ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]]; then
        echo "📥 Changes detected! Pulling and redeploying..."

        # Pull latest code
        if git pull origin "$BRANCH"; then
            echo "Rebuilding service: $SERVICE_NAME"
            if docker compose -f "$COMPOSE_FILE" build "$SERVICE_NAME"; then
                echo "Restarting service: $SERVICE_NAME"
                docker compose -f "$COMPOSE_FILE" up -d --no-deps "$SERVICE_NAME"
                echo "Deployment completed at $(date '+%Y-%m-%d %H:%M:%S')"
            else
                echo "Build failed. Deployment aborted."
            fi
        else
            echo "Git pull failed. Skipping deployment."
        fi
    else
        echo "No changes found."
    fi

    echo "Sleeping for ${POLL_INTERVAL} seconds..."
    sleep $POLL_INTERVAL
done