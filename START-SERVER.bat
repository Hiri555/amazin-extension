@echo off
REM Script de démarrage rapide du serveur Amazon Video Downloader

echo.
echo ========================================
echo    Amazon Video Downloader Server
echo ========================================
echo.

REM Vérifier si Node.js est installé
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe!
    echo.
    echo Installation:
    echo    Telechargez Node.js sur https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Vérifier si yt-dlp est installé
where yt-dlp >nul 2>nul
if %errorlevel% neq 0 (
    echo [ATTENTION] yt-dlp n'est pas installe!
    echo.
    echo Installation:
    echo    pip install yt-dlp
    echo.
    echo Voulez-vous continuer quand meme? (O/N)
    set /p response=
    if /i not "%response%"=="O" exit /b 1
)

REM Aller dans le dossier server
cd /d "%~dp0server"

REM Vérifier si node_modules existe
if not exist "node_modules\" (
    echo Installation des dependances...
    call npm install
    echo.
)

REM Démarrer le serveur
echo Demarrage du serveur...
echo.
call npm start

pause
