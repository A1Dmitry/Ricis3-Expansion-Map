const fs = require('fs');
const file = 'src/ui/Map3D.tsx';
let code = fs.readFileSync(file, 'utf-8');

if (!code.includes("Поиск узлов...")) {
  const searchUI = `
          <section className="mb-4">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Поиск</h3>
            <input
              type="text"
              placeholder="Поиск узлов..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900/50 border border-neutral-700 rounded px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
            />
          </section>

          <section>
`;

  code = code.replace(/<section>\s*<h3 className="text-\[10px\] font-bold text-gray-500 uppercase mb-3">Science Zones<\/h3>/, searchUI + '            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3">Science Zones</h3>');
  
  fs.writeFileSync(file, code);
  console.log('Search input added');
} else {
  console.log('Already added');
}
