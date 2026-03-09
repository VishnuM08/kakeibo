const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\vishn\\.gemini\\antigravity\\brain';
let bestFile = null;
let bestLength = 0;

function scanLogDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const p = path.join(dir, f);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        scanLogDir(p);
      } else {
        if (f.endsWith('.tsx') || f.includes('log') || f.includes('output') || f.includes('AppMain')) {
          try {
            const contents = fs.readFileSync(p, 'utf8');
            if (contents.includes('export function AppMain') && contents.includes('MobileSearchModal')) {
              // Extract the component code from the log
              const startIdx = contents.indexOf('import {');
              if (startIdx !== -1) {
                // Approximate extraction
                let len = contents.length;
                if (len > bestLength && len > 50000 && len < 200000) { // Looking for ~90k bytes
                  bestLength = len;
                  bestFile = p;
                }
              }
            }
          } catch (e) {}
        } else {
            // Also just check any text file
            try {
              if (stat.size > 50000 && stat.size < 500000) {
                 const contents = fs.readFileSync(p, 'utf8');
                 if (contents.includes('export function AppMain({')) {
                    if (stat.size > bestLength) {
                      bestLength = stat.size;
                      bestFile = p;
                    }
                 }
              }
            } catch(e) {}
        }
      }
    }
  } catch (e) {}
}

scanLogDir(brainDir);
if (bestFile) {
  console.log('FOUND IN BRAIN:', bestFile, 'Length:', bestLength);
} else {
  console.log('Not found in brain logs.');
}
