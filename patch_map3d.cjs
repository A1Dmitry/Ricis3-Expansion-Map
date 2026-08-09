const fs = require('fs');
let code = fs.readFileSync('src/ui/Map3D.tsx', 'utf-8');

const oldBlock = `  const handleAgentDiscovery = async () => {
    const added = await map.runAgentDiscovery(selectedNodeId || undefined);
    setAgentMsg(
      added > 0
        ? 'Агент добавил ' + added + ' новых проблем в граф.'
        : 'Агент не нашёл новых кандидатов.'
    );
    setTimeout(() => setAgentMsg(null), 4000);
  };`;

const newBlock = `  const handleAgentDiscovery = async () => {
    const res = await map.runAgentDiscovery(selectedNodeId || undefined);
    if (res.error) {
      setAgentMsg('Ошибка агента: ' + res.error);
    } else {
      setAgentMsg(
        res.added > 0
          ? 'Агент добавил ' + res.added + ' новых проблем в граф.'
          : 'Агент не нашёл новых кандидатов.'
      );
    }
    setTimeout(() => setAgentMsg(null), 5000);
  };`;

if (code.includes(oldBlock)) {
    code = code.replace(oldBlock, newBlock);
    fs.writeFileSync('src/ui/Map3D.tsx', code);
    console.log('Patched Map3D.tsx');
} else {
    console.log('Could not find block in Map3D.tsx');
}
