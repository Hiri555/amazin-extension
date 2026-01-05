#!/usr/bin/env python3
"""
Script pour générer les icônes de l'extension Amazon Video Downloader
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Installation de Pillow...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'pillow'])
    from PIL import Image, ImageDraw, ImageFont

def create_icon(size):
    """Crée une icône avec le logo Amazon Video Downloader"""

    # Couleurs Amazon
    bg_color = '#FF9900'  # Orange Amazon
    text_color = '#FFFFFF'  # Blanc

    # Créer l'image
    img = Image.new('RGB', (size, size), bg_color)
    draw = ImageDraw.Draw(img)

    # Dessiner un symbole de téléchargement (flèche vers le bas)
    padding = size // 6
    arrow_width = size - (2 * padding)

    # Tige de la flèche
    stem_width = arrow_width // 4
    stem_x1 = (size - stem_width) // 2
    stem_x2 = stem_x1 + stem_width
    stem_y1 = padding
    stem_y2 = size - padding - (arrow_width // 3)

    draw.rectangle([stem_x1, stem_y1, stem_x2, stem_y2], fill=text_color)

    # Pointe de la flèche (triangle)
    arrow_height = arrow_width // 2
    arrow_y = size - padding
    arrow_points = [
        (size // 2, arrow_y),  # Point bas (centre)
        (padding, arrow_y - arrow_height),  # Point haut gauche
        (size - padding, arrow_y - arrow_height)  # Point haut droit
    ]
    draw.polygon(arrow_points, fill=text_color)

    # Dessiner un "V" pour vidéo en haut
    if size >= 48:
        v_size = size // 8
        v_y = padding + v_size // 2
        draw.text((padding, v_y), 'V', fill=text_color)

    return img

def main():
    """Génère les icônes dans les tailles requises"""
    sizes = [16, 48, 128]

    for size in sizes:
        icon = create_icon(size)
        filename = f'icons/icon{size}.png'
        icon.save(filename)
        print(f'✅ Icône créée: {filename}')

    print('\n🎉 Toutes les icônes ont été générées avec succès!')

if __name__ == '__main__':
    main()
