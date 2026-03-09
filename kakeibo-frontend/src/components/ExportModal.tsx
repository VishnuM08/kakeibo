import { AnimatePresence, motion } from "motion/react";
import { X, Download, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (startDate: string, endDate: string) => Promise<void>;
  isDarkMode: boolean;
}

const PRESETS = [
  {
    label: "This Month",
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];
      return { start, end };
    },
  },
  {
    label: "Last Month",
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toISOString()
        .split("T")[0];
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
        .toISOString()
        .split("T")[0];
      return { start, end };
    },
  },
  {
    label: "Last 3 Months",
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        .toISOString()
        .split("T")[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];
      return { start, end };
    },
  },
  {
    label: "This Year",
    getValue: () => {
      const y = new Date().getFullYear();
      return { start: `${y}-01-01`, end: `${y}-12-31` };
    },
  },
  {
    label: "All Time",
    getValue: () => ({ start: "2000-01-01", end: "2099-12-31" }),
  },
];

export function ExportModal({
  isOpen,
  onClose,
  onExport,
  isDarkMode,
}: ExportModalProps) {
  const thisMonth = PRESETS[0].getValue();
  const [startDate, setStartDate] = useState(thisMonth.start);
  const [endDate, setEndDate] = useState(thisMonth.end);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("This Month");

  // Scroll Look
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handlePreset = (preset: (typeof PRESETS)[number]) => {
    const { start, end } = preset.getValue();
    setStartDate(start);
    setEndDate(end);
    setActivePreset(preset.label);
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      await onExport(startDate, endDate);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const card = isDarkMode ? "#1c1c1e" : "#ffffff";
  const border = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const text = isDarkMode ? "#ffffff" : "#1a1a1a";
  const muted = "#86868b";
  const blue = isDarkMode ? "#0a84ff" : "#007aff";
  const inputBg = isDarkMode ? "rgba(255,255,255,0.07)" : "#f5f5f7";

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop/Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-10 safe-top sm:items-center sm:pt-0 p-4 sm:p-0"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            onClick={onClose}
          >
            {/* Modal Content */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) onClose();
              }}
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative z-51 rounded-[28px] p-6 pb-12 sm:pb-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar"
              style={{
                background: card,
                border: `1px solid ${border}`,
                fontFamily: "Inter, -apple-system, sans-serif",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle (Mobile only) */}
              <div className="w-12 h-1.5 bg-gray-300/30 dark:bg-gray-600/30 rounded-full mx-auto mb-4 mt-[-4px] sm:hidden" />
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5" style={{ color: blue }} />
                  <h2
                    className="text-[18px] font-bold"
                    style={{ color: text, letterSpacing: "-0.02em" }}
                  >
                    Export Report
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: inputBg }}
                >
                  <X className="w-4 h-4" style={{ color: muted }} />
                </button>
              </div>

              {/* Quick presets */}
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-2.5"
                style={{ color: muted }}
              >
                Quick Range
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handlePreset(p)}
                    className="px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all"
                    style={{
                      background: activePreset === p.label ? blue : inputBg,
                      color: activePreset === p.label ? "#ffffff" : muted,
                      border: `1px solid ${activePreset === p.label ? blue : "transparent"}`,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom date range */}
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-2.5"
                style={{ color: muted }}
              >
                Custom Range
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div>
                  <label
                    className="text-[12px] font-medium mb-1 block"
                    style={{ color: muted }}
                  >
                    From
                  </label>
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-[12px]"
                    style={{
                      background: inputBg,
                      border: `1px solid ${border}`,
                    }}
                  >
                    <Calendar
                      className="w-4 h-4 shrink-0"
                      style={{ color: blue }}
                    />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setActivePreset("");
                      }}
                      className="flex-1 bg-transparent outline-none text-[14px] font-medium"
                      style={{
                        color: text,
                        colorScheme: isDarkMode ? "dark" : "light",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="text-[12px] font-medium mb-1 block"
                    style={{ color: muted }}
                  >
                    To
                  </label>
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-[12px]"
                    style={{
                      background: inputBg,
                      border: `1px solid ${border}`,
                    }}
                  >
                    <Calendar
                      className="w-4 h-4 shrink-0"
                      style={{ color: blue }}
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setActivePreset("");
                      }}
                      className="flex-1 bg-transparent outline-none text-[14px] font-medium"
                      style={{
                        color: text,
                        colorScheme: isDarkMode ? "dark" : "light",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Export button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleExport}
                disabled={loading || !startDate || !endDate}
                className="w-full py-4 rounded-[16px] text-[16px] font-bold flex items-center justify-center gap-2"
                style={{
                  background: loading ? muted : blue,
                  color: "#ffffff",
                  opacity: !startDate || !endDate ? 0.5 : 1,
                }}
              >
                {loading ? (
                  <span>Generating report…</span>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Export HTML Report</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
