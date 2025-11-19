"""
Tree Structure Parser for Obsidian Notes
Parses [[wiki links]] and builds hierarchical tree structures for books/videos
"""

import re
from typing import List, Dict, Optional, Set
from pathlib import Path
import logging

from app.models.note import Note

logger = logging.getLogger(__name__)


class TreeNode:
    """Represents a node in the note tree structure"""
    
    def __init__(
        self,
        note: Note,
        is_root: bool = False,
        is_leaf: bool = False,
        depth: int = 0
    ):
        self.note = note
        self.is_root = is_root
        self.is_leaf = is_leaf
        self.depth = depth
        self.children: List[TreeNode] = []
        self.parent: Optional[TreeNode] = None
        self.wiki_links: List[str] = []
    
    def add_child(self, child: 'TreeNode'):
        """Add a child node"""
        self.children.append(child)
        child.parent = self
        child.depth = self.depth + 1
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for API response"""
        return {
            "id": self.note.id,
            "title": self.note.title,
            "file_path": self.note.file_path,
            "is_root": self.is_root,
            "is_leaf": self.is_leaf,
            "depth": self.depth,
            "children_count": len(self.children),
            "wiki_links": self.wiki_links,
            "children": [child.to_dict() for child in self.children]
        }


class TreeParser:
    """Service for parsing note tree structures"""
    
    # Pattern to match [[wiki links]]
    WIKI_LINK_PATTERN = re.compile(r'\[\[([^\]]+)\]\]')
    
    def __init__(self):
        """Initialize tree parser"""
        self.notes_by_id: Dict[str, Note] = {}
        self.notes_by_title: Dict[str, Note] = {}
        self.notes_by_filepath: Dict[str, Note] = {}
    
    def extract_wiki_links(self, content: str) -> List[str]:
        """
        Extract all [[wiki links]] from markdown content
        
        Args:
            content: Markdown text
        
        Returns:
            List of link texts (without [[ ]])
        """
        matches = self.WIKI_LINK_PATTERN.findall(content)
        return [match.strip() for match in matches]
    
    def is_root_note(self, note: Note) -> bool:
        """
        Check if a note is a root note (filename starts with "Notes - ")
        
        Args:
            note: Note object
        
        Returns:
            True if note is a root node
        """
        # Check the filename, not the title
        filename = Path(note.file_path).name
        return filename.startswith("Notes - ") or filename.startswith("notes - ")
    
    def find_note_by_link_text(self, link_text: str, base_category: str) -> Optional[Note]:
        """
        Find a note by its [[wiki link]] text
        
        Strategy:
        1. Try exact title match
        2. Try case-insensitive title match
        3. Try partial match in same category
        4. Try filename match
        
        Args:
            link_text: Text from [[link]]
            base_category: Category to search within
        
        Returns:
            Note object or None
        """
        # Clean up the link text
        link_text_clean = link_text.strip()
        link_text_lower = link_text_clean.lower()
        
        # Strategy 1: Exact title match
        if link_text_clean in self.notes_by_title:
            return self.notes_by_title[link_text_clean]
        
        # Strategy 2: Case-insensitive search in same category
        for note in self.notes_by_id.values():
            if note.category == base_category:
                if note.title.lower() == link_text_lower:
                    return note
        
        # Strategy 3: Partial match (link text contained in title)
        for note in self.notes_by_id.values():
            if note.category == base_category:
                if link_text_lower in note.title.lower():
                    return note
        
        # Strategy 4: Check if it's a filename
        for file_path, note in self.notes_by_filepath.items():
            filename = Path(file_path).stem  # Get filename without extension
            if filename.lower() == link_text_lower:
                if note.category == base_category:
                    return note
        
        logger.warning(f"Could not find note for link: '{link_text}' in category '{base_category}'")
        return None
    
    def build_tree(self, root_note: Note, all_notes: List[Note]) -> TreeNode:
        """
        Build a tree structure starting from a root note
        
        Args:
            root_note: The root note (e.g., "Notes - A New Earth.md")
            all_notes: All notes in the vault
        
        Returns:
            TreeNode representing the complete tree
        """
        # Index notes for fast lookup
        self.notes_by_id = {note.id: note for note in all_notes}
        self.notes_by_title = {note.title: note for note in all_notes}
        self.notes_by_filepath = {note.file_path: note for note in all_notes}
        
        # Create root node
        root = TreeNode(note=root_note, is_root=True, depth=0)
        
        # Track visited notes to avoid cycles
        visited: Set[str] = {root_note.id}
        
        # Recursively build tree
        self._build_tree_recursive(root, root_note.category, visited)
        
        return root
    
    def _build_tree_recursive(
        self,
        parent_node: TreeNode,
        category: str,
        visited: Set[str]
    ):
        """
        Recursively build tree by following [[wiki links]]
        
        Args:
            parent_node: Current parent node
            category: Category to search within
            visited: Set of visited note IDs (to avoid cycles)
        """
        # Extract wiki links from parent note
        wiki_links = self.extract_wiki_links(parent_node.note.content)
        parent_node.wiki_links = wiki_links
        
        # If no links, this is a leaf
        if not wiki_links:
            parent_node.is_leaf = True
            return
        
        # Process each link
        for link_text in wiki_links:
            # Find the note for this link
            child_note = self.find_note_by_link_text(link_text, category)
            
            if child_note is None:
                logger.debug(f"Skipping unresolved link: {link_text}")
                continue
            
            # Avoid cycles
            if child_note.id in visited:
                logger.debug(f"Skipping already visited note: {child_note.title}")
                continue
            
            visited.add(child_note.id)
            
            # Create child node
            child_node = TreeNode(
                note=child_note,
                is_root=False,
                depth=parent_node.depth + 1
            )
            
            # Add to tree
            parent_node.add_child(child_node)
            
            # Recursively process children
            self._build_tree_recursive(child_node, category, visited)
    
    def find_root_notes(self, notes: List[Note]) -> List[Note]:
        """
        Find all root notes in a list
        
        Args:
            notes: List of notes
        
        Returns:
            List of root notes
        """
        return [note for note in notes if self.is_root_note(note)]
    
    def build_all_trees(self, notes: List[Note]) -> Dict[str, TreeNode]:
        """
        Build trees for all root notes
        
        Args:
            notes: All notes from vault
        
        Returns:
            Dictionary mapping root note ID to TreeNode
        """
        root_notes = self.find_root_notes(notes)
        trees = {}
        
        for root_note in root_notes:
            logger.info(f"Building tree for: {root_note.title}")
            tree = self.build_tree(root_note, notes)
            trees[root_note.id] = tree
        
        return trees
    
    def get_navigation_context(
        self,
        note: Note,
        tree: TreeNode
    ) -> Dict:
        """
        Get navigation context for a note (breadcrumbs, siblings, etc.)
        
        Args:
            note: The note to get context for
            tree: The tree containing this note
        
        Returns:
            Navigation context dictionary
        """
        # Find the node in the tree
        node = self._find_node_in_tree(tree, note.id)
        
        if node is None:
            return {
                "breadcrumbs": [],
                "siblings": [],
                "children": [],
                "parent": None
            }
        
        # Build breadcrumbs (path from root to this node)
        breadcrumbs = []
        current = node
        while current is not None:
            breadcrumbs.insert(0, {
                "title": current.note.title,
                "file_path": current.note.file_path
            })
            current = current.parent
        
        # Get siblings (other children of parent)
        siblings = []
        if node.parent:
            siblings = [
                {"title": child.note.title, "file_path": child.note.file_path}
                for child in node.parent.children
                if child.note.id != note.id
            ]
        
        # Get children
        children = [
            {"title": child.note.title, "file_path": child.note.file_path}
            for child in node.children
        ]
        
        # Get parent
        parent = None
        if node.parent:
            parent = {
                "title": node.parent.note.title,
                "file_path": node.parent.note.file_path
            }
        
        return {
            "breadcrumbs": breadcrumbs,
            "siblings": siblings,
            "children": children,
            "parent": parent,
            "is_leaf": node.is_leaf,
            "depth": node.depth
        }
    
    def _find_node_in_tree(self, tree: TreeNode, note_id: str) -> Optional[TreeNode]:
        """
        Find a node in the tree by note ID
        
        Args:
            tree: Tree to search
            note_id: Note ID to find
        
        Returns:
            TreeNode or None
        """
        if tree.note.id == note_id:
            return tree
        
        for child in tree.children:
            result = self._find_node_in_tree(child, note_id)
            if result:
                return result
        
        return None


if __name__ == "__main__":
    # Test the tree parser
    from app.services.obsidian_parser import parse_vault
    
    vault_path = "/Users/francescocavina/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Books"
    notes, stats = parse_vault(vault_path)
    
    parser = TreeParser()
    
    # Find A New Earth root note
    spiritual_notes = [n for n in notes if n.category == "Spiritual"]
    a_new_earth_root = next((n for n in spiritual_notes if "Notes - A New Earth" in n.title), None)
    
    if a_new_earth_root:
        print(f"Found root: {a_new_earth_root.title}")
        tree = parser.build_tree(a_new_earth_root, notes)
        print(f"\nTree structure:")
        print(f"Root: {tree.note.title}")
        print(f"Direct children: {len(tree.children)}")
        for child in tree.children:
            print(f"  - {child.note.title} (depth {child.depth}, leaf: {child.is_leaf})")

