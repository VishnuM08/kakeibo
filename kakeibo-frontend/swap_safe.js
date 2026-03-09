// Safe script using robust line matching
const fs = require('fs');
const file = 'src/components/AppMain.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// 1. Swap grid
const gridIdx = lines.findIndex(l => l.includes('gridTemplateColumns: "380px 1fr"'));
if (gridIdx > -1) {
  lines[gridIdx] = lines[gridIdx].replace('380px 1fr', '1fr 340px');
  console.log('Swapped Grid Template');
}

// 2. Extract Panel
const startIdx = lines.findIndex(l => l.includes('{/* Today\\'s Expenses Panel */}'));
const mobileSectionIdx = lines.findIndex(l => l.includes('{/* Today\\'s Expenses Section (Mobile Only) */}'));

if (startIdx === -1 || mobileSectionIdx === -1) {
  throw new Error("Could not find markers");
}

let endIdx = mobileSectionIdx;
let encounteredDivs = 0;
// We know that between the end of the Panel and the Mobile Section there are exactly 4 closing divs + 1 closing bracket block
// </div> // panel close
// </div> // right column close
// </div> // grid container close
// </div> // desktop data split wrapper close
// )} // isDesktop condition close
// Let's backtrack from mobileSectionIdx and find the panel close.
// Actually, the panel closes with the 4th </div> going upwards from mobileSectionIdx.
for (let i = mobileSectionIdx - 1; i > startIdx; i--) {
  if (lines[i].includes('</div>')) {
    encounteredDivs++;
    if (encounteredDivs === 4) {
      endIdx = i; // This is the </div> that closes the Today's Expenses Panel
      break;
    }
  }
}

console.log('Extracting Panel from lines', startIdx + 1, 'to', endIdx + 1);

// Extract panel lines
// We must extract from startIdx to endIdx inclusive.
const panelLines = lines.splice(startIdx, endIdx - startIdx + 1);

// 3. Insert Panel into Left Column
// We must find the closing of the Left Column.
// The left column closes right before the Right Column opens.
const rightColMarkerIdx = lines.findIndex(l => l.includes('{/* Right Column: Calendar + Today\\'s Expenses */}'));

// Trace upwards to find the </div> that closes the left column.
let insertIdx = rightColMarkerIdx;
let foundLeftColClose = false;
for (let i = rightColMarkerIdx - 1; i > 0; i--) {
  if (lines[i].includes('</div>')) {
    // This is the closing tag of the Left Column. We must insert BEFORE it so we are inside the Left Column.
    insertIdx = i;
    foundLeftColClose = true;
    break;
  }
}

if (!foundLeftColClose) throw new Error("Could not find left column closing tag");

console.log('Inserting Panel at line', insertIdx + 1);

// Insert an empty line + Panel lines
lines.splice(insertIdx, 0, '', ...panelLines);

fs.writeFileSync(file, lines.join('\n'));
console.log('Successfully swapped layout!');
