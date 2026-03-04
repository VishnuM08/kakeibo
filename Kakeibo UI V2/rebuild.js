const fs = require('fs');
const file = 'src/components/AppMain.tsx';
let content = fs.readFileSync(file, 'utf8');

// Ensure isDesktop exists
if (!content.includes('const [isDesktop')) {
  const insertHookIdx = content.indexOf('  const [smsPrefill, setSmsPrefill] = useState');
  const hookInjection = `
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);\n`;
  content = content.substring(0, insertHookIdx) + hookInjection + content.substring(insertHookIdx);
}

// Find where to inject the Desktop layout
const headerStartIdx = content.indexOf('<header className="mb-5">');
if (headerStartIdx === -1) throw new Error("Header not found");

// Extract the Today's expenses section to reuse in Desktop layout
// We need to find the actual list rendering. It's under <section className="mb-5"> 
// Wait, the mobile version uses `todaysExpenses` array. Let's see if `todaysExpenses` is defined in the component.
// It might be `expenses.filter` locally. I will write a fresh clean rendering for desktop Today's Expenses.

const desktopJSX = `
        {/* ================= DESKTOP LAYOUT ================= */}
        {isDesktop && (
          <div className="w-full max-w-[1440px] mx-auto grid grid-cols-[1fr_340px] gap-8 mt-2">
            
            {/* LEFT MAIN COLUMN */}
            <div className="flex flex-col gap-6">
              
              {/* 1. Search */}
              <button
                className="glass-panel w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[15px] font-medium transition-all shadow-sm group"
                style={{
                  background: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.5)",
                  border: \`1px solid \${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}\`,
                  color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)"
                }}
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="w-5 h-5 text-[#007aff] group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                <span>Search expenses, categories...</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 dark:bg-black/20 text-[#007aff]" onClick={(e) => { e.stopPropagation(); setIsHelpOpen(true); }}><HelpCircle className="w-5 h-5" /></div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 dark:bg-black/20 text-[#007aff]" onClick={(e) => { e.stopPropagation(); setIsAnalyticsOpen(true); }}><BarChart3 className="w-5 h-5" /></div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 dark:bg-black/20 text-[#007aff]" onClick={(e) => { e.stopPropagation(); if (onToggleDarkMode) onToggleDarkMode(); }}>{isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 dark:bg-black/20 text-[#007aff]" onClick={(e) => { e.stopPropagation(); if (onOpenSettings) onOpenSettings(); }}><Settings className="w-5 h-5" /></div>
                </div>
              </button>

              {/* 2. Total Month Spent - Budget Remaining */}
              <div className="grid grid-cols-2 gap-5">
                <div className="glass-card rounded-[24px] p-6 shadow-sm relative overflow-hidden" style={{ background: isDarkMode ? 'linear-gradient(135deg, rgba(0,122,255,0.8) 0%, rgba(10,132,255,0.5) 100%)' : 'linear-gradient(135deg, rgba(0,122,255,0.75) 0%, rgba(79,172,254,0.75) 100%)' }}>
                   <p className="text-white/80 text-[13px] font-semibold mb-2 uppercase tracking-widest">{new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</p>
                   <p className="text-white text-[44px] font-bold tracking-tight leading-none mb-1">₹{monthTotal.toFixed(0)}</p>
                   <p className="text-white/80 text-[14px] font-medium">Total Spent This Month</p>
                </div>
                <div className="glass-card rounded-[24px] p-6 shadow-sm relative overflow-hidden cursor-pointer" onClick={() => setIsBudgetModalOpen(true)} style={{ background: isDarkMode ? 'linear-gradient(135deg, rgba(40,167,69,0.75) 0%, rgba(52,199,89,0.4) 100%)' : 'linear-gradient(135deg, rgba(40,167,69,0.7) 0%, rgba(100,210,120,0.7) 100%)' }}>
                   <p className="text-white/80 text-[13px] font-semibold mb-2 uppercase tracking-widest">Budget Remaining</p>
                   <p className="text-white text-[44px] font-bold tracking-tight leading-none mb-1">{monthlyBudget ? \`₹\${Math.max(0, monthlyBudget - monthTotal).toFixed(0)}\` : '—'}</p>
                   <p className="text-white/80 text-[14px] font-medium">{monthlyBudget ? \`of ₹\${monthlyBudget.toLocaleString()} budget\` : 'Tap to set a budget'}</p>
                </div>
              </div>

              {/* 3. Quick Actions */}
              <div className="glass-panel p-6 rounded-[24px]" style={{
                  background: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)",
                  border: \`1px solid \${isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}\`
              }}>
                <p className={\`text-[13px] font-bold uppercase tracking-widest mb-4 \${isDarkMode ? "text-white/40" : "text-black/40"}\`}>Quick Actions</p>
                <div className="grid grid-cols-5 gap-3">
                   {[ { i: Plus, l: "Add", a: () => setIsAddModalOpen(true) },
                      { i: Repeat, l: "Recurring", a: () => setIsRecurringModalOpen(true) }, 
                      { i: Target, l: "Savings", a: () => setIsSavingsGoalsOpen(true) }, 
                      { i: Calendar, l: "Bills", a: () => setIsBillRemindersOpen(true) }, 
                      { i: Download, l: "Export", a: handleExportToCSV } ].map(q => (
                     <button key={q.l} onClick={q.a} className="flex flex-col items-center gap-2.5 p-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)", border: \`1px solid \${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}\` }}>
                        <q.i className="w-6 h-6 text-[#007aff]" />
                        <span className="text-[13px] font-semibold text-[#007aff]">{q.l}</span>
                     </button>
                   ))}
                </div>
              </div>

              {/* 4. Today's Expenses */}
              <div className="glass-panel rounded-[24px] overflow-hidden flex flex-col" style={{
                  background: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)",
                  border: \`1px solid \${isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}\`,
                  minHeight: 300
              }}>
                 <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>
                    <div>
                       <h2 className={\`text-[18px] font-bold \${isDarkMode ? "text-white" : "text-black"}\`}>Today's Expenses</h2>
                    </div>
                 </div>
                 <div className="p-4 flex flex-col gap-2">
                    {expenses.filter(e => new Date(e.date).toDateString() === new Date().toDateString()).length > 0 ? (
                       expenses.filter(e => new Date(e.date).toDateString() === new Date().toDateString()).map(expense => {
                          const Icon = getCategoryIcon(expense.category);
                          return (
                             <div key={expense.id} className="flex items-center gap-4 p-3 rounded-2xl cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors" onClick={() => { setEditingExpense({ ...expense, isSyncing: expense.isSyncing ?? false }); setIsEditModalOpen(true); }}>
                                <div className={\`w-12 h-12 rounded-[14px] flex items-center justify-center bg-gradient-to-br \${getCategoryColor(expense.category)} text-white shadow-sm\`}>
                                   <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                   <p className={\`text-[16px] font-bold truncate \${isDarkMode ? "text-white" : "text-black"}\`}>{expense.description}</p>
                                   <p className={\`text-[13px] \${isDarkMode ? "text-white/50" : "text-black/50"}\`}>{expense.category}</p>
                                </div>
                                <p className="text-[17px] font-bold text-[#ff3b30] shrink-0">-₹{expense.amount.toLocaleString()}</p>
                             </div>
                          );
                       })
                    ) : (
                       <div className="py-12 flex flex-col items-center justify-center text-center">
                          <div className={\`w-16 h-16 rounded-full flex items-center justify-center mb-3 \${isDarkMode ? "bg-white/5" : "bg-black/5"}\`}>
                             <Calendar className={\`w-8 h-8 \${isDarkMode ? "text-white/20" : "text-black/20"}\`} />
                          </div>
                          <p className={\`text-[15px] font-medium \${isDarkMode ? "text-white/40" : "text-black/40"}\`}>No expenses yet today</p>
                       </div>
                    )}
                 </div>
              </div>

            </div>

            {/* RIGHT CONTEXT COLUMN */}
            <div className="flex flex-col gap-6">
              <CalendarView
                  expenses={expenses}
                  isDarkMode={isDarkMode}
                  onDateSelect={(d) => {
                    const exps = expenses.filter(e => new Date(e.date).toDateString() === d.toDateString());
                    if (exps.length > 0) {
                      setSelectedDate(d);
                      setSelectedDayExpenses(exps);
                      setIsDailyPopupOpen(true);
                    } else {
                      setAddExpenseDate(d);
                      setIsAddModalOpen(true);
                    }
                  }}
              />
            </div>
          </div>
        )}

        {/* ================= MOBILE LAYOUT ================= */}
        {!isDesktop && (
          <div className="mobile-layout-wrapper">
`;

content = content.substring(0, headerStartIdx) + desktopJSX + content.substring(headerStartIdx);

// Append the closing div for the mobile layout wrapper before the Add Modal
const modalsStartIdx = content.indexOf('<AddExpenseModal');
content = content.substring(0, modalsStartIdx) + "          </div>\n        )}\n\n        " + content.substring(modalsStartIdx);


fs.writeFileSync(file, content);
console.log('AppMain Desktop UI rebuilt seamlessly!');
