const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src').filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  // Replace: import { foo } from "package@1.2.3" -> "package"
  const newContent = content.replace(/(from\s+['"])([^'"]+?)@\d+\.\d+\.\d+(['"])/g, '$1$2$3');
  
  // Or: import "package@1.2.3" -> import "package"
  const newContent2 = newContent.replace(/(import\s+['"])([^'"]+?)@\d+\.\d+\.\d+(['"])/g, '$1$2$3');
  
  if (content !== newContent2) {
    fs.writeFileSync(file, newContent2, 'utf8');
    console.log(`Fixed imports in ${file}`);
  }
});
