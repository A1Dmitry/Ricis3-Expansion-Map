const fs = require('fs');
const content = fs.readFileSync('/app/applet/temp-ricis-core-2/Ricis.Console/ExampleCatalog.cs', 'utf8');
const regex = /new\("([^"]+)",[^,]+,\s*"([^"]+)"\)/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(`{ id: '${match[1]}', expr: '${match[2]}' },`);
}
