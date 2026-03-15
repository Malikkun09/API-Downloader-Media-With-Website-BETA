#!/bin/bash

echo "AUTO COMMIT SCRIPT STARTED"

DATE=$(date +"%Y-%m-%d")
TIME=$(date +"%H:%M:%S")

mkdir -p logs

echo "Codespace started at $TIME" >> logs/$DATE.txt

git add .
git commit -m "Start coding session and updates $DATE $TIME" || echo "no updates"
git push