const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');
const brokenFragments = [
  /if \(val >= 1e9\) return '/g,
  /\+ \(val \/ 1e9\)\.toFixed\(1\) \+ 'B';/g,
  /if \(val >= 1e6\) return '/g
];

// Let's just grep everything out manually.
