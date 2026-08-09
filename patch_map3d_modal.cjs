const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

if (!code.includes('import { AddNodeModal }')) {
  code = code.replace(
    "import React, { useState, useMemo, useEffect, useRef } from 'react';",
    "import React, { useState, useMemo, useEffect, useRef } from 'react';\nimport { AddNodeModal } from './AddNodeModal';"
  );
}

code = code.replace('+ Добавить Ноду', '+ Добавить задачу');

if (!code.includes('<AddNodeModal')) {
  code = code.replace(
    '<footer className="h-8 border-t border-cyan-900/30',
    `
      {showAddNode && (
        <AddNodeModal onClose={() => setShowAddNode(false)} parentId={selectedNodeId || undefined} />
      )}
      <footer className="h-8 border-t border-cyan-900/30`
  );
}

fs.writeFileSync('src/ui/Map3D.tsx', code);
console.log('Patched Map3D for Modal');
