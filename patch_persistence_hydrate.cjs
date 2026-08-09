const fs = require('fs');
let code = fs.readFileSync('src/model/persistence.ts', 'utf-8');

code = code.replace(
  "const fromDb = await dbLoadMap();",
  "let fromDb = await dbLoadMap();\n  if (fromDb) fromDb = sanitizeMap(fromDb);"
);

// We should also sanitize initialMap as a fallback if the user has no save data.
code = code.replace(
  "return initialMap;",
  "return sanitizeMap(initialMap);"
);

fs.writeFileSync('src/model/persistence.ts', code);
console.log('patched persistence hydrate');
