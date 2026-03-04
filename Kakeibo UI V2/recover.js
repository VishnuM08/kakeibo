const fs = require('fs');
const path = require('path');

const historyDir = process.env.APPDATA + '\\Code\\User\\History';
let latestMatch = null;
let latestTime = 0;

function scanDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const p = path.join(dir, f);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        scanDir(p);
      } else {
        if (p.endsWith('.json')) continue; // skip entries.json
        try {
          const contents = fs.readFileSync(p, 'utf8');
          // We are looking for the corrupted 4000 line file, or the original 2283 line file.
          // Let's find one that has the word "AppMain" and has length around 90000+ bytes.
          if (contents.includes('export function AppMain') && contents.length > 50000) {
            // Find the most recent one that is NOT 4000+ lines (we corrupted it)
            const lines = contents.split('\\n').length;
            if (lines > 1500 && lines < 3000) {
              if (stat.mtimeMs > latestTime) {
                latestTime = stat.mtimeMs;
                latestMatch = p;
              }
            }
          }
        } catch (e) {}
      }
    }
  } catch (e) {}
}

scanDir(historyDir);
if (latestMatch) {
  console.log('FOUND BACKUP:', latestMatch);
  // Restore it
  const dest = 'src/components/AppMain.tsx';
  fs.copyFileSync(latestMatch, dest);
  console.log('Restored AppMain.tsx to', dest);
} else {
  console.log('No backup found.');
}
