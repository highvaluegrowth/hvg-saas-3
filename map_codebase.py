import os

# --- CONFIGURATION ---
OUTPUT_FILE = 'codebase_map.txt'
SCRIPT_NAME = os.path.basename(__file__)

# Directories to ignore completely
IGNORE_DIRS = {
    '.git', '__pycache__', 'node_modules', 'venv', 'env', '.next', 'build', 'coverage', 'service-account.json',
    '.idea', '.vscode', 'dist', 'build', 'coverage', '.worktrees', '.claude', '.firebase'
}

# File extensions to ignore (binaries, images, locks)
IGNORE_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', 
    '.pyc', '.exe', '.bin', '.pdf', '.lock', '.zip', '.gz'
}

# Specific filenames to ignore
IGNORE_FILES = {
    OUTPUT_FILE, SCRIPT_NAME, 'package-lock.json', 'yarn.lock'
}

def is_ignored(path):
    """Check if a path should be ignored based on config."""
    name = os.path.basename(path)
    if name in IGNORE_FILES:
        return True
    _, ext = os.path.splitext(name)
    if ext.lower() in IGNORE_EXTENSIONS:
        return True
    return False

def generate_tree(root_dir):
    """Generates a visual tree structure of the directory."""
    tree_str = "### PROJECT STRUCTURE ###\n\n"
    tree_str += f"{os.path.basename(os.path.abspath(root_dir))}/\n"
    
    for root, dirs, files in os.walk(root_dir):
        # Modify dirs in-place to skip ignored directories in traversal
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        level = root.replace(root_dir, '').count(os.sep)
        indent = ' ' * 4 * (level)
        subindent = ' ' * 4 * (level + 1)
        
        for d in dirs:
            tree_str += f"{subindent}{d}/\n"
        for f in files:
            if not is_ignored(f):
                tree_str += f"{subindent}{f}\n"
                
    return tree_str + "\n" + "="*50 + "\n\n"

def write_file_contents(root_dir, output_file):
    """Reads files and writes their content to the output file."""
    with open(output_file, 'w', encoding='utf-8') as out:
        # 1. Write the Tree Structure
        print("Generating file tree...")
        out.write(generate_tree(root_dir))
        
        # 2. Write File Contents
        print("Reading file contents...")
        for root, dirs, files in os.walk(root_dir):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            
            for file in files:
                file_path = os.path.join(root, file)
                
                if is_ignored(file_path):
                    continue
                
                rel_path = os.path.relpath(file_path, root_dir)
                
                out.write(f"### FILE: {rel_path} ###\n")
                out.write("-" * 20 + "\n")
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        out.write(content + "\n\n")
                except UnicodeDecodeError:
                    out.write("[Binary or non-UTF-8 file content skipped]\n\n")
                except Exception as e:
                    out.write(f"[Error reading file: {e}]\n\n")

if __name__ == "__main__":
    current_dir = os.getcwd()
    print(f"Starting mapping of: {current_dir}")
    write_file_contents(current_dir, OUTPUT_FILE)
    print(f"Done! Codebase mapped to: {OUTPUT_FILE}")
