# 🚀 Serveur Local Amazon Video Downloader

Serveur Node.js qui utilise **yt-dlp** pour télécharger les vidéos HLS/m3u8 des avis clients Amazon.

## 📦 Prérequis

### 1. Node.js
Installez Node.js (version 14 ou supérieure) :
- **Windows/macOS** : https://nodejs.org/
- **Linux** : `sudo apt install nodejs npm`

### 2. yt-dlp
Installez yt-dlp sur votre système :

**Windows** :
```powershell
# Avec pip
pip install yt-dlp

# Ou télécharger l'exécutable
# https://github.com/yt-dlp/yt-dlp/releases
```

**macOS** :
```bash
# Avec Homebrew
brew install yt-dlp

# Ou avec pip
pip3 install yt-dlp
```

**Linux** :
```bash
# Avec pip
pip install yt-dlp

# Ou avec apt (Ubuntu/Debian)
sudo apt install yt-dlp

# Ou télécharger le binaire
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

**Vérifier l'installation** :
```bash
yt-dlp --version
```

## 🔧 Installation du serveur

1. **Ouvrez un terminal dans le dossier server** :
```bash
cd amazin-extension/server
```

2. **Installez les dépendances** :
```bash
npm install
```

## ▶️ Démarrer le serveur

```bash
npm start
```

Vous devriez voir :
```
🎬 ========================================
   Amazon Video Downloader Server
🎬 ========================================

✅ Serveur démarré sur http://localhost:3000
📂 Dossier de téléchargement: /Users/vous/Downloads/Amazon-Videos
✅ yt-dlp version: 2024.xx.xx
🚀 Prêt à télécharger des vidéos !
```

## 📥 Dossier de téléchargement

Les vidéos sont téléchargées dans :
- **Windows** : `C:\Users\VotreNom\Downloads\Amazon-Videos\`
- **macOS** : `/Users/VotreNom/Downloads/Amazon-Videos/`
- **Linux** : `/home/votrenom/Downloads/Amazon-Videos/`

## 🎯 Utilisation

1. **Démarrez le serveur** (voir ci-dessus)
2. **Ouvrez l'extension Chrome** sur une page Amazon
3. **Cliquez sur le bouton "📥 yt-dlp"** pour les vidéos streaming
4. **Le téléchargement démarre automatiquement** !

## 🔍 Vérifier que tout fonctionne

### Test 1 : Vérifier le serveur
Ouvrez http://localhost:3000/health dans votre navigateur.

Vous devriez voir :
```json
{
  "status": "ok",
  "ytdlpInstalled": true,
  "ytdlpVersion": "2024.xx.xx",
  "downloadDir": "/Users/vous/Downloads/Amazon-Videos",
  "platform": "darwin",
  "nodeVersion": "v20.x.x"
}
```

### Test 2 : Test manuel de téléchargement
```bash
curl -X POST http://localhost:3000/download \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/video.m3u8","filename":"test.mp4"}'
```

## 📡 Endpoints API

### GET /
Informations sur le serveur

### GET /health
État du serveur et vérification de yt-dlp

### POST /download
Télécharger une vidéo
```json
{
  "url": "https://...",
  "filename": "video.mp4"
}
```

### GET /downloads
Liste des vidéos téléchargées

## 🐛 Dépannage

### Erreur : "yt-dlp n'est pas installé"
- Vérifiez que yt-dlp est dans votre PATH
- Testez : `yt-dlp --version`
- Réinstallez avec `pip install yt-dlp`

### Erreur : "Port 3000 déjà utilisé"
Un autre programme utilise le port 3000. Options :
1. Arrêtez l'autre programme
2. Changez le port dans `server.js` (ligne 8 : `const PORT = 3001;`)

### Le serveur ne démarre pas
```bash
# Supprimez node_modules et réinstallez
rm -rf node_modules package-lock.json
npm install
npm start
```

### Les vidéos ne se téléchargent pas
1. Vérifiez que le serveur est démarré
2. Vérifiez que yt-dlp fonctionne : `yt-dlp --version`
3. Regardez les logs du serveur dans le terminal
4. Testez avec une URL de vidéo directement :
```bash
yt-dlp "https://test-url.m3u8"
```

## 🔒 Sécurité

⚠️ **IMPORTANT** : Ce serveur est conçu pour un usage **LOCAL UNIQUEMENT**.

- N'exposez PAS ce serveur sur Internet
- Le serveur écoute uniquement sur `localhost`
- Utilisez un firewall si nécessaire

## 💡 Conseils

### Démarrage automatique (optionnel)

**macOS/Linux** - Créez un alias :
```bash
# Ajoutez dans ~/.bashrc ou ~/.zshrc
alias amazon-server='cd /chemin/vers/amazin-extension/server && npm start'
```

**Windows** - Créez un fichier batch `start-server.bat` :
```batch
@echo off
cd C:\chemin\vers\amazin-extension\server
npm start
pause
```

### Mode développement
Utilisez nodemon pour redémarrage automatique :
```bash
npm run dev
```

## 📝 Logs

Les logs apparaissent directement dans le terminal où vous avez lancé le serveur :
- `📥` = Téléchargement demandé
- `✅` = Téléchargement terminé
- `❌` = Erreur

## 🛑 Arrêter le serveur

Appuyez sur `Ctrl + C` dans le terminal.

## ⚙️ Configuration avancée

### Changer le dossier de téléchargement

Éditez `server.js` ligne 10 :
```javascript
const DOWNLOAD_DIR = '/votre/dossier/personnalisé';
```

### Options yt-dlp

Modifiez la commande yt-dlp dans `server.js` ligne 46 pour ajouter des options :
```javascript
const ytdlpCommand = `yt-dlp "${url}" -o "${outputPath}" --merge-output-format mp4 --format "best"`;
```

Options utiles :
- `--merge-output-format mp4` : Force le format MP4
- `--format "bestvideo+bestaudio"` : Meilleure qualité
- `--no-check-certificate` : Ignore les erreurs SSL
- `--proxy http://proxy:port` : Utilise un proxy

## 📚 Plus d'infos

- Documentation yt-dlp : https://github.com/yt-dlp/yt-dlp
- Issues : https://github.com/yt-dlp/yt-dlp/issues
