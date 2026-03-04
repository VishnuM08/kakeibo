const fs = require('fs');
const file = 'src/components/AppMain.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// 1. Swap grid layout
const gridIdx = lines.findIndex(l => l.includes('gridTemplateColumns: "380px 1fr"'));
if (gridIdx > -1) {
  lines[gridIdx] = lines[gridIdx].replace('380px 1fr', '1fr 340px');
  console.log('Swapped grid template at line', gridIdx);
}

// 2. Extract Panel
const startIdx = lines.findIndex(l => l.includes('{/* Today\\'s Expenses Panel */}'));
if (startIdx === -1) throw new Error('Could not find panel start');

// To find the exact end of the panel, we know it closes right before the Mobile Section.
// Let's find the mobile section:
const mobileIdx = lines.findIndex(l => l.includes('{/* Today\\'s Expenses Section (Mobile Only) */}'));
// Above mobileIdx, we have:
// </div> // grid wrapper
// </div> // two-col grid
// </div> // right-col
// </div> // panel itself
const endIdx = mobileIdx - 5; 

console.log('Extracting from', startIdx, 'to', endIdx);
const panelLines = lines.splice(startIdx, endIdx - startIdx + 1);

// 3. Insert Panel before the end of the Left Column
// We must find {/* Right Column: Calendar + Today's Expenses */}
const rightColIdx = lines.findIndex(l => l.includes('{/* Right Column: Calendar + Today\\'s Expenses */}'));
console.log('Right col starts at', rightColIdx);

// The left column closes with a </div>. Let's insert right above the Right Column marker, 
// wait, the Right Column marker might have an empty line above it.
// Actually, just inserting it BEFORE the Left column's closing </div> is structurally sound.
// Let's traceback from rightColIdx to find the </div> that closes the Left Column.
let insertIdx = rightColIdx;
while (insertIdx > 0 && !lines[insertIdx-1].includes('</div>')) {
  insertIdx--;
}
// Actually, it should be inserted *inside* the Left Column. So before the </div> that closes the Left Column.
// Lines before rightColIdx usually are:
//   </div>
// </div>
// 
// {/* Right Column

// To be safe, let's insert the panel at `rightColIdx - 1` (before the empty line), but we need to ensure 
// it is inside the left column.
// Wait, the Left Column is a flex column. If we append to the bottom of it, we just insert before its closing tag.
// Let's find:
//   </div>
// </div>
// 
// {/* Right Column
lines.splice(insertIdx - 1, 0, ...panelLines);

fs.writeFileSync(file, lines.join('\n'));
console.log('Success');
