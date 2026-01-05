// Background service worker pour gérer les téléchargements

// Écouter les messages du popup et du content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'download') {
    downloadVideo(request.url, request.filename)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Erreur de téléchargement:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indique une réponse asynchrone
  }
});

// Fonction pour télécharger une vidéo
async function downloadVideo(url, filename) {
  try {
    console.log('Téléchargement de:', url);

    // Utiliser l'API chrome.downloads
    const downloadId = await chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: false, // Télécharger directement sans demander
      conflictAction: 'uniquify' // Ajouter un suffixe si le fichier existe déjà
    });

    console.log('Téléchargement démarré, ID:', downloadId);

    // Surveiller le statut du téléchargement
    return new Promise((resolve, reject) => {
      const listener = (delta) => {
        if (delta.id === downloadId) {
          if (delta.state && delta.state.current === 'complete') {
            console.log('Téléchargement terminé:', filename);
            chrome.downloads.onChanged.removeListener(listener);
            resolve(downloadId);
          } else if (delta.error) {
            console.error('Erreur de téléchargement:', delta.error);
            chrome.downloads.onChanged.removeListener(listener);
            reject(new Error(delta.error.current));
          }
        }
      };

      chrome.downloads.onChanged.addListener(listener);

      // Timeout après 5 minutes
      setTimeout(() => {
        chrome.downloads.onChanged.removeListener(listener);
        resolve(downloadId); // On résout quand même car le téléchargement a démarré
      }, 5 * 60 * 1000);
    });

  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    throw error;
  }
}

// Gérer l'installation de l'extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Amazon Video Downloader installé avec succès!');
  } else if (details.reason === 'update') {
    console.log('Amazon Video Downloader mis à jour!');
  }
});

// Nettoyer les téléchargements échoués ou annulés
chrome.downloads.onChanged.addListener((delta) => {
  if (delta.error) {
    console.error('Erreur de téléchargement détectée:', delta.error.current);
  }
});
