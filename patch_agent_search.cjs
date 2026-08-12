const fs = require('fs');
let code = fs.readFileSync('src/model/agent.ts', 'utf8');

// There is a duplicate block reported:
// model/agent.ts [444:27 - 449:12] (6 lines, 65 tokens) => model/derivativeSearch.ts [259:28 - 264:8]

const t1 = `      if (msg.functionCall.name === 'execute_ricis_operation') {
        const op = msg.functionCall.args as RICISOperation;
        const res = processRicisOperation(op);
        agentHistory.push({ role: 'function', parts: [{ functionResponse: { name: 'execute_ricis_operation', response: res } }] });
        continue;
      }`;
      
// This is typical function routing logic, but let's see if we can DRY it.
// Actually, it's just 6 lines of standard AI function call handling. It's often better to leave this as is
// if it's cross-file boilerplate, but we can check it.
console.log(code.includes(t1));
