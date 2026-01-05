// Content script pour détecter les vidéos sur les pages Amazon

let detectedVideos = [];
let capturedVideoUrls = []; // URLs capturées depuis les requêtes réseau

// Fonction pour valider si une URL est téléchargeable
function isDownloadableVideo(url) {
  if (!url) return false;

  // Filtrer les URLs de streaming non téléchargeables
  const streamingFormats = ['.m3u8', '.mpd', '/dash/', '/hls/', 'm3u8', 'manifest'];
  if (streamingFormats.some(format => url.toLowerCase().includes(format))) {
    return false;
  }

  // Accepter seulement les formats vidéo téléchargeables
  const downloadableFormats = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
  return downloadableFormats.some(format => url.toLowerCase().includes(format));
}

// Fonction pour extraire le thumbnail d'un élément vidéo
function getThumbnail(videoElement) {
  // 1. Poster de la vidéo
  if (videoElement.poster) return videoElement.poster;

  // 2. Chercher un poster dans le parent
  const parent = videoElement.closest('div');
  if (parent) {
    const img = parent.querySelector('img');
    if (img && img.src) return img.src;
  }

  // 3. Chercher un attribut data-poster ou data-thumbnail
  const dataPoster = videoElement.getAttribute('data-poster') ||
                     videoElement.getAttribute('data-thumbnail');
  if (dataPoster) return dataPoster;

  return null;
}

// Fonction pour trouver toutes les vidéos sur la page
function findAllVideos() {
  const videos = [];
  const seenUrls = new Set(); // Pour éviter les doublons

  // 1. Trouver toutes les balises <video>
  const videoElements = document.querySelectorAll('video');
  videoElements.forEach((video, index) => {
    const sources = [];

    // Source directe de la vidéo
    if (video.src && isDownloadableVideo(video.src) && !seenUrls.has(video.src)) {
      sources.push(video.src);
      seenUrls.add(video.src);
    }

    // Sources dans les balises <source>
    const sourceElements = video.querySelectorAll('source');
    sourceElements.forEach(source => {
      if (source.src && isDownloadableVideo(source.src) && !seenUrls.has(source.src)) {
        sources.push(source.src);
        seenUrls.add(source.src);
      }
    });

    if (sources.length > 0) {
      const thumbnail = getThumbnail(video);
      videos.push({
        type: 'video-element',
        index: index + 1,
        sources: sources,
        poster: thumbnail,
        thumbnail: thumbnail,
        title: `Video ${index + 1}`,
        width: video.videoWidth || 0,
        height: video.videoHeight || 0
      });
    }
  });

  // 2. Chercher dans les attributs data-* (Amazon utilise souvent des attributs personnalisés)
  const elementsWithDataVideo = document.querySelectorAll('[data-video-url], [data-src*="video"], [data-video-src]');
  elementsWithDataVideo.forEach((element, index) => {
    const videoUrl = element.getAttribute('data-video-url') ||
                     element.getAttribute('data-src') ||
                     element.getAttribute('data-video-src');

    if (videoUrl && isDownloadableVideo(videoUrl) && !seenUrls.has(videoUrl)) {
      seenUrls.add(videoUrl);

      // Chercher un thumbnail associé
      let thumbnail = null;
      const img = element.querySelector('img');
      if (img && img.src) {
        thumbnail = img.src;
      }

      videos.push({
        type: 'data-attribute',
        index: index + 1,
        sources: [videoUrl],
        thumbnail: thumbnail,
        poster: thumbnail,
        title: `Amazon Video ${index + 1}`
      });
    }
  });

  // 3. Chercher dans le DOM Amazon spécifique (classe et ID communs)
  const amazonVideoContainers = document.querySelectorAll(
    '#altImages video, ' +
    '#imageBlock video, ' +
    '.videoPlayer, ' +
    '[id*="video"]:not(script), ' +
    '[class*="video"]:not(script)'
  );

  amazonVideoContainers.forEach((container, index) => {
    const video = container.tagName === 'VIDEO' ? container : container.querySelector('video');
    if (video && video.src && isDownloadableVideo(video.src) && !seenUrls.has(video.src)) {
      seenUrls.add(video.src);
      const thumbnail = getThumbnail(video);

      videos.push({
        type: 'amazon-product',
        index: index + 1,
        sources: [video.src],
        poster: thumbnail,
        thumbnail: thumbnail,
        title: `Amazon Product Video ${index + 1}`,
        width: video.videoWidth || 0,
        height: video.videoHeight || 0
      });
    }
  });

  // 4. Ajouter les vidéos capturées depuis les requêtes réseau
  capturedVideoUrls.forEach((capturedVideo, index) => {
    if (!seenUrls.has(capturedVideo.url)) {
      seenUrls.add(capturedVideo.url);
      videos.push({
        type: 'network-captured',
        index: index + 1,
        sources: [capturedVideo.url],
        thumbnail: capturedVideo.thumbnail || null,
        poster: capturedVideo.thumbnail || null,
        title: `Captured Video ${index + 1}`,
        size: capturedVideo.size || 0
      });
    }
  });

  return videos;
}

// Écouter les messages du popup et du background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getVideos') {
    detectedVideos = findAllVideos();
    sendResponse({ videos: detectedVideos });
  } else if (request.action === 'downloadVideo') {
    // Le téléchargement sera géré par le background script
    chrome.runtime.sendMessage({
      action: 'download',
      url: request.url,
      filename: request.filename
    });
    sendResponse({ success: true });
  } else if (request.action === 'addCapturedVideo') {
    // Ajouter une vidéo capturée depuis les requêtes réseau
    if (request.videoData && isDownloadableVideo(request.videoData.url)) {
      const exists = capturedVideoUrls.some(v => v.url === request.videoData.url);
      if (!exists) {
        capturedVideoUrls.push(request.videoData);
        console.log('Vidéo capturée:', request.videoData.url);
      }
    }
    sendResponse({ success: true });
  }
  return true;
});

// Scanner la page au chargement
window.addEventListener('load', () => {
  detectedVideos = findAllVideos();
  console.log(`Amazon Video Downloader: ${detectedVideos.length} vidéo(s) détectée(s)`);
});

// Observer les changements DOM (pour les vidéos chargées dynamiquement)
const observer = new MutationObserver(() => {
  const newVideos = findAllVideos();
  if (newVideos.length !== detectedVideos.length) {
    detectedVideos = newVideos;
    console.log(`Amazon Video Downloader: ${detectedVideos.length} vidéo(s) détectée(s)`);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
