import os

directories = ['/Users/peter/Desktop/hvg-saas-3/app', '/Users/peter/Desktop/hvg-saas-3/components']

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()
                
                # Replace indigo (purple) with cyan
                new_content = content.replace('indigo', 'cyan')
                
                # Replace amber (orange) with emerald
                new_content = new_content.replace('amber', 'emerald')
                
                if new_content != content:
                    with open(filepath, 'w') as f:
                        f.write(new_content)
                    print(f"Updated {filepath}")
