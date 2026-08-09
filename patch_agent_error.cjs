const fs = require('fs');
let code = fs.readFileSync('src/model/agent.ts', 'utf-8');

const oldBlock = `    if (!res.ok) {
      return { nodes: [], edges: [], error: data.error || 'Unknown server error' };
    }`;

const newBlock = `    if (!res.ok) {
      let errMsg = data.error || 'Unknown server error';
      if (typeof errMsg === 'string' && errMsg.includes('429')) {
        errMsg = 'Закончилась квота (лицензия) на API (ошибка 429). Подождите или проверьте ключ.';
      } else if (typeof errMsg === 'string' && errMsg.includes('404')) {
        errMsg = 'Модель недоступна или отключена (ошибка 404).';
      } else if (typeof errMsg === 'object' && JSON.stringify(errMsg).includes('429')) {
        errMsg = 'Закончилась квота (лицензия) на API (ошибка 429). Подождите или проверьте ключ.';
      }
      return { nodes: [], edges: [], error: errMsg };
    }`;

code = code.replace(oldBlock, newBlock);

fs.writeFileSync('src/model/agent.ts', code);
console.log('Patched agent.ts error handling');
