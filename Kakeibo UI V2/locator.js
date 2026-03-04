const fs = require('fs');
const txt = fs.readFileSync('src/components/AppMain.tsx', 'utf8');

console.log('--- Components Index Log ---');
console.log('MobileSearchModal:', txt.indexOf('MobileSearchModal'));
console.log('SearchFilters:', txt.indexOf('SearchFilters'));
console.log('<Search:', txt.indexOf('<Search'));
console.log('Add Expense Button:', txt.indexOf('{/* Add Expense */}'));
console.log('Budget Card:', txt.indexOf('{/* Budget Overview Card */}'));
console.log('Quick Actions Grid:', txt.indexOf('{/* Quick Actions Grid */}'));
console.log('Today Exp Panel:', txt.indexOf("{/* Today's Expenses Panel */}"));
console.log('Calendar Widget:', txt.indexOf('{/* Calendar Widget */}'));
console.log('Calendar original marker:', txt.indexOf('{/* Calendar */}'));
