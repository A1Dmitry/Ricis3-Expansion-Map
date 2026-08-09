const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

// The file might contain multiple 'export const Map3D: React.FC = () => {'
const parts = code.split('export const Map3D: React.FC = () => {');

// The first part is imports and helpers. The second part is the first component.
if (parts.length > 2) {
  let firstPart = parts[0];
  // Since we replaced the export, the helper formatCurrency might be duplicated in firstPart
  // Let's just keep the first instance of it.
  
  // parts[1] is the first Map3D body. 
  // Let's find where the component ends. It ends at `};\n` or similar. But since it's the main export, it probably goes to the end.
  // Actually, wait, parts[1] is the body, but it also has another 'export const Map3D...' at the end of parts[1] if we split it.
  // We can just keep parts[0] + 'export const Map3D: React.FC = () => {' + parts[1] and drop the rest!
  
  let newCode = parts[0] + 'export const Map3D: React.FC = () => {' + parts[1];
  fs.writeFileSync('src/ui/Map3D.tsx', newCode);
  console.log('Fixed duplications. Lines now: ' + newCode.split('\n').length);
} else {
  console.log('No duplications found.');
}
