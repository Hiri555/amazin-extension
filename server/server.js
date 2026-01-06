#!/usr/bin/env node

/**
 * Serveur local pour Amazon Video Downloader
 * Utilise yt-dlp pour télécharger les vidéos HLS/m3u8
 */

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Configuration
const DOWNLOAD_DIR = path.join(os.homedir(), 'Downloads', 'Amazon-Videos');

// Créer le dossier de téléchargement s'il n'existe pas
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Route de test
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Amazon Video Downloader Server',
    downloadDir: DOWNLOAD_DIR,
    ytdlpAvailable: checkYtDlp()
  });
});

// Vérifier si yt-dlp est installé
function checkYtDlp() {
  try {
    exec('yt-dlp --version', (error) => {
      return !error;
    });
    return true;
  } catch {
    return false;
  }
}

// Route pour télécharger une vidéo
app.post('/download', async (req, res) => {
  const { url, filename } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL manquante' });
  }

  console.log(`📥 Téléchargement demandé: ${url}`);
  console.log(`📂 Dossier de destination: ${DOWNLOAD_DIR}`);

  // Nom de fichier sécurisé
  const safeFilename = filename
    ? filename.replace(/[^a-z0-9.-]/gi, '_')
    : `video-${Date.now()}.mp4`;

  const outputPath = path.join(DOWNLOAD_DIR, safeFilename);

  // Commande yt-dlp avec options optimales
  const ytdlpCommand = `yt-dlp "${url}" -o "${outputPath}" --no-warnings --no-playlist --format "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"`;

  console.log(`🚀 Commande: ${ytdlpCommand}`);

  // Démarrer le téléchargement
  res.json({
    status: 'started',
    message: 'Téléchargement démarré',
    filename: safeFilename,
    outputPath: outputPath
  });

  // Exécuter yt-dlp en arrière-plan
  exec(ytdlpCommand, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Erreur: ${error.message}`);
      console.error(`stderr: ${stderr}`);
      return;
    }

    console.log(`✅ Téléchargement terminé: ${safeFilename}`);
    console.log(stdout);
  });
});

// Route pour obtenir les téléchargements en cours
app.get('/downloads', (req, res) => {
  // Liste les fichiers dans le dossier de téléchargement
  fs.readdir(DOWNLOAD_DIR, (err, files) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const downloads = files.map(file => ({
      filename: file,
      path: path.join(DOWNLOAD_DIR, file)
    }));

    res.json({ downloads, downloadDir: DOWNLOAD_DIR });
  });
});

// Route pour vérifier l'état du serveur
app.get('/health', (req, res) => {
  exec('yt-dlp --version', (error, stdout) => {
    const ytdlpInstalled = !error;
    const ytdlpVersion = ytdlpInstalled ? stdout.trim() : null;

    res.json({
      status: 'ok',
      ytdlpInstalled,
      ytdlpVersion,
      downloadDir: DOWNLOAD_DIR,
      platform: os.platform(),
      nodeVersion: process.version
    });
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log('');
  console.log('🎬 ========================================');
  console.log('   Amazon Video Downloader Server');
  console.log('🎬 ========================================');
  console.log('');
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📂 Dossier de téléchargement: ${DOWNLOAD_DIR}`);
  console.log('');
  console.log('💡 Endpoints disponibles:');
  console.log(`   - GET  http://localhost:${PORT}/`);
  console.log(`   - GET  http://localhost:${PORT}/health`);
  console.log(`   - POST http://localhost:${PORT}/download`);
  console.log(`   - GET  http://localhost:${PORT}/downloads`);
  console.log('');

  // Vérifier yt-dlp
  exec('yt-dlp --version', (error, stdout) => {
    if (error) {
      console.log('⚠️  ATTENTION: yt-dlp n\'est pas installé !');
      console.log('');
      console.log('📦 Installation:');
      console.log('   pip install yt-dlp');
      console.log('   ou');
      console.log('   brew install yt-dlp  (macOS)');
      console.log('');
    } else {
      console.log(`✅ yt-dlp version: ${stdout.trim()}`);
      console.log('');
      console.log('🚀 Prêt à télécharger des vidéos !');
      console.log('');
    }
  });
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n\n👋 Arrêt du serveur...');
  process.exit(0);
});
