const fs = require('fs');
const file = 'src/model/initialMap.ts';
let code = fs.readFileSync(file, 'utf-8');

const newZones = `    {
      id: 'chemistry',
      name: 'Химия',
      description: 'Квантовая химия, молекулярная динамика.',
      nodeIds: [],
      economicProfile: { costUnresolved: 4000, costToSolve: 300, marketGain: 35000, riskLoss: 20000 }
    },
    {
      id: 'biology',
      name: 'Биология',
      description: 'Генетика, белковые структуры.',
      nodeIds: [],
      economicProfile: { costUnresolved: 6000, costToSolve: 400, marketGain: 45000, riskLoss: 25000 }
    },
    {
      id: 'ecology',
      name: 'Экология',
      description: 'Климатические модели, устойчивое развитие.',
      nodeIds: [],
      economicProfile: { costUnresolved: 10000, costToSolve: 1000, marketGain: 80000, riskLoss: 500000 }
    },
    {
      id: 'astrophysics',
      name: 'Астрономия и астрофизика',
      description: 'Космология, черные дыры, темная материя.',
      nodeIds: [],
      economicProfile: { costUnresolved: 2000, costToSolve: 2000, marketGain: 50000, riskLoss: 5000 }
    },
    {
      id: 'materials',
      name: 'Материаловедение',
      description: 'Сверхпроводники, метаматериалы.',
      nodeIds: [],
      economicProfile: { costUnresolved: 5000, costToSolve: 500, marketGain: 60000, riskLoss: 10000 }
    },
    {
      id: 'linguistics',
      name: 'Лингвистика',
      description: 'Семантика, LLM-инварианты.',
      nodeIds: [],
      economicProfile: { costUnresolved: 3000, costToSolve: 200, marketGain: 20000, riskLoss: 5000 }
    }`;

// find where ethics is added
if (code.includes("id: 'ethics',") && !code.includes("id: 'chemistry',") ) {
  code = code.replace(
    /id: 'ethics',[\s\S]*?\}[\s]*\]/,
    match => {
       // match ends with \n    }\n  ]
       return match.replace(/\}[\s]*\]$/, "},\n" + newZones + "\n  ]")
    }
  );
  fs.writeFileSync(file, code);
  console.log('Zones added.');
} else {
  console.log('Zones already added or failed to match.');
}
