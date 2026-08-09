const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

// I will just find the Persistence section and replace back its div
code = code.replace(
  '<h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3">Persistence</h3>\n            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">',
  '<h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3">Persistence</h3>\n            <div className="space-y-2">'
);

fs.writeFileSync('src/ui/Map3D.tsx', code);
