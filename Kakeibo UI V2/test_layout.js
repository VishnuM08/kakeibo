const fs = require('fs');

const file = 'src/components/AppMain.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. EXTRACT SEARCH BLOCK
// Currently, it's at:
//                     {/* Search Bar */}
//                     <button ...> ... </button>
const searchStartId = '{/* Search Bar */}';
const searchStartIndex = content.indexOf(searchStartId);
if (searchStartIndex === -1) throw new Error("Could not find Search Bar");
// Find the closing </button> after searchStartIndex
let searchEndIndex = content.indexOf('</button>', searchStartIndex) + '</button>'.length;
const searchBlock = content.substring(searchStartIndex, searchEndIndex);

// 2. Remove Search Block from original position
content = content.substring(0, searchStartIndex) + content.substring(searchEndIndex);

// Let's also extract "Total Month Spent / Budget Remaining" which currently lives in:
//                     {/* Budget Overview Card */}
// Wait! "Total Month spent - Budget Remainig" refers to the two Top Stat Cards!
// They are located inside: {/* Desktop Data Split Wrapper */} ->  {/* Header Section */} -> (Top stats are there?)
// Let's locate the Hero Stat Cards.
const statCardStr = 'Total Spent This Month';
const statIdx = content.indexOf(statCardStr);
// The stat cards are inside a grid: <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
const statsGridStartIdx = content.indexOf('<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>');
console.log('Search Block Extracted. Length:', searchBlock.length);
console.log('Stats Grid found at:', statsGridStartIdx);

