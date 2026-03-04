const fs = require('fs');
const path = require('path');

const historyDir = process.env.APPDATA + '\\Code\\User\\History';

function findAppMainBackups() {
  const dirs = fs.readdirSync(historyDir);
  let bestFile = null;
  let bestTime = 0;

  for (const dirName of dirs) {
    const dPath = path.join(historyDir, dirName);
    if (fs.statSync(dPath).isDirectory()) {
      const entriesPath = path.join(dPath, 'entries.json');
      if (fs.existsSync(entriesPath)) {
        try {
          const entries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
          // Check if this directory corresponds to AppMain.tsx
          // Normally entries.json looks like: { "version": 1, "resource": "file:///c%3A/Users/.../AppMain.tsx", "entries": [...] }
          if (entries.resource && entries.resource.includes('AppMain.tsx')) {
            console.log('Found History Dir for AppMain.tsx:', dPath);
            for (const entry of entries.entries) {
              const fileId = entry.id;
              const timestamp = entry.timestamp;
              const fullPath = path.join(dPath, fileId);
              if (fs.existsSync(fullPath)) {
                const stat = fs.statSync(fullPath);
                if (stat.size > 50000 && stat.size < 200000) {
                   if (timestamp > bestTime) {
                     bestTime = timestamp;
                     bestFile = fullPath;
                   }
                }
              }
            }
          }
        } catch (e) {}
      }
    }
  }

  if (bestFile) {
    console.log('RECOVERED FILE:', bestFile);
    fs.copyFileSync(bestFile, 'src/components/AppMain.tsx');
    console.log('Restored AppMain.tsx successfully.');
  } else {
    console.log('Could not locate backup in entries.json');
  }
}

findAppMainBackups();
