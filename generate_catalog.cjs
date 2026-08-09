const fs = require('fs');

const zones = ["math", "physics", "informatics", "medicine", "pharmacology", "economics", "ethics"];
const types = ["scientific_task", "core_singularity"];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const problems = [];
let idCounter = 1;

// Base ones
const prefixes = [
  "Сингулярность", "Предел", "Критическая точка", "Коллапс", "Расходимость", "Бифуркация",
  "Фазовый переход", "Аномалия", "Квантовый скачок", "Разрыв", "Неопределенность"
];
const subjects = [
  "гравитационного поля", "вычислительной сложности", "экономической функции", "этического выравнивания",
  "ДНК-свертки", "метаболизма", "квантовой запутанности", "распределения простых чисел",
  "потока Риччи", "уравнений Навье-Стокса", "Янга-Миллса", "Римана-Дзета функции"
];
const hints = [
  "Деление на ноль при сближении частиц", "Бесконечная кривизна", "Сингулярность 0/0 в пределе",
  "Расходимость интеграла", "Полюс второго порядка", "Асимптотическое замирание",
  "Взрыв дисперсии", "Информационный парадокс", "Топологический дефект"
];

for (let i = 0; i < 100; i++) {
  const p = prefixes[randomInt(0, prefixes.length - 1)];
  const s = subjects[randomInt(0, subjects.length - 1)];
  const title = p + " " + s + " #" + idCounter;
  
  const costU = randomInt(10, 1000) * 1000000;
  const costS = randomInt(1, 100) * 100000;
  const gain = costU * randomInt(2, 5);
  const loss = costU * randomInt(5, 10);
  
  problems.push({
    id: "catalog-node-" + idCounter,
    title: title,
    description: "Исследование сингулярности в контексте " + s + ". Разрешение проблемы методами RICIS.",
    state: "unresolved",
    type: types[randomInt(0, 1)],
    targetFunction: "lim_{x \\to 0} F(x) = \\infty",
    zoneIds: [zones[randomInt(0, zones.length - 1)]],
    dependencyIds: [], // We'll link them in a tree later maybe? Or leave empty for catalog root expansion
    dependentIds: [],
    fractalDepth: randomInt(1, 3),
    economic: {
      costUnresolved: costU,
      costToSolve: costS,
      marketGain: gain,
      riskLoss: loss
    },
    rewardClass: "reputation",
    prizeNote: "Catalog discovery",
    singularityHint: hints[randomInt(0, hints.length - 1)]
  });
  idCounter++;
}

// Build a dependency chain
for (let i = 1; i < problems.length; i++) {
    // 50% chance to depend on an earlier one
    if (Math.random() > 0.5) {
        const parentIdx = randomInt(0, i - 1);
        problems[i].dependencyIds.push(problems[parentIdx].id);
        problems[parentIdx].dependentIds.push(problems[i].id);
    }
}

const out = `import { ProblemNode } from './types';

export const KNOWN_SINGULARITY_PROBLEMS: ProblemNode[] = ${JSON.stringify(problems, null, 2)};
`;

fs.writeFileSync('src/model/catalog.ts', out);
console.log('Generated src/model/catalog.ts with 100 problems');
