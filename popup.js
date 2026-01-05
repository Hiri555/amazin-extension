// Popup script pour gérer l'interface utilisateur

let currentVideos = [];

// Éléments DOM
const scanBtn = document.getElementById('scanBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const videoList = document.getElementById('videoList');
const videoCount = document.getElementById('videoCount');
const loading = document.getElementById('loading');

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
    const filename = `amazon-video-${index + 1}.mp4`;

    return `
      <div class="video-item" data-index="${index}">
        <div class="video-header">
          <span class="video-title">${video.title}</span>
          <span class="video-type">${video.type}</span>
        </div>
        ${video.poster ? `<div style="font-size: 11px; color: #888;">📷 Poster disponible</div>` : ''}
        <div class="video-url">${truncateUrl(mainUrl, 60)}</div>
        <div class="video-actions">
          <button class="btn btn-download download-single" data-url="${escapeHtml(mainUrl)}" data-filename="${filename}">
            ⬇️ Télécharger
          </button>
          ${video.sources.length > 1 ? `<span style="font-size: 11px; color: #666;">+${video.sources.length - 1} source(s)</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Ajouter les event listeners pour les boutons de téléchargement
  document.querySelectorAll('.download-single').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = e.target.getAttribute('data-url');
      const filename = e.target.getAttribute('data-filename');
      downloadVideo(url, filename, e.target);
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

// Event listeners
scanBtn.addEventListener('click', scanForVideos);
downloadAllBtn.addEventListener('click', downloadAllVideos);

// Scanner automatiquement au chargement du popup
window.addEventListener('load', () => {
  scanForVideos();
});
