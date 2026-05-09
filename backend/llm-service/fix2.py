f = open('main.py', 'r', encoding='utf-8')
data = f.read()
f.close()

lines = data.split('\n')
clean = [l for l in lines if not l.startswith('<<<<<<<') and not l.startswith('=======') and not l.startswith('>>>>>>>')]
data = '\n'.join(clean)

data = data.replace(chr(8217), chr(39))
data = data.replace(chr(8216), chr(39))
data = data.replace(chr(8212), '-')
data = data.replace(chr(8211), '-')

f = open('main.py', 'w', encoding='utf-8')
f.write(data)
f.close()
print('Done!')