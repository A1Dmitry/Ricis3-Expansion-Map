const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

// Add renderTextWithLinks outside Map3D
const renderTextWithLinks = `const renderTextWithLinks = (text: string, onNodeClick?: (id: string) => void) => {
  if (!text) return null;
  const urlRegex = /(https?:\\/\\/[^\\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 hover:underline break-all" onClick={e => e.stopPropagation()}>
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

export const Map3D`;

code = code.replace('export const Map3D', renderTextWithLinks);

// Fix the path rendering to be clickable
const oldPath = `{pathNodeIds.map(id => map.nodes.find(n => n.id === id)?.title || id).join(' → ')}`;
const newPath = `{pathNodeIds.map((id, idx) => (
                      <span key={id}>
                        <button type="button" className="hover:text-cyan-200 transition-colors" onClick={() => setSelectedNodeId(id)}>
                          {map.nodes.find(n => n.id === id)?.title || id}
                        </button>
                        {idx < pathNodeIds.length - 1 && <span className="text-cyan-700 mx-1">→</span>}
                      </span>
                    ))}`;
code = code.replace(oldPath, newPath);

// Make the description use renderTextWithLinks
const oldDesc = `<p className={\`text-[11px] text-gray-400 leading-relaxed mb-3 \${!isNodeExpanded && 'line-clamp-4'}\`}>{selectedNode.description}</p>`;
const newDesc = `<p className={\`text-[11px] text-gray-400 leading-relaxed mb-3 \${!isNodeExpanded && 'line-clamp-4'}\`}>{renderTextWithLinks(selectedNode.description)}</p>`;
code = code.replace(oldDesc, newDesc);

// Grouping actions into a nested menu form
// Let's rewrite the bottom part of the card
const actionBlockRegex = /<div className="mb-3 space-y-2">[\s\S]*?(?=<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*<\/main>)/;

// Wait, I will use manual replace using string index or regex to be safe, but let's replace the block containing buttons.
fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('Patched basic card UI');
