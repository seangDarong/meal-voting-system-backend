#!/bin/sh
POLL_INTERVAL=${POLL_INTERVAL:-30}
BRANCH=${BRANCH:-main}
COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME:-baycanteen}

echo "Starting Git poller for Bay Canteen..."
echo "Polling interval: ${POLL_INTERVAL}s"
echo "Watching branch: ${BRANCH}"
echo "Project name: ${COMPOSE_PROJECT_NAME}"

deploy_app() {
    echo "$(date): New changes detected! Starting deployment..."
    
    if git pull origin ${BRANCH}; then
        echo "✓ Git pull successful"
        
        if docker compose --build backend-baycanteen; then
            echo "✓ Docker build successful"
            
            if docker compose up -d backend-baycanteen; then
                echo "✓ Deployment completed successfully at $(date)"
                                
                # Clean up old images
                docker image prune -f
                echo "Cleanup completed"
                
            else
                echo "ERROR: Failed to restart backend container" >&2
            fi
        else
            echo "ERROR: Docker build failed" >&2
        fi
    else
        echo "ERROR: Git pull failed" >&2
    fi
    
    echo "----------------------------------------"
}

# Store initial commit hash
LAST_COMMIT=$(git rev-parse origin/${BRANCH} 2>/dev/null || git rev-parse HEAD)

echo "Initial commit: ${LAST_COMMIT}"
echo "Starting polling loop..."

# Main polling loop
while true; do
    # Fetch latest changes from remote
    if git fetch origin; then
        # Get current commit hash on remote
        CURRENT_COMMIT=$(git rev-parse origin/${BRANCH})
        
        # Compare with last known commit
        if [ "${LAST_COMMIT}" != "${CURRENT_COMMIT}" ]; then
            echo "🚀 Changes detected on branch ${BRANCH}:"
            echo "   Old commit: ${LAST_COMMIT:0:8}"
            echo "   New commit: ${CURRENT_COMMIT:0:8}"
            
            echo "📋 Changes:"
            git log --oneline ${LAST_COMMIT}..${CURRENT_COMMIT} --max-count=5
            
            # Update last commit and deploy
            LAST_COMMIT=${CURRENT_COMMIT}
            deploy_app
        else
            echo "$(date): No changes detected on branch ${BRANCH}"
        fi
    else
        echo "Failed to fetch from origin, retrying in 60s..." >&2
        sleep 60
    fi
    
    # Wait for next poll
    sleep ${POLL_INTERVAL}
done