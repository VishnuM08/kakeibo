const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/vishn/Downloads/kakeibo/kakeibo-frontend/src/components/AddExpenseModal.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const replacements = [
    // Backgrounds & Gradients
    { from: /bg-\[#f4f4f5\]/g, to: 'bg-[#f5f5f7]' },
    { from: /bg-\[#0a0a0a\]/g, to: 'bg-[#121212]' },
    { from: /bg-\[#1a1a1a\]/g, to: 'bg-[#1c1c1e]' },
    { from: /bg-\[#2a2a2a\]/g, to: 'bg-[#2c2c2e]' },
    // Hover States
    { from: /hover:bg-\[#1a1a1a\]/g, to: 'hover:bg-[#2c2c2e]' },
    { from: /hover:bg-\[#2a2a2a\]/g, to: 'hover:bg-white/10' },
    // Borders
    { from: /border-\[#1a1a1a\]/g, to: 'border-white/10' },
    { from: /border-\[#2a2a2a\]/g, to: 'border-white/10' },
    // Kakeibo Blue
    { from: /#0066FF/g, to: '#007aff' },
    { from: /#0052DD/g, to: '#0051d5' },
    // Grays
    { from: /bg-gray-50/g, to: 'bg-[#f5f5f7]' },
    { from: /bg-gray-100/g, to: 'bg-black/5' },
    { from: /hover:bg-gray-50/g, to: 'hover:bg-black/5' },
    { from: /hover:bg-gray-100/g, to: 'hover:bg-black/8' },
    { from: /border-gray-100/g, to: 'border-black/5' },
    { from: /border-gray-200/g, to: 'border-black/10' },
    { from: /text-gray-400/g, to: 'text-white/50' },
    { from: /text-gray-500/g, to: 'text-black/45' }, // In dark mode conditions, we will manual check but this handles mostly light mode
    { from: /text-gray-600/g, to: 'text-black/60' },
    // Shadows
    { from: /shadow-\[#0066FF\]\/20/g, to: 'shadow-blue-500/20' },
    { from: /shadow-\[#0066FF\]\/30/g, to: 'shadow-blue-500/30' },
    // Emerald -> Green (Kakeibo style)
    { from: /emerald-50/g, to: 'green-100' },
    { from: /emerald-200/g, to: 'green-200' },
    { from: /emerald-400/g, to: 'green-400' },
    { from: /emerald-500/g, to: 'green-500' },
    { from: /emerald-600/g, to: 'green-500' }, 
    { from: /emerald-700/g, to: 'green-700' },
    { from: /emerald-900/g, to: 'green-700' },
    { from: /text-emerald/g, to: 'text-green' },
    { from: /bg-emerald/g, to: 'bg-green' },
    { from: /border-emerald/g, to: 'border-green' },
    { from: /from-emerald/g, to: 'from-green' },
    { from: /to-emerald/g, to: 'to-green' }
];

replacements.forEach(r => {
    content = content.replace(r.from, r.to);
});

// A safe fallback for when dark mode uses text-black/45 which is incorrect
// So let's replace "isDarkMode ? 'text-black/45'" with "isDarkMode ? 'text-white/50'"
content = content.replace(/isDarkMode \? 'text-black\/45'/g, "isDarkMode ? 'text-white/50'");
content = content.replace(/isDarkMode \? 'text-black\/60'/g, "isDarkMode ? 'text-white/60'");

fs.writeFileSync(filePath, content);
console.log('Successfully replaced missing classes.');
