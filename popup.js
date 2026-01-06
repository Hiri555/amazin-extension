// Popup script pour gérer l'interface utilisateur

let currentVideos = [];
let currentPreviewUrl = '';
let currentPreviewFilename = '';

// Éléments DOM
const scanBtn = document.getElementById('scanBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const videoList = document.getElementById('videoList');
const videoCount = document.getElementById('videoCount');
const loading = document.getElementById('loading');

// Éléments de la modal
const previewModal = document.getElementById('previewModal');
const previewVideo = document.getElementById('previewVideo');
const previewSource = document.getElementById('previewSource');
const previewTitle = document.getElementById('previewTitle');
const videoUrl = document.getElementById('videoUrl');
const closeModal = document.getElementById('closeModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const downloadFromPreview = document.getElementById('downloadFromPreview');

// Scanner la page pour les vidéos
async function scanForVideos() {
  showLoading();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Vérifier si on est sur Amazon
    if (!tab.url.includes('amazon.')) {
      showError('Cette extension fonctionne uniquement sur les pages Amazon');
      hideLoading();
      return;
    }

    // Envoyer un message au content script
    chrome.tabs.sendMessage(tab.id, { action: 'getVideos' }, (response) => {
      hideLoading();

      if (chrome.runtime.lastError) {
        console.error('Erreur:', chrome.runtime.lastError);
        showError('Erreur lors du scan. Veuillez rafraîchir la page.');
        return;
      }

      if (response && response.videos) {
        currentVideos = response.videos;
        displayVideos(response.videos);
      } else {
        showError('Aucune vidéo détectée sur cette page');
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    hideLoading();
    showError('Une erreur est survenue');
  }
}

// Afficher les vidéos détectées
function displayVideos(videos) {
  videoCount.textContent = videos.length;

  if (videos.length === 0) {
    videoList.innerHTML = `
      <div class="empty-state">
        <p>❌ Aucune vidéo détectée sur cette page</p>
        <p style="font-size: 12px; margin-top: 10px;">Assurez-vous d'être sur une page produit Amazon avec des vidéos.</p>
      </div>
    `;
    downloadAllBtn.disabled = true;
    return;
  }

  downloadAllBtn.disabled = false;

  videoList.innerHTML = videos.map((video, index) => {
    const mainUrl = video.sources[0];
    const filename = `amazon-video-${index + 1}.${video.streaming ? 'm3u8' : 'mp4'}`;
    const hasThumbnail = video.thumbnail || video.poster;
    const isStreaming = video.streaming || false;

    return `
      <div class="video-item ${isStreaming ? 'streaming-video' : ''}" data-index="${index}">
        ${hasThumbnail ? `
          <div class="video-thumbnail-container">
            <img src="${escapeHtml(video.thumbnail || video.poster)}"
                 alt="${escapeHtml(video.title)}"
                 class="video-thumbnail"
                 onerror="this.style.display='none'">
          </div>
        ` : ''}
        <div class="video-content">
          <div class="video-header">
            <span class="video-title">${video.title}</span>
            <span class="video-type ${isStreaming ? 'type-streaming' : ''}">${video.type}</span>
          </div>
          ${isStreaming ? '<div class="streaming-badge">🔴 STREAMING (HLS/m3u8)</div>' : ''}
          <div class="video-url">${truncateUrl(mainUrl, 45)}</div>
          ${video.width && video.height ? `<div class="video-info-text">📐 ${video.width}x${video.height}</div>` : ''}
          <div class="video-actions">
            <button class="btn btn-preview preview-video" data-url="${escapeHtml(mainUrl)}" data-filename="${filename}" data-title="${escapeHtml(video.title)}">
              👁️ Prévisualiser
            </button>
            ${isStreaming ? `
              <button class="btn btn-ytdlp download-ytdlp" data-url="${escapeHtml(mainUrl)}" data-filename="${filename}" title="Télécharger avec yt-dlp (serveur local requis)">
                📥 yt-dlp
              </button>
            ` : `
              <button class="btn btn-download download-single" data-url="${escapeHtml(mainUrl)}" data-filename="${filename}">
                ⬇️ Télécharger
              </button>
            `}
            ${video.sources.length > 1 ? `<div style="font-size: 10px; color: #666; margin-top: 5px;">+${video.sources.length - 1} source(s)</div>` : ''}
            ${isStreaming ? '<div class="streaming-hint">💡 Utilisez le bouton "yt-dlp" pour télécharger (serveur local requis)</div>' : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Ajouter les event listeners pour les boutons de prévisualisation
  document.querySelectorAll('.preview-video').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = e.target.getAttribute('data-url');
      const filename = e.target.getAttribute('data-filename');
      const title = e.target.getAttribute('data-title');
      openPreviewModal(url, filename, title);
    });
  });

  // Ajouter les event listeners pour les boutons de téléchargement
  document.querySelectorAll('.download-single').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = e.target.getAttribute('data-url');
      const filename = e.target.getAttribute('data-filename');
      downloadVideo(url, filename, e.target);
    });
  });

  // Ajouter les event listeners pour les boutons yt-dlp
  document.querySelectorAll('.download-ytdlp').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = e.target.getAttribute('data-url');
      const filename = e.target.getAttribute('data-filename');
      downloadVideoWithYtDlp(url, filename, e.target);
    });
  });
}

// Télécharger une vidéo
function downloadVideo(url, filename, button) {
  const originalText = button.textContent;
  button.textContent = '⏳ Téléchargement...';
  button.disabled = true;

  chrome.runtime.sendMessage({
    action: 'download',
    url: url,
    filename: filename
  }, (response) => {
    if (response && response.success) {
      button.textContent = '✅ Téléchargé';
      button.style.background = '#00C851';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        button.style.background = '';
      }, 2000);
    } else {
      button.textContent = '❌ Erreur';
      button.style.background = '#ff4444';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        button.style.background = '';
      }, 2000);
    }
  });
}

// Télécharger une vidéo avec yt-dlp (via serveur local)
function downloadVideoWithYtDlp(url, filename, button) {
  const originalText = button.textContent;
  button.textContent = '⏳ yt-dlp...';
  button.disabled = true;

  chrome.runtime.sendMessage({
    action: 'downloadWithYtDlp',
    url: url,
    filename: filename
  }, (response) => {
    if (response && response.success) {
      button.textContent = '✅ Téléchargé';
      button.style.background = '#00C851';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        button.style.background = '';
      }, 3000);
    } else {
      button.textContent = '❌ Serveur?';
      button.style.background = '#ff4444';
      button.title = response?.error || 'Serveur local non démarré';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        button.style.background = '';
        button.title = 'Télécharger avec yt-dlp (serveur local requis)';
      }, 3000);
    }
  });
}

// Télécharger toutes les vidéos
function downloadAllVideos() {
  if (currentVideos.length === 0) return;

  downloadAllBtn.textContent = '⏳ Téléchargement...';
  downloadAllBtn.disabled = true;

  let downloadedCount = 0;

  currentVideos.forEach((video, index) => {
    const url = video.sources[0];
    const filename = `amazon-video-${index + 1}.mp4`;

    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: 'download',
        url: url,
        filename: filename
      }, (response) => {
        downloadedCount++;
        if (downloadedCount === currentVideos.length) {
          downloadAllBtn.textContent = '✅ Tout téléchargé';
          setTimeout(() => {
            downloadAllBtn.textContent = '⬇️ Tout télécharger';
            downloadAllBtn.disabled = false;
          }, 2000);
        }
      });
    }, index * 500); // Délai entre chaque téléchargement pour éviter les problèmes
  });
}

// Utilitaires
function showLoading() {
  loading.style.display = 'flex';
}

function hideLoading() {
  loading.style.display = 'none';
}

function showError(message) {
  videoList.innerHTML = `
    <div class="empty-state">
      <p>⚠️ ${message}</p>
    </div>
  `;
}

function truncateUrl(url, maxLength) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Fonction pour ouvrir la modal de prévisualisation
function openPreviewModal(url, filename, title) {
  currentPreviewUrl = url;
  currentPreviewFilename = filename;

  // Mettre à jour le titre et l'URL
  previewTitle.textContent = title || 'Prévisualisation vidéo';
  videoUrl.textContent = `URL: ${url}`;

  // Charger la vidéo
  previewSource.src = url;
  previewVideo.load();

  // Afficher la modal
  previewModal.style.display = 'flex';

  // Démarrer la lecture automatiquement
  previewVideo.play().catch(err => {
    console.log('Lecture automatique bloquée:', err);
  });
}

// Fonction pour fermer la modal
function closePreviewModal() {
  // Arrêter la vidéo
  previewVideo.pause();
  previewSource.src = '';

  // Masquer la modal
  previewModal.style.display = 'none';

  // Réinitialiser les variables
  currentPreviewUrl = '';
  currentPreviewFilename = '';
}

// Télécharger depuis la modal
function downloadFromPreviewModal() {
  if (currentPreviewUrl && currentPreviewFilename) {
    const button = downloadFromPreview;
    downloadVideo(currentPreviewUrl, currentPreviewFilename, button);
  }
}

// Event listeners pour la modal
closeModal.addEventListener('click', closePreviewModal);
closeModalBtn.addEventListener('click', closePreviewModal);
downloadFromPreview.addEventListener('click', downloadFromPreviewModal);

// Fermer la modal en cliquant en dehors
previewModal.addEventListener('click', (e) => {
  if (e.target === previewModal) {
    closePreviewModal();
  }
});

// Fermer la modal avec la touche Échap
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && previewModal.style.display === 'flex') {
    closePreviewModal();
  }
});

// Event listeners
scanBtn.addEventListener('click', scanForVideos);
downloadAllBtn.addEventListener('click', downloadAllVideos);

// Scanner automatiquement au chargement du popup
window.addEventListener('load', () => {
  scanForVideos();
});
