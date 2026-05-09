import os

exts = ('.tsx', '.ts', '.js', '.json', '.jsx')

for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d != 'node_modules']
    for file in files:
        if file.endswith(exts):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
            clean = [l for l in lines if not l.startswith('<<<<<<<') and not l.startswith('=======') and not l.startswith('>>>>>>>')]
            if len(clean) != len(lines):
                with open(path, 'w', encoding='utf-8') as f:
                    f.writelines(clean)
                print(f'Fixed: {path}')

print('All done!')