#!/bin/bash

echo "AUTO COMMIT SCRIPT STARTED"

DATE=$(date +"%Y-%m-%d")
TIME=$(date +"%H:%M:%S")

mkdir -p logs

echo "Codespace started at $TIME" >> logs/$DATE.txt

git add .

if git diff --staged --quiet; then
    echo "No changes to commit"
    exit 0
fi

git commit -m "Start coding session and updates $DATE $TIME"

git pull --rebase origin main || {
    echo "Pull failed, aborting rebase..."
    git rebase --abort
    exit 1
}

git push origin main
