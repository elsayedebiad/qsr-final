@echo off
echo Updating Git repository...

git add .
git commit -m "Major update: Fixed filters and added VPS deployment tools"
git push origin main

echo Done!
pause
