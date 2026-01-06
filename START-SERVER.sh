#!/bin/bash

# Script de démarrage rapide du serveur Amazon Video Downloader

echo ""
echo "🎬 ========================================"
echo "   Amazon Video Downloader Server"
echo "🎬 ========================================"
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé!"
    echo ""
    echo "📦 Installation:"
    echo "   Téléchargez Node.js sur https://nodejs.org/"
    echo ""
    exit 1
fi

# Vérifier si yt-dlp est installé
if ! command -v yt-dlp &> /dev/null; then
    echo "⚠️  yt-dlp n'est pas installé!"
    echo ""
    echo "📦 Installation:"
    echo "   pip install yt-dlp"
    echo "   ou"
    echo "   brew install yt-dlp  (macOS)"
    echo ""
    echo "Voulez-vous continuer quand même? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        exit 1
    fi
fi

# Aller dans le dossier server
cd "$(dirname "$0")/server" || exit

# Vérifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
    echo ""
fi

# Démarrer le serveur
echo "🚀 Démarrage du serveur..."
echo ""
npm start
