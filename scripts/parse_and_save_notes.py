"""
Script to parse Obsidian vault and save structured notes to JSON
"""

import json
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.services.obsidian_parser import parse_vault
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    # Configuration
    vault_path = "/Users/francescocavina/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Books"
    output_dir = Path(__file__).parent.parent / "data" / "processed"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Parsing vault: {vault_path}")
    
    # Parse vault
    notes, stats = parse_vault(vault_path)
    
    # Save notes to JSON
    output_file = output_dir / "notes.json"
    notes_data = [note.model_dump() for note in notes]
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(notes_data, f, indent=2, ensure_ascii=False, default=str)
    
    logger.info(f"Saved {len(notes)} notes to {output_file}")
    
    # Save statistics
    stats_file = output_dir / "statistics.json"
    with open(stats_file, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Saved statistics to {stats_file}")
    
    # Print summary
    print("\n=== Parsing Complete ===")
    print(f"Total notes: {stats['total_notes']}")
    print(f"Total words: {stats['total_words']:,}")
    print(f"Average words per note: {stats['avg_words_per_note']}")
    print(f"\nCategories:")
    for category, count in stats['categories'].items():
        print(f"  - {category}: {count} notes")
    print(f"\nOutput saved to: {output_dir}")


if __name__ == "__main__":
    main()

