const fs = require('fs');
const file = 'src/components/AppMain.tsx';
let content = fs.readFileSync(file, 'utf8');

// The Goal is to place these in the Left Column of the Main Two-Column Grid:
// 1. Search Bar
// 2. Stat Cards Row (Total Month Spent / Budget Remaining)
// 3. Quick Actions Grid
// 4. Today's Expenses Panel
// (Add Expense button can be either kept or removed, let's keep it below Stats or where it is. Actually, I'll just remove Add Expense Button and Budget Overview Component out of Left Column if they are redundant, but let's just reorder).

// --- EXTRACTION ---
// 1. Search Bar
const searchStart = content.indexOf('{/* Search Bar */}');
const searchEnd = content.indexOf('</button>', searchStart) + '</button>'.length;
const searchBlock = content.substring(searchStart, searchEnd);
// Remove Search Bar from original position (Header)
content = content.substring(0, searchStart) + content.substring(searchEnd);

// 2. Stat Cards Row
const statsStart = content.indexOf('{/* Stat Cards Row */}');
// To find the end of Stat Cards Row, it's a grid with 3 cards. It closes before {/* Desktop Data Split Wrapper */} ? No, it closes before {/* Main Two-Column Grid */}
const mainGridStart = content.indexOf('{/* Main Two-Column Grid */}');
const statsBlock = content.substring(statsStart, mainGridStart);
// Remove Stat Cards Row from original position
content = content.substring(0, statsStart) + content.substring(mainGridStart);

// 3. Quick Actions Grid
const qaStart = content.indexOf('{/* Quick Actions Grid */}');
const qaEndMarker = '                              {label}\n                            </button>\n                          ))}\n                        </div>\n                      </div>';
const qaEnd = content.indexOf(qaEndMarker, qaStart) + qaEndMarker.length;
const qaBlock = content.substring(qaStart, qaEnd);
// Remove QA block
content = content.substring(0, qaStart) + content.substring(qaEnd);

// 4. Today's Expenses Panel
const teStart = content.indexOf("{/* Today's Expenses Panel */}");
// This panel ends right before `{/* Right Column: Calendar Widget */}` inside the left column.
const rightColStart = content.indexOf('{/* Right Column: Calendar Widget */}');
// Track back </div>
let insertIdx = rightColStart;
while (insertIdx > 0) {
  insertIdx--;
  if (content.substr(insertIdx, 6) === "</div>") {
    break;
  }
}
const teBlock = content.substring(teStart, insertIdx);
// Remove TE Block
content = content.substring(0, teStart) + content.substring(insertIdx);

// Note: Left Column currently holds "{/* Add Expense */}" and "{/* Budget Overview Card */} ".
// We need to overwrite the Left Column contents entirely, or just prepend our ordered blocks.
// Let's find where the Left Column starts.
const leftColStartStr = '{/* Left Column */}';
const leftColIdx = content.indexOf(leftColStartStr);
const leftColOpenDiv = content.indexOf('<div', leftColIdx);
const leftColCloseDiv = content.indexOf('>', leftColOpenDiv) + 1; // End of <div style={{...}}>

// Let's inject our ordered blocks inside the Left Column.
// Order: Search, Stats, QA, TE.
// We might need to wrap Search and Stats in full-width containers if they aren't already.
// Search Block currently has `maxWidth: 420, flex: 1`. 
const formattedSearch = searchBlock.replace('maxWidth: 420,', 'width: "100%", maxWidth: "100%",');

// Inject right after the Left Column's opening <div>
const injection = `\n` + 
  formattedSearch + `\n\n` + 
  statsBlock + `\n` + 
  qaBlock + `\n\n` + 
  teBlock + `\n`;

content = content.substring(0, leftColCloseDiv) + injection + content.substring(leftColCloseDiv);

fs.writeFileSync(file, content);
console.log("Successfully assembled new Desktop Layout!");
