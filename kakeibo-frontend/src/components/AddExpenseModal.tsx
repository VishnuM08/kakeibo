import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft,
  Wallet,
  ShoppingCart,
  Coffee,
  Utensils,
  Car,
  Home,
  Film,
  Heart,
  TrendingUp,
  Zap,
  Calendar as CalendarIcon,
  Check,
  X,
  Plus,
  Star,
  Trash2,
  TrendingDown,
  Copy,
  Settings,
  Clock,
  Zap as ZapIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { toast, Toaster } from '../utils/toast';

type Category = {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
};

type Expense = {
  id: string;
  amount: string;
  description: string;
  category: string;
  date: Date;
  timestamp: number;
};

type Template = {
  id: string;
  name: string;
  amount: string;
  category: string;
  description: string;
};

const categories: Category[] = [
  { id: 'food', name: 'Food', icon: <Utensils className="w-5 h-5" />, color: '#FF6B6B' },
  { id: 'groceries', name: 'Groceries', icon: <ShoppingCart className="w-5 h-5" />, color: '#4ECDC4' },
  { id: 'transport', name: 'Transport', icon: <Car className="w-5 h-5" />, color: '#45B7D1' },
  { id: 'coffee', name: 'Coffee', icon: <Coffee className="w-5 h-5" />, color: '#FFA07A' },
  { id: 'home', name: 'Home', icon: <Home className="w-5 h-5" />, color: '#98D8C8' },
  { id: 'entertainment', name: 'Fun', icon: <Film className="w-5 h-5" />, color: '#F7B731' },
  { id: 'health', name: 'Health', icon: <Heart className="w-5 h-5" />, color: '#FA8072' },
  { id: 'bills', name: 'Bills', icon: <Zap className="w-5 h-5" />, color: '#6C5CE7' },
  { id: 'shopping', name: 'Shopping', icon: <TrendingUp className="w-5 h-5" />, color: '#FD79A8' },
];

const quickAmounts = [50, 100, 200, 500, 1000, 2000];

const descriptionSuggestions: Record<string, string[]> = {
  food: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Restaurant'],
  groceries: ['Vegetables', 'Fruits', 'Dairy', 'Grocery shopping'],
  transport: ['Cab', 'Bus', 'Metro', 'Auto', 'Fuel'],
  coffee: ['Coffee', 'Tea', 'Cafe'],
  home: ['Rent', 'Electricity', 'Water', 'Internet'],
  entertainment: ['Movie', 'Concert', 'Game', 'Subscription'],
  health: ['Medicine', 'Doctor', 'Gym', 'Pharmacy'],
  bills: ['Phone bill', 'Credit card', 'EMI'],
  shopping: ['Clothes', 'Electronics', 'Accessories'],
};

// Get smart suggestion based on time
function getSmartSuggestion(): { category: string; description: string } | null {
  const hour = new Date().getHours();
  
  if (hour >= 7 && hour <= 10) {
    return { category: 'food', description: 'Breakfast' };
  } else if (hour >= 12 && hour <= 14) {
    return { category: 'food', description: 'Lunch' };
  } else if (hour >= 16 && hour <= 18) {
    return { category: 'coffee', description: 'Coffee' };
  } else if (hour >= 19 && hour <= 22) {
    return { category: 'food', description: 'Dinner' };
  }
  return null;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (expense: {
    description: string;
    category: string;
    amount: number;
    expenseDateTime: string;
  }) => void;
  isDarkMode?: boolean;
  initialDate?: Date;
  initialAmount?: string;
  initialDescription?: string;
  initialCategory?: string;
}

export function AddExpenseModal({
  isOpen,
  onClose,
  onAdd,
  isDarkMode = false,
  initialDate,
  initialAmount = '',
  initialDescription = '',
  initialCategory = '',
}: AddExpenseModalProps) {
  const [amount, setAmount] = useState(initialAmount);
  const [description, setDescription] = useState(initialDescription);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [date, setDate] = useState<Date>(initialDate || new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [lastExpense, setLastExpense] = useState<Expense | null>(null);
  const [recentCategories, setRecentCategories] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Sync state with props when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      if (initialAmount) setAmount(initialAmount);
      if (initialDescription) setDescription(initialDescription);
      if (initialCategory) setSelectedCategory(initialCategory);
    }
  }, [isOpen, initialAmount, initialDescription, initialCategory]);

  // Load data from localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem('expense_templates');
    const savedExpenses = localStorage.getItem('expenses');
    const savedRecentCategories = localStorage.getItem('recent_categories');
    const savedBatchMode = localStorage.getItem('batch_mode');
    
    if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
    if (savedExpenses) {
      const parsed = JSON.parse(savedExpenses);
      setExpenses(parsed.map((e: any) => ({ ...e, date: new Date(e.date) })));
    }
    if (savedRecentCategories) setRecentCategories(JSON.parse(savedRecentCategories));
    if (savedBatchMode) setBatchMode(savedBatchMode === 'true');
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('expense_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('recent_categories', JSON.stringify(recentCategories));
  }, [recentCategories]);

  useEffect(() => {
    localStorage.setItem('batch_mode', String(batchMode));
  }, [batchMode]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const suggestion = getSmartSuggestion();
      if (suggestion && !selectedCategory) {
        toast.info(`💡 Quick add: ${suggestion.description}?`, {
          action: {
            label: 'Use',
            onClick: () => {
              setSelectedCategory(suggestion.category);
              setDescription(suggestion.description);
            },
          },
          duration: 5000,
        });
      }
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, selectedCategory]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(value);
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Update recent categories
    const updated = [categoryId, ...recentCategories.filter(c => c !== categoryId)].slice(0, 3);
    setRecentCategories(updated);
    
    if (!description) {
      setTimeout(() => {
        document.getElementById('description-input')?.focus();
      }, 100);
    }
  };

  const handleDescriptionSuggestion = (suggestion: string) => {
    setDescription(suggestion);
  };

  const handleSubmit = (addAnother: boolean = false) => {
    if (!isFormValid) return;

    const finalAmount = amount;
    const finalDescription = description || categories.find(c => c.id === selectedCategory)?.name || 'Expense';

    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: finalAmount,
      description: finalDescription,
      category: selectedCategory,
      date: date,
      timestamp: Date.now(),
    };

    // Ensure the proper exact time is logged for sorting/storage.
    const expenseDate = new Date(date.getTime());
    const now = new Date();
    expenseDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    // Submit properly to Kakeibo backend
    onAdd({
      description: finalDescription,
      category: selectedCategory,
      amount: parseFloat(finalAmount),
      expenseDateTime: expenseDate.toISOString(),
    });

    setExpenses([newExpense, ...expenses]);
    setLastExpense(newExpense);

    // Show success feedback
    toast.success(
      `Added ₹${finalAmount}`,
      {
        action: {
          label: 'Undo',
          onClick: () => handleUndo(newExpense.id),
        },
        duration: 3000,
      }
    );

    if (batchMode || addAnother) {
      // Reset for next entry but keep category
      const lastCategory = selectedCategory;
      setAmount('');
      setDescription('');
      setDate(initialDate || new Date());
      setSelectedCategory(lastCategory);
    } else {
      // Full reset and close
      setAmount('');
      setDescription('');
      setSelectedCategory('');
      setDate(initialDate || new Date());
      onClose();
    }
  };

  const handleUndo = (expenseId: string) => {
    setExpenses(expenses.filter(e => e.id !== expenseId));
    toast.info('Expense removed from local history (Backend deletion not currently supported via undo)');
  };

  const handleSaveAsTemplate = () => {
    if (!isFormValid) return;

    const finalAmount = amount;
    const templateName = description || categories.find(c => c.id === selectedCategory)?.name || 'Template';
    
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: templateName,
      amount: finalAmount,
      category: selectedCategory,
      description: description,
    };

    setTemplates([...templates, newTemplate]);
    toast.success('Template saved!');
  };

  const handleUseTemplate = (template: Template) => {
    setAmount(template.amount);
    setDescription(template.description);
    setSelectedCategory(template.category);
    setShowTemplates(false);
    toast.info('Template loaded');
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    toast.info('Template deleted');
  };

  const isFormValid = (amount && parseFloat(amount) > 0) && selectedCategory;

  const suggestions = selectedCategory ? descriptionSuggestions[selectedCategory] || [] : [];

  // Organize categories: recent first, then rest
  const sortedCategories = [
    ...categories.filter(c => recentCategories.includes(c.id)).sort((a, b) => 
      recentCategories.indexOf(a.id) - recentCategories.indexOf(b.id)
    ),
    ...categories.filter(c => !recentCategories.includes(c.id))
  ];

  // Swipe detection for submit button
  const handleSwipeUp = (event: any, info: PanInfo) => {
    if (info.offset.y < -50 && isFormValid) {
      handleSubmit(true); // Add and new
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className={`fixed inset-0 z-[100000] h-[100dvh] w-screen flex flex-col items-center ${isDarkMode ? 'bg-black' : 'bg-[#f5f5f7]'} transition-colors duration-300`}
    >
      <Toaster position="top-center" isDarkMode={isDarkMode} />
      
      <div className="w-full max-w-md h-full flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className={`flex-none backdrop-blur-xl border-b z-40 shadow-lg transition-colors ${isDarkMode ? 'bg-black/80 border-white/10 shadow-black/50' : 'bg-white/80 border-black/10 shadow-black/5'}`}>
          <div className="px-4 pb-3 flex items-center justify-between" style={{ paddingTop: 'max(env(safe-area-inset-top, 44px), 44px)' }}>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-[#1c1c1e]' : 'hover:bg-black/5'}`}>
              <ArrowLeft className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </button>
            <div>
              <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Add Expense</div>
              {batchMode && (
                <div className="text-xs text-green-400 flex items-center gap-1">
                  <ZapIcon className="w-3 h-3" />
                  Batch Mode
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowTemplates(!showTemplates)}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-[#1c1c1e]' : 'hover:bg-black/5'}`}
            >
              <Star className={`w-5 h-5 ${templates.length > 0 ? 'text-yellow-500' : isDarkMode ? 'text-white' : 'text-black'}`} />
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-[#1c1c1e]' : 'hover:bg-black/5'}`}
            >
              <Settings className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </button>
            <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-[#1c1c1e]' : 'hover:bg-black/5'}`}>
              <X className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`border-b flex-none overflow-hidden ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-[#f5f5f7] border-black/10'}`}
          >
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>Batch Mode</div>
                  <div className="text-black/45 text-xs">Stay on page after adding</div>
                </div>
                <button
                  onClick={() => setBatchMode(!batchMode)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    batchMode ? 'bg-[#007aff]' : isDarkMode ? 'bg-[#2c2c2e]' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    animate={{ x: batchMode ? 24 : 2 }}
                    className="w-5 h-5 bg-white rounded-full"
                  />
                </button>
              </div>
              <div className="text-xs text-black/45 mt-3">
                💡 Tip: Swipe up on "Add Expense" button to add and continue
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates Panel */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`border-b flex-none overflow-hidden ${isDarkMode ? 'bg-[#121212] border-white/10' : 'bg-[#f5f5f7] border-black/10'}`}
          >
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>Quick Templates</div>
                {isFormValid && (
                  <button
                    onClick={handleSaveAsTemplate}
                    className="text-xs text-[#007aff] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Save Current
                  </button>
                )}
              </div>
              {templates.length === 0 ? (
                <div className="text-black/45 text-xs text-center py-4">
                  No templates yet. Fill the form and save it as a template.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`rounded-xl p-3 relative group ${isDarkMode ? 'bg-[#1c1c1e]' : 'bg-white shadow-sm border border-black/5'}`}
                    >
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="w-full text-left"
                      >
                        <div className={`font-medium text-sm mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>{template.name}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-500'}`}>₹{template.amount}</div>
                        <div className="text-black/45 text-xs mt-1">
                          {categories.find(c => c.id === template.category)?.name}
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="absolute top-2 right-2 p-1 bg-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Suggestion Bar */}
      {!selectedCategory && recentCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border-b flex-none relative z-30 transition-colors ${
            isDarkMode 
              ? 'bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/20' 
              : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100'
          }`}
        >
          <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto">
            <Clock className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <span className={`text-xs flex-shrink-0 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>Recent:</span>
            {recentCategories.slice(0, 3).map((catId) => {
              const cat = categories.find(c => c.id === catId);
              if (!cat) return null;
              return (
                <button
                  key={catId}
                  onClick={() => handleCategorySelect(catId)}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-colors flex-shrink-0 ${
                    isDarkMode 
                      ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200' 
                      : 'bg-purple-100 hover:bg-purple-200 text-purple-800'
                  }`}
                >
                  {cat.icon}
                  {cat.name}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        {/* Amount Section with Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="bg-gradient-to-br from-[#007aff] via-[#007aff] to-[#0051d5] rounded-3xl p-6 shadow-2xl shadow-[#007aff]/30 border border-[#007aff]/30">
            <motion.div 
              className="flex items-center justify-center gap-2 mb-2"
              animate={amount ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.2 }}
            >
              <span className="text-3xl text-white font-light">₹</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0"
                className="bg-transparent text-4xl font-bold text-white placeholder:text-white/40 focus:outline-none text-center w-full min-w-[50px]"
                autoFocus
              />
            </motion.div>
            
            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {quickAmounts.map((value) => (
                <motion.button
                  key={value}
                  onClick={() => handleQuickAmount(value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-all backdrop-blur-sm min-w-[50px]"
                >
                  {value >= 1000 ? `${value/1000}k` : value}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Category with Swipe Support */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4"
        >
          <label className="text-xs text-black/45 mb-2 font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              CATEGORY
              {recentCategories.length > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  isDarkMode ? 'text-purple-400 bg-purple-500/10' : 'text-purple-700 bg-purple-100'
                }`}>
                  Recent on top
                </span>
              )}
            </span>
          </label>
          <div 
            ref={categoryScrollRef}
            className="grid grid-cols-3 gap-2"
          >
            {sortedCategories.map((category) => {
              const isSelected = selectedCategory === category.id;
              const isRecent = recentCategories.includes(category.id);
              return (
                <motion.button
                  key={category.id}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleCategorySelect(category.id)}
                  style={
                    !isSelected 
                      ? { 
                          background: isDarkMode 
                            ? `linear-gradient(135deg, ${category.color}10, ${category.color}05)`
                            : `linear-gradient(135deg, ${category.color}15, white)`,
                          borderColor: `${category.color}20`
                        } 
                      : {}
                  }
                  className={`relative p-3 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-[#007aff] border-2 border-[#007aff] shadow-lg shadow-[#007aff]/30'
                      : isDarkMode ? 'border-2' : 'border border-black/10 shadow-sm'
                  }`}
                >
                  {isRecent && !isSelected && (
                    <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full p-0.5 shadow-sm">
                      <TrendingDown className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        isSelected ? 'bg-white/20' : isDarkMode ? 'bg-[#2c2c2e]' : 'bg-white shadow-sm'
                      }`}
                      style={!isSelected ? { color: category.color } : {}}
                    >
                      <div className={isSelected ? 'text-white' : ''}>
                        {category.icon}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium transition-colors ${
                        isSelected ? 'text-white' : isDarkMode ? 'text-white/50' : 'text-gray-700'
                      }`}
                    >
                      {category.name}
                    </span>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm"
                    >
                      <Check className="w-3 h-3 text-[#007aff]" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Description Suggestions */}
        {selectedCategory && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 overflow-hidden"
          >
            <label className="text-xs text-black/45 mb-2 block font-medium">QUICK SELECT</label>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleDescriptionSuggestion(suggestion)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    description === suggestion
                      ? 'bg-[#007aff] text-white shadow-md shadow-[#007aff]/20'
                      : isDarkMode 
                        ? 'bg-[#1c1c1e] text-white/50 hover:bg-[#2c2c2e]'
                        : 'bg-white text-black/60 hover:bg-black/5 border border-black/10 shadow-sm'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <label className="text-xs text-black/45 mb-2 block font-medium">
            DESCRIPTION <span className="text-white/50 font-normal">(Optional)</span>
          </label>
          <input
            id="description-input"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you buy?"
            className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-[#007aff] transition-all ${
              isDarkMode 
                ? 'bg-[#1c1c1e] border border-white/10 text-white placeholder:text-black/60' 
                : 'bg-white border border-black/10 text-black placeholder:text-white/50 shadow-sm focus:ring-4 focus:ring-[#007aff]/10'
            }`}
          />
        </motion.div>

        {/* Date */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-4"
        >
          <label className="text-xs text-black/45 mb-2 block font-medium">DATE</label>
          <div className="flex gap-2">
            <button
              onClick={() => setDate(new Date())}
              className={`flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  ? 'bg-[#007aff] text-white shadow-md shadow-[#007aff]/20'
                  : isDarkMode 
                    ? 'bg-[#1c1c1e] text-white/50'
                    : 'bg-white text-black/60 border border-black/10 shadow-sm hover:bg-[#f5f5f7]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                setDate(yesterday);
              }}
              className={`flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                format(date, 'yyyy-MM-dd') === format(new Date(new Date().setDate(new Date().getDate() - 1)), 'yyyy-MM-dd')
                  ? 'bg-[#007aff] text-white shadow-md shadow-[#007aff]/20'
                  : isDarkMode 
                    ? 'bg-[#1c1c1e] text-white/50'
                    : 'bg-white text-black/60 border border-black/10 shadow-sm hover:bg-[#f5f5f7]'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`px-4 py-3 rounded-xl transition-all ${
                isDarkMode 
                  ? 'bg-[#1c1c1e] text-white/50 hover:bg-[#2c2c2e]'
                  : 'bg-white text-black/60 hover:bg-[#f5f5f7] border border-black/10 shadow-sm'
              }`}
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
          </div>
          {showDatePicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-2 p-3 rounded-xl ${isDarkMode ? 'bg-[#1c1c1e]' : 'bg-white border border-black/10 shadow-sm'}`}
            >
              <input
                type="date"
                value={format(date, 'yyyy-MM-dd')}
                onChange={(e) => {
                  setDate(new Date(e.target.value));
                  setShowDatePicker(false);
                }}
                className={`w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-colors ${
                  isDarkMode 
                    ? 'bg-[#2c2c2e] text-white color-scheme-dark' 
                    : 'bg-[#f5f5f7] text-black focus:bg-white'
                }`}
                style={{ colorScheme: isDarkMode ? "dark" : "light" }}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Current Selection Summary */}
        {isFormValid && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-4 p-4 rounded-xl border transition-colors ${
              isDarkMode 
                ? 'bg-gradient-to-r from-green-700/20 to-green-900/20 border-green-1000/20'
                : 'bg-gradient-to-r from-green-100 to-green-50 border-green-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-xs font-medium mb-1 flex items-center gap-1 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                  <Check className="w-3 h-3" />
                  Ready to add
                </div>
                <div className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-green-700'}`}>
                  ₹{amount}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-black/60'}`}>{categories.find(c => c.id === selectedCategory)?.name}</div>
                {description && <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-white/50' : 'text-black/45'}`}>{description}</div>}
                <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-white/60' : 'text-white/50'}`}>{format(date, 'MMM d')}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent Expense */}
        {lastExpense && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-3 rounded-xl border transition-colors ${
              isDarkMode 
                ? 'bg-[#1c1c1e] border-white/10' 
                : 'bg-white border-black/10 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs flex items-center gap-1 text-black/45">
                <Check className={`w-3 h-3 ${isDarkMode ? 'text-green-400' : 'text-green-1000'}`} />
                Last added
              </div>
              <button
                onClick={() => handleUseTemplate({
                  id: 'temp',
                  name: lastExpense.description,
                  amount: lastExpense.amount,
                  category: lastExpense.category,
                  description: lastExpense.description,
                })}
                className="text-xs text-[#007aff] flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Use again
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{lastExpense.description}</div>
                <div className="text-black/45 text-xs mt-0.5">
                  {categories.find(c => c.id === lastExpense.category)?.name}
                </div>
              </div>
              <div className={`font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-500'}`}>₹{lastExpense.amount}</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Fixed Bottom Button with Swipe Support */}
      <div className={`flex-none w-full backdrop-blur-md border-t p-4 z-50 transition-colors ${
        isDarkMode 
          ? 'bg-black/95 border-white/10' 
          : 'bg-white/95 border-black/10'
      }`} style={{ 
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
        paddingTop: '16px'
      }}>
        <div className="w-full relative">
          <motion.button
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleSwipeUp}
            whileTap={{ scale: isFormValid ? 0.98 : 1 }}
            onClick={() => handleSubmit(false)}
            disabled={!isFormValid}
            className={`w-full py-4 rounded-2xl font-semibold text-base transition-all relative overflow-hidden ${
              isFormValid
                ? 'bg-[#007aff] hover:bg-[#0052CC] text-white shadow-lg shadow-[#007aff]/20'
                : isDarkMode 
                  ? 'bg-[#1c1c1e] text-black/60 cursor-not-allowed'
                  : 'bg-black/5 text-white/50 shadow-sm cursor-not-allowed border border-black/10'
            }`}
          >
            {isFormValid ? (
              <span className="flex items-center justify-center gap-2">
                <Wallet className="w-5 h-5" />
                Add Expense · ₹{amount}
              </span>
            ) : (
              'Select Amount & Category'
            )}
            {isFormValid && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
                <div className="h-full w-1/3 bg-white/40 mx-auto rounded-full" />
              </div>
            )}
          </motion.button>
          {isFormValid && (
            <div className={`text-center mt-2 text-xs font-medium ${isDarkMode ? 'text-white/60' : 'text-black/45'}`}>
              Swipe up to add & continue
            </div>
          )}
        </div>
      </div>
      </div>
    </motion.div>,
    document.body
  );
}
