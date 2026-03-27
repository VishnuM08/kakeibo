import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Check,
  X,
  MessageSquare,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import { ParsedTransaction } from '../utils/smsParser';
import { message as antMessage } from 'antd';
import { registerPlugin, Capacitor } from '@capacitor/core';

const KakeiboNative = registerPlugin<any>('KakeiboNative');

/**
 * SMS Transactions View Component
 * 
 * Displays bank transaction SMS with approve/reject functionality
 */

interface SMSTransactionsViewProps {
  transactions: ParsedTransaction[];
  onBack: () => void;
  onApprove: (transaction: ParsedTransaction) => void;
  onReject: (transaction: ParsedTransaction) => void;
  isDarkMode?: boolean;
}

export function SMSTransactionsView({
  transactions,
  onBack,
  onApprove,
  onReject,
  isDarkMode = false,
}: SMSTransactionsViewProps) {
  const [localTransactions, setLocalTransactions] = useState<ParsedTransaction[]>(transactions);
  const [isLoading, setIsLoading] = useState(false);
  const [showDisclosure, setShowDisclosure] = useState(false);

  useEffect(() => {
    setLocalTransactions(transactions);
  }, [transactions]);

  // Check SMS permission on mount ONLY when entering this feature
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
    
    const checkPermission = async () => {
      try {
        console.log("[SMS] Checking permission status...");
        const result = await KakeiboNative.checkSmsPermission();
        console.log("[SMS] Permission status result:", result);
        if (result && result.status !== 'granted') {
          console.log("[SMS] Permission not granted, showing disclosure");
          setShowDisclosure(true);
        } else {
          console.log("[SMS] Permission already granted");
        }
      } catch (e) {
        console.error("[SMS] Permission check failed, showing disclosure as fallback", e);
        setShowDisclosure(true);
      }
    };
    checkPermission();
  }, []);

  const handleAllowSMS = async () => {
    setShowDisclosure(false);
    try {
      await KakeiboNative.requestSmsPermission();
    } catch (e) {
      console.error("[SMS] Failed to request permission", e);
    }
  };

  const handleApprove = (transaction: ParsedTransaction) => {
    // Only approve debit transactions (expenses)
    if (transaction.transactionType === 'credit') {
      antMessage.info('Income transactions are not added to expenses');
      handleReject(transaction);
      return;
    }

    setLocalTransactions((prev) =>
      prev.map((t) => (t.rawHash === transaction.rawHash ? { ...t, isApproved: true, isProcessed: true } : t))
    );

    // Wait for animation then call onApprove
    setTimeout(() => {
      onApprove(transaction);
      setLocalTransactions((prev) => prev.filter((t) => t.rawHash !== transaction.rawHash));
      antMessage.success(`Added ₹${transaction.amount.toFixed(2)} to expenses`);
    }, 300);
  };

  const handleReject = (transaction: ParsedTransaction) => {
    setLocalTransactions((prev) =>
      prev.map((t) => (t.rawHash === transaction.rawHash ? { ...t, isRejected: true, isProcessed: true } : t))
    );

    // Wait for animation then remove
    setTimeout(() => {
      onReject(transaction);
      setLocalTransactions((prev) => prev.filter((t) => t.rawHash !== transaction.rawHash));
    }, 300);
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      food: 'from-[#ff6b6b] to-[#ee5a6f]',
      transport: 'from-[#4ecdc4] to-[#44a08d]',
      coffee: 'from-[#f7b731] to-[#fa8231]',
      shopping: 'from-[#a29bfe] to-[#6c5ce7]',
      entertainment: 'from-[#fd79a8] to-[#e84393]',
      utilities: 'from-[#00b894] to-[#00cec9]',
      other: 'from-[#b2bec3] to-[#636e72]',
    };
    return colors[category || 'other'] || colors.other;
  };

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      food: 'Food',
      transport: 'Transport',
      coffee: 'Coffee',
      shopping: 'Shopping',
      entertainment: 'Entertainment',
      utilities: 'Utilities',
      other: 'Other',
    };
    return labels[category || 'other'] || 'Other';
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const pendingTransactions = localTransactions.filter((t) => !t.isApproved && !t.isRejected);

  return (
    <>
      <div
        className={`min-h-screen ${
          isDarkMode ? 'bg-black' : 'bg-[#f5f5f7]'
        } pb-24`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 ${
            isDarkMode ? 'bg-black' : 'bg-[#f5f5f7]'
          } border-b ${
            isDarkMode ? 'border-[#2c2c2e]' : 'border-[#e5e5e7]'
          } px-4 pb-3`}
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}
        >
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <button
              onClick={onBack}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-[#1c1c1e] text-blue-400'
                  : 'hover:bg-white text-blue-500'
              }`}
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-[17px] font-semibold">Back</span>
            </button>

            <div className="flex items-center gap-2">
              <Smartphone className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pt-6 max-w-4xl mx-auto">
          {/* Title & Description */}
          <div className="mb-6">
            <h1 className={`text-[34px] font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              SMS Transactions
            </h1>
            <p className={`text-[17px] ${isDarkMode ? 'text-[#8e8e93]' : 'text-[#6e6e73]'}`}>
              Review and approve bank transaction messages
            </p>
          </div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-[16px] p-4 mb-6 flex items-start gap-3 ${
              isDarkMode ? 'bg-[#1c1c1e]' : 'bg-white'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isDarkMode ? 'bg-blue-500/20' : 'bg-blue-50'
            }`}>
              <AlertCircle className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            </div>
            <div className="flex-1">
              <p className={`text-[15px] leading-relaxed ${
                isDarkMode ? 'text-[#e5e5e7]' : 'text-[#1d1d1f]'
              }`}>
                Transactions are automatically detected from your bank SMS messages. 
                Tap <span className="font-semibold">Approve</span> to add them to your expenses.
              </p>
            </div>
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className={`w-8 h-8 border-4 border-t-blue-500 rounded-full animate-spin ${
                isDarkMode ? 'border-[#2c2c2e]' : 'border-[#e5e5e7]'
              }`} />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && pendingTransactions.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isDarkMode ? 'bg-[#1c1c1e]' : 'bg-white'
              }`}>
                <MessageSquare className={`w-10 h-10 ${isDarkMode ? 'text-[#8e8e93]' : 'text-[#6e6e73]'}`} />
              </div>
              <h3 className={`text-[22px] font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                No Pending Transactions
              </h3>
              <p className={`text-[17px] ${isDarkMode ? 'text-[#8e8e93]' : 'text-[#6e6e73]'}`}>
                All SMS transactions have been reviewed
              </p>
            </motion.div>
          )}

          {/* Transaction List */}
          <AnimatePresence mode="popLayout">
            {pendingTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.rawHash}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: transaction.isApproved || transaction.isRejected ? 0.5 : 1, 
                  y: 0,
                  scale: transaction.isApproved || transaction.isRejected ? 0.95 : 1,
                }}
                exit={{ opacity: 0, x: transaction.isApproved ? 100 : -100, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-[20px] mb-3 overflow-hidden ${
                  isDarkMode ? 'bg-[#1c1c1e]' : 'bg-white'
                }`}
              >
                {/* Transaction Card */}
                <div className="p-4">
                  {/* Header: Bank & Date */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isDarkMode ? 'bg-[#2c2c2e]' : 'bg-[#f5f5f7]'
                      }`}>
                        <CreditCard className={`w-4 h-4 ${isDarkMode ? 'text-[#8e8e93]' : 'text-[#6e6e73]'}`} />
                      </div>
                      <span className={`text-[15px] font-medium ${
                        isDarkMode ? 'text-[#8e8e93]' : 'text-[#6e6e73]'
                      }`}>
                        {transaction.bank}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[13px] ${isDarkMode ? 'text-[#8e8e93]' : 'text-[#6e6e73]'}`}>
                        {formatDate(transaction.date)}
                      </span>
                      <span className={`text-[13px] ${isDarkMode ? 'text-[#8e8e93]' : 'text-[#6e6e73]'}`}>
                        {formatTime(transaction.date)}
                      </span>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Category Icon */}
                    <div
                      className={`w-14 h-14 rounded-[14px] bg-gradient-to-br ${getCategoryColor(
                        transaction.category
                      )} flex items-center justify-center flex-shrink-0`}
                    >
                      <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center">
                        {transaction.transactionType === 'debit' ? (
                          <TrendingDown className="w-4 h-4 text-white" strokeWidth={3} />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-white" strokeWidth={3} />
                        )}
                      </div>
                    </div>

                    {/* Merchant & Amount */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-[17px] font-semibold mb-1 truncate ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`}>
                        {transaction.merchant}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[13px] px-2 py-0.5 rounded-full ${
                            isDarkMode ? 'bg-[#2c2c2e] text-[#8e8e93]' : 'bg-[#f5f5f7] text-[#6e6e73]'
                          }`}
                        >
                          {getCategoryLabel(transaction.category)}
                        </span>
                        <span
                          className={`text-[13px] px-2 py-0.5 rounded-full ${
                            transaction.transactionType === 'credit'
                              ? isDarkMode
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-green-50 text-green-600'
                              : isDarkMode
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {transaction.transactionType === 'credit' ? 'Income' : 'Expense'}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <div className={`text-[22px] font-bold ${
                        transaction.transactionType === 'credit'
                          ? 'text-green-500'
                          : isDarkMode
                          ? 'text-white'
                          : 'text-black'
                      }`}>
                        {transaction.transactionType === 'credit' ? '+' : ''}₹{transaction.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReject(transaction)}
                      disabled={transaction.isApproved || transaction.isRejected}
                      className={`flex-1 h-12 rounded-[12px] flex items-center justify-center gap-2 font-semibold text-[17px] transition-all ${
                        transaction.isRejected
                          ? 'bg-red-500/20 text-red-400'
                          : isDarkMode
                          ? 'bg-[#2c2c2e] text-red-400 hover:bg-red-500/20 active:scale-95'
                          : 'bg-red-50 text-red-600 hover:bg-red-100 active:scale-95'
                      }`}
                    >
                      <X className="w-5 h-5" strokeWidth={2.5} />
                      Reject
                    </button>

                    <button
                      onClick={() => handleApprove(transaction)}
                      disabled={transaction.isApproved || transaction.isRejected}
                      className={`flex-1 h-12 rounded-[12px] flex items-center justify-center gap-2 font-semibold text-[17px] transition-all ${
                        transaction.isApproved
                          ? 'bg-green-500/20 text-green-400'
                          : 'text-white active:scale-95'
                      }`}
                      style={{ backgroundColor: !transaction.isApproved && !transaction.isRejected ? '#22c55e' : undefined }}
                    >
                      <Check className="w-5 h-5" strokeWidth={2.5} />
                      Approve
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Bottom Spacing */}
          <div className="h-6" />
        </div>
      </div>

      {/* Prominent Disclosure for SMS Permission */}
      <AnimatePresence>
        {showDisclosure && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              className={`max-w-md w-full p-8 rounded-[32px] shadow-2xl overflow-hidden relative ${
                isDarkMode ? "bg-[#1c1c1e] text-white" : "bg-white text-black"
              }`}
            >
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-[#007aff] to-[#00c6ff] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20 rotate-3">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-2xl font-extrabold mb-3 tracking-tight text-center">
                  Smart Transaction Detection
                </h2>
                
                <p className={`text-[16px] leading-relaxed mb-6 text-center font-medium ${
                  isDarkMode ? "text-white/70" : "text-black/60"
                }`}>
                  Enable automatic expense logging by letting Kakeibo detect bank alerts from your SMS.
                </p>

                <div className="space-y-4 mb-8">
                  <div className={`flex items-start gap-4 p-4 rounded-2xl ${
                    isDarkMode ? "bg-white/5" : "bg-black/5"
                  }`}>
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold mb-1 uppercase tracking-wider opacity-50">Why?</h4>
                      <p className="text-[14px] font-medium leading-tight">
                        To automatically record spendings from bank alerts (HDFC, SBI, ICICI, etc.) in real-time.
                      </p>
                    </div>
                  </div>

                  <div className={`p-5 rounded-2xl border ${
                    isDarkMode ? "border-white/10 bg-black/20" : "border-black/5 bg-gray-50"
                  }`}>
                    <h4 className="text-[13px] font-black uppercase tracking-[0.1em] mb-3 text-blue-500">
                      Privacy First
                    </h4>
                    <ul className="space-y-2">
                      {[
                        "All processing happens 100% locally on device",
                        "Only financial transaction alerts are detected",
                        "Personal messages & OTPs are never accessed"
                      ].map((text, i) => (
                        <li key={i} className="flex items-center gap-2 text-[13px] font-medium opacity-80 leading-snug">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40"></div>
                          {text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleAllowSMS}
                    className="w-full py-5 rounded-[20px] bg-[#007aff] text-white font-bold text-[17px] active:scale-95 transition-transform shadow-lg shadow-[#007aff]/20 mx-auto"
                  >
                    Agree & Enable
                  </button>
                  <button
                    onClick={() => setShowDisclosure(false)}
                    className={`w-full py-2 rounded-[20px] font-bold text-[16px] active:scale-95 transition-all ${
                      isDarkMode ? "text-white/40 hover:text-white/60" : "text-black/40 hover:text-black/60"
                    }`}
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
