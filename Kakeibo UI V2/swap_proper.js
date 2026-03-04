const fs = require('fs');
const file = 'src/components/AppMain.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Swap Grid
content = content.replace('gridTemplateColumns: "380px 1fr"', 'gridTemplateColumns: "1fr 340px"');

// 2. Extract Today's Expenses Panel
// Find the exact outer boundaries.
const startPanelStr = "{/* Today's Expenses Panel */}";

// Let's find exactly where the right column ends.
const endPanelStr = `                        {/* Footer: total */}
                        {expenses.filter(
                          (e) =>
                            new Date(e.date).toDateString() ===
                            new Date().toDateString(),
                        ).length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "12px 20px",
                              borderTop: \`1px solid \${isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}\`,
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                fontWeight: 600,
                                color: isDarkMode
                                  ? "rgba(255,255,255,0.4)"
                                  : "rgba(0,0,0,0.4)",
                              }}
                            >
                              {
                                expenses.filter(
                                  (e) =>
                                    new Date(e.date).toDateString() ===
                                    new Date().toDateString(),
                                ).length
                              }{" "}
                              transactions
                            </p>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 15,
                                fontWeight: 700,
                                color: "#007aff",
                              }}
                            >
                              ₹
                              {expenses
                                .filter(
                                  (e) =>
                                    new Date(e.date).toDateString() ===
                                    new Date().toDateString(),
                                )
                                .reduce((s, e) => s + e.amount, 0)
                                .toFixed(0)}{" "}
                              total
                            </p>
                          </div>
                        )}
                      </div>`;

const startIdx = content.indexOf(startPanelStr);
if (startIdx === -1) throw new Error("Could not find startPanelStr");

const endStrIdx = content.indexOf(endPanelStr, startIdx);
if (endStrIdx === -1) throw new Error("Could not find endPanelStr");

const endIdx = endStrIdx + endPanelStr.length;
let panelBlock = content.substring(startIdx, endIdx);

// 3. Remove the panel from its original position
content = content.substring(0, startIdx) + content.substring(endIdx);

// 4. Insert the panel at the end of the left column.
// The left column ends right before:
//                     {/* Right Column: Calendar + Today's Expenses */}
const rightColStr = "{/* Right Column: Calendar + Today's Expenses */}";
const rightColIdx = content.indexOf(rightColStr);

// We need to insert it right before the </div> that closes the left column.
// Typically:
//   </div>
// </div>
// 
// {/* Right Column
// So let's insert it before the empty space preceding `{/* Right Column`
// Actually, inserting it exactly before `{/* Right Column` puts it outside the left column!
// We must put it INSIDE the left column. 
// The left column is defined as:
// <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
// Its last child was the Quick Actions grid.
const quickActionsEndStr = `                              {label}
                            </button>
                          ))}
                        </div>
                      </div>`;

const qaEndIdx = content.indexOf(quickActionsEndStr);
if (qaEndIdx === -1) throw new Error("Could not find quickActionsEndStr");

const targetInsertIdx = qaEndIdx + quickActionsEndStr.length;

// Insert the panel right after quick actions grid ends!
content = content.substring(0, targetInsertIdx) + "\n\n" + panelBlock + content.substring(targetInsertIdx);

fs.writeFileSync(file, content);
console.log("Successfully shifted layout!");
