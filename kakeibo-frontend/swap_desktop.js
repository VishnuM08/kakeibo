const fs = require('fs');
const file = 'src/components/AppMain.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Grid layout swap
content = content.replace('gridTemplateColumns: "380px 1fr"', 'gridTemplateColumns: "1fr 340px"');

const startMarker = "{/* Today's Expenses Panel */}";
const mobileMarker = "{/* Today's Expenses Section (Mobile Only) */}";

const startIdx = content.indexOf(startMarker);
const mobileIdx = content.indexOf(mobileMarker);

if (startIdx === -1 || mobileIdx === -1) {
    console.error("Could not find boundaries.");
    process.exit(1);
}

// Find the 4th </div> backwards from mobileMarker
let endIdx = mobileIdx;
let divCount = 0;
while (divCount < 4 && endIdx > startIdx) {
    endIdx--;
    if (content.substr(endIdx, 6) === "</div>") {
        divCount++;
    }
}

if (divCount < 4) {
    console.error("Could not trace back 4 divs.");
    process.exit(1);
}

const extractEndIdx = endIdx + 6; 
const panelContent = content.substring(startIdx, extractEndIdx);

// Remove panel
content = content.substring(0, startIdx) + content.substring(extractEndIdx);

// Insert position
const rightColMarker = "{/* Right Column: Calendar + Today's Expenses */}";
let insertIdx = content.indexOf(rightColMarker);
let found = false;
while (insertIdx > 0) {
    insertIdx--;
    if (content.substr(insertIdx, 6) === "</div>") {
        found = true;
        break;
    }
}

if (!found) {
    console.error("Could not find left column close.");
    process.exit(1);
}

// Insert panel inside the left column
content = content.substring(0, insertIdx) + panelContent + "\n\n" + content.substring(insertIdx);

// Minor text update in rightColMarker comment to be accurate
content = content.replace("{/* Right Column: Calendar + Today's Expenses */}", "{/* Right Column: Calendar Widget */}");

fs.writeFileSync(file, content);
console.log("Successfully shifted layout!");
