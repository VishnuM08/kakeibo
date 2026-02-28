import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Select,
  Typography,
  ConfigProvider,
  theme,
  Spin,
  Checkbox,
} from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import {
  MessageSquare,
  Coffee,
  ShoppingBag,
  Train,
  Utensils,
  Sparkles,
  Zap,
  MoreHorizontal,
} from "lucide-react";
import { SmsExpensePayload } from "../App";

const { Title } = Typography;

interface PendingSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingExpenses: SmsExpensePayload[];
  onSync: (selectedItems: SmsExpensePayload[]) => Promise<void>;
  isDarkMode: boolean;
}

const categories = [
  { value: "food", label: "Food" },
  { value: "transport", label: "Transport" },
  { value: "coffee", label: "Coffee" },
  { value: "shopping", label: "Shopping" },
  { value: "entertainment", label: "Entertainment" },
  { value: "utilities", label: "Utilities" },
  { value: "other", label: "Other" },
];

const getCategoryIcon = (category: string) => {
  const icons: { [key: string]: typeof Coffee } = {
    food: Utensils,
    transport: Train,
    coffee: Coffee,
    shopping: ShoppingBag,
    entertainment: Sparkles,
    utilities: Zap,
    other: MoreHorizontal,
  };
  return icons[category.toLowerCase()] || MoreHorizontal;
};

const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    food: "from-[#ff6b6b] to-[#ee5a6f]",
    transport: "from-[#4ecdc4] to-[#44a08d]",
    coffee: "from-[#f7b731] to-[#fa8231]",
    shopping: "from-[#a29bfe] to-[#6c5ce7]",
    entertainment: "from-[#fd79a8] to-[#e84393]",
    utilities: "from-[#00b894] to-[#00cec9]",
    other: "from-[#b2bec3] to-[#636e72]",
  };
  return colors[category.toLowerCase()] || "from-[#b2bec3] to-[#636e72]";
};

export const PendingSmsModal: React.FC<PendingSmsModalProps> = ({
  isOpen,
  onClose,
  pendingExpenses,
  onSync,
  isDarkMode,
}) => {
  const [data, setData] = useState<(SmsExpensePayload & { key: string })[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const mappedData = pendingExpenses.map((exp, index) => ({
        ...exp,
        key: exp.referenceId || `sms-${index}-${exp.expenseDateTime}`,
        category: exp.category || "other",
      }));
      setData(mappedData);
      setSelectedRowKeys(mappedData.map((item) => item.key));
    }
  }, [isOpen, pendingExpenses]);

  const handleCategoryChange = (key: string, category: string) => {
    setData((prev) =>
      prev.map((item) => (item.key === key ? { ...item, category } : item)),
    );
  };

  const toggleSelection = (key: string) => {
    setSelectedRowKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleSync = async () => {
    const selectedItems = data.filter((item) =>
      selectedRowKeys.includes(item.key),
    );
    if (selectedItems.length === 0) return;

    setLoading(true);
    try {
      await onSync(selectedItems);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#007aff",
          borderRadius: 16,
        },
      }}
    >
      <Modal
        title={
          <div className="flex flex-col gap-1 mb-2 pt-2 pb-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDarkMode
                    ? "bg-[#0a84ff]/20 text-[#0a84ff]"
                    : "bg-[#007aff]/10 text-[#007aff]"
                }`}
              >
                <MessageSquare size={16} strokeWidth={2.5} />
              </div>
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                Pending Detection
              </Title>
            </div>
            <p
              className={`text-[14px] font-normal ${isDarkMode ? "text-white/50" : "text-black/50"}`}
            >
              {data.length} SMS transactions captured
            </p>
          </div>
        }
        open={isOpen}
        onCancel={onClose}
        footer={[
          <Button
            key="cancel"
            type="text"
            onClick={onClose}
            disabled={loading}
            className={`h-12 px-6 rounded-[14px] font-semibold text-[15px] ${isDarkMode ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"}`}
          >
            Keep for Later
          </Button>,
          <Button
            key="sync"
            type="primary"
            icon={<CheckCircleOutlined />}
            className="h-12 px-6 rounded-[14px] font-semibold text-[15px] bg-gradient-to-r from-[#22c55e] to-[#16a34a] border-none shadow-md shadow-green-500/20"
            onClick={handleSync}
            loading={loading}
            disabled={selectedRowKeys.length === 0}
          >
            Sync Selected ({selectedRowKeys.length})
          </Button>,
        ]}
        width={500}
        centered
        styles={{
          mask: {
            backdropFilter: "blur(12px)",
            backgroundColor: isDarkMode ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)",
          },
          wrapper: {
            padding: "20px",
            borderRadius: "24px",
            boxShadow: isDarkMode
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)"
              : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          },
          body: {
            padding: "16px 4px",
          },
        }}
        modalRender={(modal) => (
          <div className="sms-review-modal-wrapper">{modal}</div>
        )}
      >
        <div
          className="overflow-y-auto max-h-[55vh] py-2 space-y-3 px-1"
          style={{ scrollbarWidth: "none" }}
        >
          {data.map((item) => {
            const isSelected = selectedRowKeys.includes(item.key);
            const Icon = getCategoryIcon(item.category || "other");
            const colorClass = getCategoryColor(item.category || "other");
            const dateObj = new Date(item.expenseDateTime);

            return (
              <div
                key={item.key}
                onClick={() => toggleSelection(item.key)}
                className={`relative p-4 rounded-[20px] transition-all cursor-pointer border-2 ${
                  isSelected
                    ? isDarkMode
                      ? "bg-[#0a84ff]/10 border-[#0a84ff]/50 shadow-[0_0_15px_rgba(10,132,255,0.15)]"
                      : "bg-[#007aff]/5 border-[#007aff]/50 shadow-[0_0_15px_rgba(0,122,255,0.1)]"
                    : isDarkMode
                      ? "bg-[#2c2c2e]/50 border-transparent hover:bg-[#2c2c2e]"
                      : "bg-[#f5f5f7] border-transparent hover:bg-[#ebebf0]"
                }`}
              >
                <div className="flex gap-4">
                  {/* Category Icon & Checkbox */}
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-sm`}
                    >
                      <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="pointer-events-none"
                    >
                      <Checkbox checked={isSelected} className="scale-110" />
                    </div>
                  </div>

                  {/* Content details */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between items-start mb-1.5">
                      <div
                        className={`text-[20px] font-bold tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}
                      >
                        ₹{item.amount.toFixed(2)}
                      </div>
                    </div>

                    <div
                      className={`text-[13px] leading-relaxed mb-3 ${isDarkMode ? "text-white/60" : "text-black/60"}`}
                    >
                      {item.description}
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div
                        className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${isDarkMode ? "bg-white/5 text-white/50" : "bg-black/5 text-black/50"}`}
                      >
                        {dateObj.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        •{" "}
                        {dateObj.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </div>

                      {/* Category Select - stop propagation so click doesn't toggle selection */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={item.category}
                          style={{ width: 110 }}
                          onChange={(value) =>
                            handleCategoryChange(item.key, value)
                          }
                          options={categories}
                          variant="filled"
                          size="small"
                          className="category-dropdown-custom"
                          popupMatchSelectWidth={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[24px] bg-black/20 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[20px] shadow-xl flex flex-col items-center gap-3">
              <Spin size="large" />
              <p
                className={`text-[14px] font-medium ${isDarkMode ? "text-white/70" : "text-black/70"}`}
              >
                Syncing transactions...
              </p>
            </div>
          </div>
        )}
      </Modal>
    </ConfigProvider>
  );
};
