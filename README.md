# 🎬 Amazon Video Downloader

Extension Chrome pour télécharger facilement toutes les vidéos d'une page produit Amazon.

## ✨ Fonctionnalités

- 🔍 **Détection intelligente** : Scanne et détecte uniquement les vidéos téléchargeables (MP4, WebM, MOV, etc.)
- 🎯 **Capture réseau** : Intercepte les vraies URLs de vidéos depuis les requêtes réseau (comme IDM)
- 📸 **Miniatures vidéo** : Affiche les thumbnails/posters des vidéos pour une meilleure identification
- 👁️ **Prévisualisation vidéo** : Prévisualisez chaque vidéo avant de la télécharger dans un lecteur intégré
- ⬇️ **Téléchargement fiable** : Filtre automatiquement les vidéos en streaming (HLS/DASH) non téléchargeables
- 🌍 **Multi-domaines** : Fonctionne sur tous les domaines Amazon (.com, .fr, .co.uk, .de, .ca, .it, .es)
- 🎯 **Interface intuitive** : Interface utilisateur claire avec miniatures et informations détaillées
- 🚀 **Rapide et léger** : Extension optimisée pour de meilleures performances

## 📥 Installation

### Méthode 1 : Installation en mode développeur (Recommandée)

1. **Téléchargez ou clonez ce dépôt**
   ```bash
   git clone https://github.com/votre-nom/amazin-extension.git
   cd amazin-extension
   ```

2. **Ouvrez Chrome et accédez aux extensions**
   - Tapez `chrome://extensions/` dans la barre d'adresse
   - Ou allez dans Menu (⋮) → Plus d'outils → Extensions

3. **Activez le mode développeur**
   - Cliquez sur le bouton "Mode développeur" en haut à droite

4. **Chargez l'extension**
   - Cliquez sur "Charger l'extension non empaquetée"
   - Sélectionnez le dossier `amazin-extension` que vous avez téléchargé

5. **C'est prêt !**
   - L'extension est maintenant installée
   - Vous verrez l'icône orange dans la barre d'outils

### Méthode 2 : Installation via fichier ZIP

1. **Téléchargez le projet en ZIP**
   - Cliquez sur "Code" → "Download ZIP" sur GitHub
   - Extrayez le fichier ZIP sur votre ordinateur

2. **Suivez les étapes 2-5 de la Méthode 1**

## 🚀 Utilisation

### Étape 1 : Accédez à une page produit Amazon
Ouvrez n'importe quelle page produit Amazon qui contient des vidéos, par exemple :
- https://www.amazon.fr/dp/B08N5WRWNW (exemple)

### Étape 2 : Cliquez sur l'icône de l'extension
Cliquez sur l'icône orange de l'extension dans la barre d'outils Chrome.

### Étape 3 : Scanner et télécharger
- L'extension scanne automatiquement la page au chargement
- Vous pouvez aussi cliquer sur "🔍 Scanner la page" pour rescanner
- Cliquez sur "👁️ Prévisualiser" pour voir la vidéo avant de télécharger
- Cliquez sur "⬇️ Télécharger" pour une vidéo spécifique
- Ou cliquez sur "⬇️ Tout télécharger" pour télécharger toutes les vidéos

### Étape 4 : Prévisualisation (optionnel)
- Cliquez sur "👁️ Prévisualiser" pour ouvrir le lecteur vidéo intégré
- La vidéo se lance automatiquement dans une modal élégante
- Vous pouvez contrôler la lecture (play, pause, volume, plein écran)
- Téléchargez directement depuis la modal ou fermez-la (bouton ×, touche Échap, clic en dehors)

### Étape 5 : Retrouvez vos vidéos
Les vidéos sont téléchargées dans votre dossier de téléchargements par défaut de Chrome.

## 🎯 Types de vidéos détectées

L'extension détecte plusieurs types de vidéos :

1. **Balises `<video>` HTML5** : Vidéos standard intégrées avec miniatures
2. **Attributs data-*** : Vidéos chargées dynamiquement par Amazon
3. **Conteneurs Amazon** : Vidéos dans les galeries et pages produits
4. **🆕 Capture réseau** : URLs de vidéos interceptées depuis les requêtes HTTP (comme IDM)

## ✅ Améliorations v1.1.0

### Corrections importantes
- ✅ **Filtrage intelligent** : Suppression des vidéos en streaming (HLS/DASH) non téléchargeables
- ✅ **Capture réseau** : Intercepte les vraies URLs de vidéos comme Internet Download Manager
- ✅ **Validation des URLs** : Vérifie que les vidéos sont réellement téléchargeables (MP4, WebM, MOV, etc.)
- ✅ **Plus d'erreurs "Extracted Video"** : Seules les vidéos valides sont affichées

### Nouvelles fonctionnalités
- 📸 **Miniatures vidéo** : Affiche les thumbnails/posters pour identifier facilement les vidéos
- 📐 **Informations détaillées** : Résolution vidéo (width x height) quand disponible
- 🎯 **Meilleure détection** : Focus sur les vidéos Amazon produits réellement téléchargeables
- 🔍 **Déduplication** : Évite les doublons dans la liste des vidéos

## 🔧 Structure du projet

```
amazin-extension/
├── manifest.json          # Configuration de l'extension
├── content.js            # Script de détection des vidéos
├── background.js         # Gestion des téléchargements
├── popup.html           # Interface utilisateur
├── popup.css            # Styles de l'interface
├── popup.js             # Logique de l'interface
├── icons/               # Icônes de l'extension
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── generate_icons.py    # Script de génération des icônes
└── README.md           # Ce fichier
```

## 🛠️ Développement

### Prérequis
- Python 3.x (pour régénérer les icônes)
- Pillow (installé automatiquement par le script)

### Régénérer les icônes
```bash
python3 generate_icons.py
```

### Modifier l'extension

1. **Modifiez les fichiers** selon vos besoins
2. **Rechargez l'extension** :
   - Allez dans `chrome://extensions/`
   - Cliquez sur l'icône de rechargement (🔄) sur la carte de l'extension

### Déboguer l'extension

- **Console du popup** : Clic droit sur le popup → Inspecter
- **Console du content script** : Ouvrez DevTools sur la page Amazon (F12)
- **Console du background script** : Allez dans `chrome://extensions/` → Cliquez sur "Service worker"

## 📝 Notes importantes

### Limitations
- Certaines vidéos peuvent être protégées contre le téléchargement
- Les vidéos DRM ne peuvent pas être téléchargées
- Certains formats de streaming (HLS/DASH) peuvent ne pas fonctionner

### Permissions requises
- **activeTab** : Pour accéder au contenu de l'onglet actif
- **downloads** : Pour télécharger les vidéos
- **scripting** : Pour injecter le script de détection
- **host_permissions** : Pour accéder aux domaines Amazon

### Conformité légale
Cette extension est destinée à un usage personnel uniquement. Respectez les droits d'auteur et les conditions d'utilisation d'Amazon. Ne téléchargez que du contenu dont vous avez le droit.

## 🐛 Dépannage

### L'extension ne détecte aucune vidéo
1. Assurez-vous d'être sur une page produit Amazon avec des vidéos
2. Rafraîchissez la page (F5)
3. Cliquez sur "🔍 Scanner la page" dans le popup

### Le téléchargement échoue
1. Vérifiez que vous avez l'autorisation de télécharger des fichiers
2. Certaines vidéos peuvent être en streaming uniquement
3. Essayez de télécharger les vidéos une par une au lieu de toutes en même temps

### L'extension ne fonctionne pas
1. Vérifiez que l'extension est activée dans `chrome://extensions/`
2. Rechargez l'extension
3. Consultez les logs dans la console du service worker

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Soumettre des pull requests

## 📄 Licence

Ce projet est fourni "tel quel" sans garantie d'aucune sorte. Utilisez-le à vos propres risques.

## 🙏 Remerciements

Merci d'utiliser Amazon Video Downloader !

---

**Avertissement** : Cette extension est destinée à un usage éducatif et personnel. Respectez toujours les droits d'auteur et les conditions d'utilisation des sites web.
