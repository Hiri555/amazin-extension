// Content script pour détecter les vidéos sur les pages Amazon

let detectedVideos = [];

// Fonction pour trouver toutes les vidéos sur la page
function findAllVideos() {
  const videos = [];

  // 1. Trouver toutes les balises <video>
  const videoElements = document.querySelectorAll('video');
  videoElements.forEach((video, index) => {
    const sources = [];

    // Source directe de la vidéo
    if (video.src) {
      sources.push(video.src);
    }

    // Sources dans les balises <source>
    const sourceElements = video.querySelectorAll('source');
    sourceElements.forEach(source => {
      if (source.src) {
        sources.push(source.src);
      }
    });

    if (sources.length > 0) {
      videos.push({
        type: 'video-element',
        index: index + 1,
        sources: sources,
        poster: video.poster || null,
        title: `Video ${index + 1}`
      });
    }
  });

  // 2. Chercher les vidéos dans les iframes (vidéos embarquées)
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe, index) => {
    if (iframe.src && (iframe.src.includes('video') || iframe.src.includes('player'))) {
      videos.push({
        type: 'iframe',
        index: index + 1,
        sources: [iframe.src],
        title: `Iframe Video ${index + 1}`
      });
    }
  });

  // 3. Chercher dans les attributs data-* (Amazon utilise souvent des attributs personnalisés)
  const elementsWithDataVideo = document.querySelectorAll('[data-video-url], [data-src*="video"], [data-video-src]');
  elementsWithDataVideo.forEach((element, index) => {
    const videoUrl = element.getAttribute('data-video-url') ||
                     element.getAttribute('data-src') ||
                     element.getAttribute('data-video-src');

    if (videoUrl) {
      videos.push({
        type: 'data-attribute',
        index: index + 1,
        sources: [videoUrl],
        title: `Data Video ${index + 1}`
      });
    }
  });

  // 4. Chercher dans le DOM Amazon spécifique (classe et ID communs)
  const amazonVideoContainers = document.querySelectorAll(
    '#altImages video, ' +
    '#imageBlock video, ' +
    '.videoPlayer, ' +
    '[id*="video"], ' +
    '[class*="video"]'
  );

  amazonVideoContainers.forEach((container, index) => {
    const video = container.tagName === 'VIDEO' ? container : container.querySelector('video');
    if (video && video.src) {
      const alreadyFound = videos.some(v => v.sources.includes(video.src));
      if (!alreadyFound) {
        videos.push({
          type: 'amazon-container',
          index: index + 1,
          sources: [video.src],
          poster: video.poster || null,
          title: `Amazon Video ${index + 1}`
        });
      }
    }
  });

  // 5. Chercher dans les scripts de la page (URLs de vidéos)
  const scripts = document.querySelectorAll('script');
  const videoUrlPattern = /(https?:\/\/[^\s"']+\.(?:mp4|webm|ogg|m3u8)(?:[^\s"']*)?)/gi;

  scripts.forEach((script) => {
    if (script.textContent) {
      const matches = script.textContent.match(videoUrlPattern);
      if (matches) {
        matches.forEach((url, index) => {
          const alreadyFound = videos.some(v => v.sources.includes(url));
          if (!alreadyFound) {
            videos.push({
              type: 'script-extracted',
              index: index + 1,
              sources: [url],
              title: `Extracted Video ${index + 1}`
            });
          }
        });
      }
    }
  });

  return videos;
}

// Écouter les messages du popup
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
