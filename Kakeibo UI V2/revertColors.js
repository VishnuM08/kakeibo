const fs = require('fs');
const path = require('path');

const dir = './src';
const replacements = {
  '#10b981': '#007aff',
  '#10B981': '#007AFF', // though css is case sensitive, we just map it back
  '#34d399': '#0a84ff',
  '#34D399': '#0A84FF',
  '#059669': '#0051d5',
  '#059669': '#0051D5',
  '#6ee7b7': '#4facfe',
  '#6EE7B7': '#4FACFE'
};

function processDir(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      for (const [oldC, newC] of Object.entries(replacements)) {
        if (content.includes(oldC)) {
          content = content.split(oldC).join(newC);
          modified = true;
        }
      }
      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log(`Reverted ${fullPath}`);
      }
    }
  }
}

processDir(dir);
console.log('Global aesthetic color swap reverted!');
