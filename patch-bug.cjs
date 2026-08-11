const fs = require('fs');
let code = fs.readFileSync('src/model/physics.ts', 'utf8');

const regexNodes = /export function layoutNodes\([\s\S]*$/;
const matchNodes = code.match(regexNodes);

if (matchNodes) {
    let nodesCode = matchNodes[0];
    nodesCode = nodesCode.replace(/const G = p\.zoneG;/g, 'const G = p.nodeG;');
    code = code.replace(regexNodes, nodesCode);
    fs.writeFileSync('src/model/physics.ts', code);
    console.log("Fixed layoutNodes G parameter.");
}
