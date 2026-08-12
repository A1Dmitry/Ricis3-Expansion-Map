import re

with open('src/model/initialMap.ts', 'r', encoding='utf-8') as f:
    content = f.read()

blocks = content.split('{')
print("Total blocks split by curly brace:", len(blocks))

nodes_by_zone = {}
for block in blocks:
    # Match id key (quoted or unquoted) and string value
    id_match = re.search(r'[\'"]?id[\'"]?\s*:\s*[\'"]([a-zA-Z0-9_-]+)[\'"]', block)
    if not id_match:
        continue
    
    nid = id_match.group(1)
    
    # Exclude edges
    if 'fromId' in block or 'toId' in block:
        continue
    # Exclude zones themselves
    if 'economicProfile' in block:
        continue
        
    title_match = re.search(r'[\'"]?title[\'"]?\s*:\s*[\'"]([^\'"]+)[\'"]', block)
    title = title_match.group(1) if title_match else ""
    
    # Try to extract zoneIds
    zids_match = re.search(r'[\'"]?zoneIds[\'"]?\s*:\s*\[(.*?)\]', block, re.DOTALL)
    zids = []
    if zids_match:
        zids = [z.strip().strip("\'\"") for z in zids_match.group(1).split(',') if z.strip()]
        
    if not zids:
        nodes_by_zone.setdefault('NONE/EMPTY', []).append((nid, title))
    else:
        for zid in zids:
            nodes_by_zone.setdefault(zid, []).append((nid, title))

print("\n--- NODES BY ZONE ---")
for zid, nodes in sorted(nodes_by_zone.items()):
    print(f"Zone: {zid} ({len(nodes)} nodes):")
    for nid, title in nodes[:10]:
        print(f"  - {nid}: {title}")
    if len(nodes) > 10:
        print(f"  - ... and {len(nodes) - 10} more")
