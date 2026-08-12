const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        arrayOfFiles.push(path.join(__dirname, dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const srcFiles = getAllFiles('src', []);
const fileContents = srcFiles.map(f => fs.readFileSync(f, 'utf8'));

const deadCode = [];

srcFiles.forEach(file => {
  if (file.includes('main.tsx') || file.includes('vite-env.d.ts') || file.includes('App.tsx')) return;
  const basename = path.basename(file).replace(/\.tsx?$/, '');
  let isUsed = false;
  
  for (let i = 0; i < fileContents.length; i++) {
    if (srcFiles[i] === file) continue;
    // Check if basename appears in other files
    if (fileContents[i].includes(basename)) {
      isUsed = true;
      break;
    }
  }
  
  if (!isUsed) {
    deadCode.push(file.replace(__dirname + '/', ''));
  }
});

console.log(deadCode.join('\n'));
