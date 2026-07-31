"""Create placeholder test assets (logo + employee photo)."""

from PIL import Image, ImageDraw, ImageFont
import os

BASE = os.path.dirname(__file__)
os.makedirs(os.path.join(BASE, 'generator', 'assets'), exist_ok=True)

# --- Placeholder company logo (transparent PNG, blue badge with "AFC") ---
logo = Image.new('RGBA', (680, 240), (0, 0, 0, 0))
d = ImageDraw.Draw(logo)
d.rounded_rectangle([0, 0, 679, 239], radius=40, fill='#1a5f9e')
d.rounded_rectangle([10, 10, 669, 229], radius=32, outline='#d4a017', width=6)
try:
    font = ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf', 120)
except OSError:
    font = ImageFont.load_default()
d.text((340, 120), 'AFC', fill='white', font=font, anchor='mm')
logo.save(os.path.join(BASE, 'generator', 'assets', 'company_logo.png'))

# --- Placeholder employee photo (avatar-style) ---
photo = Image.new('RGB', (600, 600), '#dde5ec')
pd = ImageDraw.Draw(photo)
pd.ellipse([150, 80, 450, 380], fill='#8aa5bd')      # head
pd.ellipse([90, 400, 510, 700], fill='#8aa5bd')      # shoulders
photo.save(os.path.join(BASE, 'test_photo.jpg'), 'JPEG', quality=90)

print('assets created')
