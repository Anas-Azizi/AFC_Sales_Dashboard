"""
Arabic text rendering helpers.

PIL does not support Arabic letter joining or right-to-left ordering
natively, so every Arabic string MUST pass through prepare_arabic()
before being drawn. Without reshaping + BiDi the text appears
reversed and disconnected.
"""

import os

from PIL import ImageFont
import arabic_reshaper
from bidi.algorithm import get_display


def prepare_arabic(text: str) -> str:
    """
    Fix Arabic text rendering using reshaping + BiDi algorithm.

    Args:
        text: Raw Arabic text string.

    Returns:
        Processed text ready for PIL rendering.
    """
    if not text:
        return ""
    # Step 1: Reshape - connect Arabic letters properly
    reshaped = arabic_reshaper.reshape(text)
    # Step 2: BiDi - fix right-to-left ordering
    return get_display(reshaped)


def load_fonts(font_dir: str = r"C:\Windows\Fonts") -> dict:
    """
    Load system Arabic-supporting fonts with fallback.

    Tries Arial, then Tahoma, then Segoe UI; falls back to the
    PIL default bitmap font if none is found.
    """
    font_paths = [
        os.path.join(font_dir, "arial.ttf"),
        os.path.join(font_dir, "tahoma.ttf"),
        os.path.join(font_dir, "segoeui.ttf"),
    ]

    def get_font(size: int):
        for fp in font_paths:
            if os.path.exists(fp):
                return ImageFont.truetype(fp, size)
        return ImageFont.load_default()

    return {
        'title': get_font(64),
        'name': get_font(56),
        'body': get_font(42),
        'highlight': get_font(48),
        'footer': get_font(34),
    }
