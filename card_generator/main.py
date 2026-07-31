"""
AFC Appreciation Card Generator - CLI entry point.

Usage:
    python main.py \
        --photo "employee.jpg" \
        --name "محمد قبوات" \
        --achievement "بيع 23 زبون" \
        --detail "من أصناف ديمة وتورابيكا" \
        --date "بتاريخ 22 يوليو 2026" \
        --output "./output"
"""

import argparse
import os
import sys

# Ensure the package is importable even with isolated/embedded runtimes
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Allow printing Arabic paths on Windows consoles with non-UTF8 codepages
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from generator import CardGenerator

DEFAULT_LOGO = os.path.join(os.path.dirname(__file__),
                            'generator', 'assets', 'company_logo.png')


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Generate AFC employee appreciation cards (1080x1520).'
    )
    parser.add_argument('--photo', required=True,
                        help='Path to employee photo (JPG/PNG)')
    parser.add_argument('--name', required=True,
                        help='Employee name in Arabic')
    parser.add_argument('--achievement', required=True,
                        help='Main achievement text, e.g. "بيع 25 زبون"')
    parser.add_argument('--detail', default='',
                        help='Achievement details, e.g. "من أصناف شويكي وهاريتوز"')
    parser.add_argument('--date', required=True,
                        help='Date string in Arabic, e.g. "بتاريخ 25 يوليو 2026"')
    parser.add_argument('--output', default=os.path.join(os.path.dirname(__file__), 'output'),
                        help='Output directory (default: ./output)')
    parser.add_argument('--logo', default=DEFAULT_LOGO,
                        help='Path to company logo PNG with transparency')
    args = parser.parse_args()

    if not os.path.exists(args.photo):
        print(f"Error: photo not found: {args.photo}", file=sys.stderr)
        return 1
    if not os.path.exists(args.logo):
        print(f"Error: logo not found: {args.logo}", file=sys.stderr)
        return 1

    generator = CardGenerator(logo_path=args.logo)
    result = generator.generate(
        photo_path=args.photo,
        name=args.name,
        achievement=args.achievement,
        detail=args.detail,
        date=args.date,
        output_dir=args.output,
    )

    print(f"PNG saved: {result['png']}")
    print(f"JPG saved: {result['jpg']}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
