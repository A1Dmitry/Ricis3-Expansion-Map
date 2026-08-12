const fs = require('fs');
const path = 'src/ui/AddNodeModal.tsx';
let code = fs.readFileSync(path, 'utf8');

const interfaceStr = `
interface AiAssistantResponse {
  title?: string;
  normalizedFunction?: string;
  targetFunction?: string;
  description?: string;
  hint?: string;
  link?: string;
}
`;

const insertPoint = `export function AddNodeModal({`;
if (!code.includes('AiAssistantResponse')) {
  code = code.replace(insertPoint, interfaceStr + '\n' + insertPoint);
}

const target1 = `<{
        title?: string;
        normalizedFunction?: string;
        targetFunction?: string;
        description?: string;
        hint?: string;
        link?: string;
      }>`;
      
const replacement = `<AiAssistantResponse>`;

code = code.replace(target1, replacement);
code = code.replace(target1, replacement);

const target2 = `<{
          title?: string;
          normalizedFunction?: string;
          targetFunction?: string;
          description?: string;
          hint?: string;
          link?: string;
        }>`;
code = code.replace(target2, replacement);
code = code.replace(target2, replacement);

fs.writeFileSync(path, code);
console.log("AddNodeModal patched");
