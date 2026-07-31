"""
AFC Appreciation Card Generator
================================
Generates appreciation cards for employees with Arabic text support.
"""

import os

from PIL import Image, ImageDraw

from .text_renderer import prepare_arabic, load_fonts


class CardGenerator:
    """Main class for generating appreciation cards."""

    # Canvas dimensions (WhatsApp-friendly)
    WIDTH = 1080
    HEIGHT = 1520

    # Color palette
    COLORS = {
        'primary': '#1a5f9e',      # Company blue
        'accent': '#d4a017',       # Gold decorative
        'name': '#d35400',         # Highlight orange
        'text': '#2c3e50',         # Body text dark gray
    }

    def __init__(self, logo_path: str, font_dir: str = r"C:\Windows\Fonts"):
        """
        Initialize generator with company logo and font directory.

        Args:
            logo_path: Path to company logo PNG (with transparency)
            font_dir: System fonts directory (default: Windows Fonts)
        """
        self.logo_path = logo_path
        self.font_dir = font_dir
        self.fonts = load_fonts(font_dir)

    def _create_background(self) -> tuple:
        """Create gradient background with decorative bars."""
        bg = Image.new("RGB", (self.WIDTH, self.HEIGHT), "#ffffff")
        draw = ImageDraw.Draw(bg)

        # Gradient background
        for y in range(self.HEIGHT):
            ratio = y / self.HEIGHT
            r = int(255 - ratio * 15)
            g = int(255 - ratio * 25)
            b = int(255 - ratio * 35)
            draw.line([(0, y), (self.WIDTH, y)], fill=(r, g, b))

        # Top decorative bars
        draw.rectangle([0, 0, self.WIDTH, 14], fill=self.COLORS['primary'])
        draw.rectangle([0, 14, self.WIDTH, 22], fill=self.COLORS['accent'])

        # Bottom decorative bars
        draw.rectangle([0, self.HEIGHT - 22, self.WIDTH, self.HEIGHT - 14],
                       fill=self.COLORS['primary'])
        draw.rectangle([0, self.HEIGHT - 14, self.WIDTH, self.HEIGHT],
                       fill=self.COLORS['accent'])

        return bg, draw

    def _add_logo(self, bg: Image, draw) -> int:
        """Add company logo. Returns Y position after logo."""
        logo = Image.open(self.logo_path).convert("RGBA")
        logo_w = 340
        logo_h = int(logo.height * logo_w / logo.width)
        logo = logo.resize((logo_w, logo_h), Image.LANCZOS)

        x = (self.WIDTH - logo_w) // 2
        y = 55
        bg.paste(logo, (x, y), logo)

        return y + logo_h

    def _add_photo(self, bg: Image, photo_path: str, y_start: int) -> int:
        """
        Add circular employee photo with gold border.

        Uses circular mask and gold border overlay.
        """
        photo = Image.open(photo_path).convert("RGBA")
        size = 400
        photo = photo.resize((size, size), Image.LANCZOS)

        # Create circular mask
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, size, size], fill=255)

        # Apply mask to create circular photo
        circle = Image.new("RGBA", (size, size), (255, 255, 255, 0))
        circle.paste(photo, (0, 0), mask)

        # Add gold border
        border = 12
        bordered = Image.new("RGBA", (size + border * 2, size + border * 2),
                             (255, 255, 255, 0))
        bd_draw = ImageDraw.Draw(bordered)
        bd_draw.ellipse([0, 0, size + border * 2, size + border * 2],
                        fill=self.COLORS['accent'])
        bordered.paste(circle, (border, border), circle)

        # Paste onto background
        x = (self.WIDTH - bordered.width) // 2
        y = y_start + 45
        bg.paste(bordered, (x, y), bordered)

        return y + bordered.height

    def _add_text(self, draw, y_start: int, name: str,
                  achievement: str, detail: str, date: str):
        """Add all Arabic text elements to the card."""
        y = y_start + 55

        # Title
        title = prepare_arabic("بطاقة تقدير وتكريم")
        draw.text((self.WIDTH // 2, y), title, fill=self.COLORS['primary'],
                  font=self.fonts['title'], anchor="mm")
        y += 95

        # Content lines
        lines = [
            ("تُقدّم إلى المندوب المتميز", 'body', self.COLORS['text']),
            (name, 'name', self.COLORS['name']),
            ("", None, None),  # spacer
            ("وذلك تقديراً لإنجازه المتميز", 'body', self.COLORS['text']),
            (date, 'body', self.COLORS['text']),
            ("", None, None),  # spacer
            (achievement, 'highlight', self.COLORS['name']),
            (detail, 'body', self.COLORS['text']),
        ]

        for text, font_key, color in lines:
            if text == "":
                y += 30
                continue
            display_text = prepare_arabic(text)
            draw.text((self.WIDTH // 2, y), display_text, fill=color,
                      font=self.fonts[font_key], anchor="mm")
            y += 68

        # Gold divider line
        draw.rectangle([self.WIDTH // 2 - 140, y + 25,
                        self.WIDTH // 2 + 140, y + 30],
                       fill=self.COLORS['accent'])
        y += 80

        # Footer
        draw.text((self.WIDTH // 2, y),
                  prepare_arabic("الشركة العربية للأغذية"),
                  fill=self.COLORS['primary'], font=self.fonts['footer'],
                  anchor="mm")
        y += 50
        draw.text((self.WIDTH // 2, y), "Arabian Food Company",
                  fill=self.COLORS['primary'], font=self.fonts['footer'],
                  anchor="mm")

    def generate(self, photo_path: str, name: str, achievement: str,
                 detail: str, date: str, output_dir: str) -> dict:
        """
        Generate appreciation card and save to disk.

        Args:
            photo_path: Path to employee photo
            name: Employee name in Arabic
            achievement: Main achievement text (e.g. "بيع 25 زبون")
            detail: Achievement details (e.g. "من أصناف شويكي وهاريتوز")
            date: Date string in Arabic (e.g. "بتاريخ 25 يوليو 2026")
            output_dir: Output directory path

        Returns:
            dict: {'png': path, 'jpg': path}
        """
        os.makedirs(output_dir, exist_ok=True)

        # Build image
        bg, draw = self._create_background()
        logo_bottom = self._add_logo(bg, draw)
        photo_bottom = self._add_photo(bg, photo_path, logo_bottom)
        self._add_text(draw, photo_bottom, name, achievement, detail, date)

        # Save outputs
        safe_name = name.replace(' ', '_')
        png_path = os.path.join(output_dir, f"card_{safe_name}.png")
        jpg_path = os.path.join(output_dir, f"card_{safe_name}.jpg")

        bg.save(png_path, "PNG")
        bg.convert("RGB").save(jpg_path, "JPEG", quality=90, optimize=True)

        return {'png': png_path, 'jpg': jpg_path}
