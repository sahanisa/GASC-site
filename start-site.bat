@echo off
title GASC Idappadi Library - Online Book Availability Portal
color 0b
echo =========================================================================
echo   GOVERNMENT ARTS & SCIENCE COLLEGE, IDAPPADI - LIBRARY PORTAL
echo   Online Physical Book Availability Checker & Student/Faculty Gate
echo =========================================================================
echo.

cd /d "%~dp0"

echo [1/3] Generating Notice Board QR Code with Local IP...
node generate-qr.js

echo.
echo [2/3] Launching Live Web Portal on Port 5000...
echo Real-time connection to Desktop App Database is ACTIVE.
echo Students & Staff can access via Wi-Fi from mobile phones or PCs.
echo.
echo Notice Board Printable Poster: http://localhost:5000/poster.html
echo.
echo Starting Web Server...
echo =========================================================================
node server.js
pause
