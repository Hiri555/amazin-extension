// Content script pour détecter les vidéos sur les pages Amazon

let detectedVideos = [];
let capturedVideoUrls = []; // URLs capturées depuis les requêtes réseau

// Fonction pour vérifier si une URL ressemble à une vidéo (n'importe quel format)
function isVideoUrl(url) {
  if (!url) return false;

  // Accepter TOUS les formats vidéo, y compris le streaming
  const videoPatterns = [
    '.mp4', '.webm', '.mov', '.avi', '.mkv',  // Formats classiques
    '.m3u8', '.mpd', '/hls/', '/dash/',       // Streaming
    'm3u8', 'manifest', 'playlist',           // Manifests
    '/video/', 'video-', '_video',            // URLs contenant "video"
    '.ts'                                      // Segments HLS
  ];

  const lowerUrl = url.toLowerCase();
  return videoPatterns.some(pattern => lowerUrl.includes(pattern));
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
    if (video.src && !seenUrls.has(video.src)) {
      sources.push(video.src);
      seenUrls.add(video.src);
    }

    // Sources dans les balises <source>
    const sourceElements = video.querySelectorAll('source');
    sourceElements.forEach(source => {
      if (source.src && !seenUrls.has(source.src)) {
        sources.push(source.src);
        seenUrls.add(source.src);
      }
    });

    if (sources.length > 0) {
      const thumbnail = getThumbnail(video);
      const isStreaming = sources.some(src => src.includes('.m3u8') || src.includes('.mpd'));
      videos.push({
        type: 'video-element',
        index: index + 1,
        sources: sources,
        poster: thumbnail,
        thumbnail: thumbnail,
        title: `Video ${index + 1}`,
        width: video.videoWidth || 0,
        height: video.videoHeight || 0,
        streaming: isStreaming,
        videoElement: video // Garder référence pour capture
      });
    }
  });

  // 2. Chercher dans les attributs data-* (Amazon utilise souvent des attributs personnalisés)
  const elementsWithDataVideo = document.querySelectorAll('[data-video-url], [data-src*="video"], [data-video-src]');
  elementsWithDataVideo.forEach((element, index) => {
    const videoUrl = element.getAttribute('data-video-url') ||
                     element.getAttribute('data-src') ||
                     element.getAttribute('data-video-src');

    if (videoUrl && !seenUrls.has(videoUrl)) {
      seenUrls.add(videoUrl);

      // Chercher un thumbnail associé
      let thumbnail = null;
      const img = element.querySelector('img');
      if (img && img.src) {
        thumbnail = img.src;
      }

      const isStreaming = videoUrl.includes('.m3u8') || videoUrl.includes('.mpd');
      videos.push({
        type: 'data-attribute',
        index: index + 1,
        sources: [videoUrl],
        thumbnail: thumbnail,
        poster: thumbnail,
        title: `Amazon Video ${index + 1}`,
        streaming: isStreaming
      });
    }
  });

  // 3. Chercher dans le DOM Amazon spécifique (classe et ID communs)
  const amazonVideoContainers = document.querySelectorAll(
    '#altImages video, ' +
    '#imageBlock video, ' +
    '.videoPlayer, ' +
    '[id*="video"]:not(script), ' +
    '[class*="video"]:not(script), ' +
    '[id*="review"], ' +  // Avis clients
    '[class*="review"]'    // Avis clients
  );

  amazonVideoContainers.forEach((container, index) => {
    const video = container.tagName === 'VIDEO' ? container : container.querySelector('video');
    if (video && video.src && !seenUrls.has(video.src)) {
      seenUrls.add(video.src);
      const thumbnail = getThumbnail(video);
      const isStreaming = video.src.includes('.m3u8') || video.src.includes('.mpd');

      videos.push({
        type: 'amazon-product',
        index: index + 1,
        sources: [video.src],
        poster: thumbnail,
        thumbnail: thumbnail,
        title: `Amazon Product Video ${index + 1}`,
        width: video.videoWidth || 0,
        height: video.videoHeight || 0,
        streaming: isStreaming,
        videoElement: video
      });
    }
  });

  // 4. Chercher dans les SCRIPTS (vidéos d'avis clients!)
  const scripts = document.querySelectorAll('script');
  const videoUrlPattern = /(https?:\/\/[^\s"']+\.(?:mp4|webm|ogg|m3u8|mpd|ts)(?:[^\s"']*)?)/gi;

  scripts.forEach((script) => {
    if (script.textContent) {
      const matches = script.textContent.match(videoUrlPattern);
      if (matches) {
        matches.forEach((url) => {
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            const isStreaming = url.includes('.m3u8') || url.includes('.mpd') || url.includes('.ts');
            videos.push({
              type: 'script-extracted',
              index: videos.filter(v => v.type === 'script-extracted').length + 1,
              sources: [url],
              title: `Extracted Video ${videos.filter(v => v.type === 'script-extracted').length + 1}`,
              streaming: isStreaming
            });
          }
        });
      }
    }
  });

  // 5. Ajouter les vidéos capturées depuis les requêtes réseau
  capturedVideoUrls.forEach((capturedVideo, index) => {
    if (!seenUrls.has(capturedVideo.url)) {
      seenUrls.add(capturedVideo.url);
      const isStreaming = capturedVideo.url.includes('.m3u8') || capturedVideo.url.includes('.mpd');
      videos.push({
        type: 'network-captured',
        index: index + 1,
        sources: [capturedVideo.url],
        thumbnail: capturedVideo.thumbnail || null,
        poster: capturedVideo.thumbnail || null,
        title: `Captured Video ${index + 1}`,
        size: capturedVideo.size || 0,
        streaming: isStreaming
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
    if (request.videoData && isVideoUrl(request.videoData.url)) {
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
