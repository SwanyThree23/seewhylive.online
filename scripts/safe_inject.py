#!/usr/bin/env python3
# Safe component injector - checks for duplicates before injecting
import re, sys

def check_duplicates(filepath, component_names):
    f = open(filepath, 'r', encoding='utf-8')
    content = f.read()
    f.close()
    dupes = []
    for name in component_names:
        count = len(re.findall(r'function ' + name + r'\b', content))
        if count > 0:
            dupes.append((name, count))
            print(f'[EXISTS] {name} - {count} definition(s) already present')
        else:
            print(f'[NEW] {name} - safe to inject')
    return dupes

if __name__ == '__main__':
    names = sys.argv[2:] if len(sys.argv) > 2 else []
    if not names:
        print('Usage: safe_inject.py <App.jsx path> <ComponentName1> <ComponentName2> ...')
    else:
        dupes = check_duplicates(sys.argv[1], names)
        if dupes:
            print(f'\n[WARNING] {len(dupes)} component(s) already exist. Skip injection or they will duplicate.')
        else:
            print('\n[OK] All components are new - safe to inject')
