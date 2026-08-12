const fs = require('fs');
let code = fs.readFileSync('src/model/initialMap.ts', 'utf8');

// There are a lot of clones in initialMap.ts (which is just a hardcoded data file, likely definitions for problem nodes).
// DRYing a static data file isn't usually strictly necessary (or sometimes helpful if it obscures data),
// but we can make a factory function if they are perfectly identical blocks.
// Let's check how big it is.
console.log(code.length);
