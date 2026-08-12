const fs = require('fs');
let code = fs.readFileSync('src/model/agent.ts', 'utf8');

const t2 = `      if (msg.functionCall.name === 'execute_ricis_operation') {
        const op = msg.functionCall.args as RICISOperation;
        const res = processRicisOperation(op);
        agentHistory.push({ role: 'function', parts: [{ functionResponse: { name: 'execute_ricis_operation', response: res } }] });
        continue;
      }`;
      
console.log(code.includes(t2));
