import React from "react";
import { Check, X, Smartphone, AlertCircle } from "lucide-react";
import { ParsedTransaction } from "../utils/smsParser";

interface DetectedTransactionsProps {
  transactions: ParsedTransaction[];
  onApprove: (transaction: ParsedTransaction) => void;
  onDiscard: (index: number) => void;
  isDarkMode?: boolean;
}

export const DetectedTransactions: React.FC<DetectedTransactionsProps> = ({
  transactions,
  onApprove,
  onDiscard,
  isDarkMode,
}) => {
  if (transactions.length === 0) return null;

  return (
    <div className={`mt-6 p-4 rounded-2xl border ${isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-100"}`}>
      <div className="flex items-center gap-2 mb-4">
        <Smartphone className={`w-5 h-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
        <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
          Detected from SMS
        </h3>
        <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${isDarkMode ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"}`}>
          {transactions.length} New
        </span>
      </div>

      <div className="space-y-3">
        {transactions.map((tx, index) => (
          <div
            key={index}
            className={`p-3 rounded-xl flex items-center justify-between transition-all ${
              isDarkMode ? "bg-[#1c1c1e] hover:bg-[#2c2c2e]" : "bg-white hover:bg-gray-50 shadow-sm"
            }`}
          >
            <div className="flex-1 min-w-0 mr-3">
              <p className={`text-[15px] font-bold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {tx.merchant}
              </p>
              <p className={`text-[12px] ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>
                ₹{tx.amount.toFixed(2)} • {tx.type === "debit" ? "Spent" : "Received"}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDiscard(index)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isDarkMode ? "bg-white/5 hover:bg-white/10 text-white/40" : "bg-gray-100 hover:bg-gray-200 text-gray-500"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => onApprove(tx)}
                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-transform active:scale-95 shadow-md shadow-blue-500/20"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex items-start gap-2 bg-black/5 p-2 rounded-lg">
        <AlertCircle className="w-3 h-3 text-gray-400 mt-0.5" />
        <p className="text-[10px] text-gray-400 leading-tight">
          These transactions were detected locally from your SMS alerts. Review and approve to add them to your account.
        </p>
      </div>
    </div>
  );
};
