const fs = require('fs');
const file = 'src/components/AppMain.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Inject isDesktop hook
if (!content.includes('const [isDesktop')) {
  const insertHookIdx = content.indexOf('  const [smsPrefill, setSmsPrefill] = useState');
  const hookInjection = `  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);\n\n`;
  content = content.substring(0, insertHookIdx) + hookInjection + content.substring(insertHookIdx);
}

// 2. Identify the boundaries
const initMotion = content.indexOf('initial={{ opacity: 0, y: 20 }}');
if (initMotion === -1) throw new Error("Could not find initial opacity");

// Backtrack to <motion.div
const motionStart = content.lastIndexOf('<motion.div', initMotion);

const calendarStart = content.indexOf('{isCalendarOpen && (');
if (calendarStart === -1) throw new Error("Could not find Calendar starts");

// 3. Extract original Mobile layout
const mobileLayoutBlock = content.substring(motionStart, calendarStart).trim();

// 4. Build the new Desktop layout
const desktopJSX = `        {/* ================= DESKTOP LAYOUT ================= */}
        {isDesktop && (
          <div className="w-full max-w-[1440px] flex gap-8 mx-auto mt-2 pb-24 px-8">
            
            {/* LEFT MAIN COLUMN */}
            <div className="flex flex-col gap-6" style={{ flex: 1 }}>
              
              {/* 1. Search */}
              <button
                className="glass-panel w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[15px] font-medium transition-all shadow-sm group border"
                style={{
                  background: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.5)",
                  borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                  color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)"
                }}
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="w-5 h-5 text-[#007aff] group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                <span>Search expenses, categories...</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-[#007aff] transition" onClick={(e) => { e.stopPropagation(); setIsHelpOpen(true); }}><HelpCircle className="w-5 h-5" /></div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-[#007aff] transition" onClick={(e) => { e.stopPropagation(); setIsAnalyticsOpen(true); }}><BarChart3 className="w-5 h-5" /></div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-[#007aff] transition" onClick={(e) => { e.stopPropagation(); if (onToggleDarkMode) onToggleDarkMode(); }}>{isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-[#007aff] transition" onClick={(e) => { e.stopPropagation(); if (onOpenSettings) onOpenSettings(); }}><Settings className="w-5 h-5" /></div>
                </div>
              </button>

              {/* 2. Total Month Spent - Budget Remaining */}
              <div className="grid grid-cols-2 gap-5">
                <div className="glass-card rounded-[24px] p-6 shadow-sm relative overflow-hidden" style={{ background: isDarkMode ? 'linear-gradient(135deg, rgba(0,122,255,0.2) 0%, rgba(10,132,255,0.1) 100%)' : 'linear-gradient(135deg, rgba(0,122,255,0.1) 0%, rgba(79,172,254,0.05) 100%)', border: \`1px solid \${isDarkMode ? 'rgba(0,122,255,0.3)' : 'rgba(0,122,255,0.2)'}\` }}>
                   <p className={\`text-[13px] font-semibold mb-2 uppercase tracking-widest \${isDarkMode ? 'text-blue-400' : 'text-blue-600'}\`}>{new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</p>
                   <p className={\`text-[44px] font-bold tracking-tight leading-none mb-1 \${isDarkMode ? 'text-white' : 'text-black'}\`}>₹{monthTotal.toFixed(0)}</p>
                   <p className={\`text-[14px] font-medium \${isDarkMode ? 'text-white/60' : 'text-black/60'}\`}>Total Spent This Month</p>
                </div>
                <div className="glass-card rounded-[24px] p-6 shadow-sm relative overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform" onClick={() => setIsBudgetModalOpen(true)} style={{ background: isDarkMode ? 'linear-gradient(135deg, rgba(40,167,69,0.2) 0%, rgba(52,199,89,0.1) 100%)' : 'linear-gradient(135deg, rgba(40,167,69,0.1) 0%, rgba(100,210,120,0.05) 100%)', border: \`1px solid \${isDarkMode ? 'rgba(40,167,69,0.3)' : 'rgba(40,167,69,0.2)'}\` }}>
                   <p className={\`text-[13px] font-semibold mb-2 uppercase tracking-widest \${isDarkMode ? 'text-green-400' : 'text-green-600'}\`}>Budget Remaining</p>
                   <p className={\`text-[44px] font-bold tracking-tight leading-none mb-1 \${isDarkMode ? 'text-white' : 'text-black'}\`}>{monthlyBudget ? \`₹\${Math.max(0, monthlyBudget - monthTotal).toFixed(0)}\` : '—'}</p>
                   <p className={\`text-[14px] font-medium \${isDarkMode ? 'text-white/60' : 'text-black/60'}\`}>{monthlyBudget ? \`of ₹\${monthlyBudget.toLocaleString()} budget\` : 'Tap to set a budget'}</p>
                </div>
              </div>

              {/* 3. Quick Actions */}
              <div className="glass-panel p-6 rounded-[24px] border" style={{
                  background: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)",
                  borderColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"
              }}>
                <p className={\`text-[13px] font-bold uppercase tracking-widest mb-4 \${isDarkMode ? "text-white/40" : "text-black/40"}\`}>Quick Actions</p>
                <div className="grid grid-cols-5 gap-3">
                   {[ { i: Plus, l: "Add", a: () => setIsAddModalOpen(true) },
                      { i: Repeat, l: "Recurring", a: () => setIsRecurringModalOpen(true) }, 
                      { i: Target, l: "Savings", a: () => setIsSavingsGoalsOpen(true) }, 
                      { i: Calendar, l: "Bills", a: () => setIsBillRemindersOpen(true) }, 
                      { i: Download, l: "Export", a: handleExportToCSV } ].map(q => (
                     <button key={q.l} onClick={q.a} className="flex flex-col items-center gap-2.5 p-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] border" style={{ background: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)", borderColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                        <q.i className="w-6 h-6 text-[#007aff]" />
                        <span className="text-[13px] font-semibold text-[#007aff]">{q.l}</span>
                     </button>
                   ))}
                </div>
              </div>

              {/* 4. Today's Expenses */}
              <div className="glass-panel rounded-[24px] overflow-hidden flex flex-col border" style={{
                  background: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)",
                  borderColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
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
            <div className="flex flex-col gap-6" style={{ width: 340 }}>
              <div className="sticky top-6">
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
          </div>
        )}

        {/* ================= MOBILE LAYOUT ================= */}
        {!isDesktop && (
${mobileLayoutBlock}
        )}
`;

content = content.replace(content.substring(motionStart, calendarStart).trim(), desktopJSX);
fs.writeFileSync(file, content);
console.log('AppMain Desktop UI rebuilt perfectly!');
