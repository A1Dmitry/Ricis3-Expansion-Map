const fs = require('fs');
let code = fs.readFileSync('src/ui/AddNodeModal.tsx', 'utf-8');

if (!code.includes('const [errorMsg, setErrorMsg]')) {
  code = code.replace(
    `const [loadingAI, setLoadingAI] = useState(false);`,
    `const [loadingAI, setLoadingAI] = useState(false);\n  const [errorMsg, setErrorMsg] = useState('');`
  );
}

const handleAI = `const handleAI = async () => {
    if (!title && !targetFunction) {
      setErrorMsg("Введите хотя бы название или функцию!");
      return;
    }
    setErrorMsg('');
    setLoadingAI(true);
    try {
      const res = await fetch('/api/aiAssistantNode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, targetFunction })
      });
      const data = await res.json();
      if (data.title && !title) setTitle(data.title);
      if (data.normalizedFunction) setTargetFunction(data.normalizedFunction);
      if (data.description) setDescription(data.description);
      if (data.hint) setHint(data.hint);
      if (data.link) setLink(data.link);
    } catch (e) {
      console.error(e);
      setErrorMsg('Ошибка при запросе к ИИ');
    }
    setLoadingAI(false);
  };`;

// replace handleAI
code = code.replace(/const handleAI = async \(\) => \{[\s\S]*?setLoadingAI\(false\);\n  \};/, handleAI);

// render errorMsg next to AI button
const errorHtml = `{errorMsg && <p className="text-red-400 text-[10px] col-span-2">{errorMsg}</p>}`;

code = code.replace(
  `{loadingAI ? 'Загрузка...' : 'Поиск ИИ 🪄'}\n            </button>\n          </div>`,
  `{loadingAI ? 'Загрузка...' : 'Поиск ИИ 🪄'}\n            </button>\n          </div>\n          ` + errorHtml
);

fs.writeFileSync('src/ui/AddNodeModal.tsx', code);
console.log('Patched AddNodeModal.tsx');
