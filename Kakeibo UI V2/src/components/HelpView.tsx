import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Calendar,
  BarChart3,
  Repeat,
  Bell,
  Target,
  Download,
  Search,
  Zap,
  Lock,
  Moon,
  CreditCard,
  Trash2,
  Edit2,
  Filter,
  TrendingUp,
  DollarSign,
  Book,
} from 'lucide-react';

interface HelpViewProps {
  onClose: () => void;
  isDarkMode: boolean;
}

interface HelpSection {
  id: string;
  title: string;
  icon: any;
  color: string;
  items: {
    question: string;
    answer: string;
  }[];
}

const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Book,
    color: 'from-[#00b894] to-[#00cec9]',
    items: [
      {
        question: 'What is Kakeibo?',
        answer: 'Kakeibo (家計簿) is a Japanese budgeting method that focuses on mindful spending. It helps you track where your money goes and make conscious financial decisions. This app brings the Kakeibo philosophy to your digital life with modern features.',
      },
      {
        question: 'How do I set my first budget?',
        answer: 'Tap the Settings icon (gear) at the top right → Enter your monthly budget amount → Save. The app will track your spending against this budget and show you remaining balance.',
      },
      {
        question: 'What currency does the app use?',
        answer: 'The app uses Indian Rupees (₹) throughout all features and displays. All amounts are calculated and displayed in ₹.',
      },
    ],
  },
  {
    id: 'expenses',
    title: 'Managing Expenses',
    icon: Plus,
    color: 'from-[#0a84ff] to-[#007aff]',
    items: [
      {
        question: 'How do I add an expense?',
        answer: 'Tap the blue "+" button → Enter description, select category, enter amount → Choose date if not today → Add notes or receipt photo (optional) → Tap "Add Expense". Your expense is saved instantly!',
      },
      {
        question: 'How do I edit or delete an expense?',
        answer: 'Swipe left on any expense to reveal Edit and Delete buttons. Or tap the expense → Use Edit/Delete buttons in the detail view. You can modify description, amount, category, date, notes, and receipt photos.',
      },
      {
        question: 'What are Quick Add Expenses?',
        answer: 'Quick Add lets you save frequently bought items (like "Morning Coffee ₹50" or "Lunch ₹150"). Just tap once to add these common expenses without filling out the form each time. Find it on your dashboard!',
      },
      {
        question: 'Can I add a receipt photo?',
        answer: 'Yes! When adding or editing an expense, tap "Add Receipt Photo" → Choose from camera or gallery. You can view receipts anytime by tapping the expense.',
      },
    ],
  },
  {
    id: 'categories',
    title: 'Categories',
    icon: Filter,
    color: 'from-[#a29bfe] to-[#6c5ce7]',
    items: [
      {
        question: 'What categories are available?',
        answer: 'Food & Dining 🍴, Transport 🚂, Coffee & Snacks ☕, Shopping 🛍️, Entertainment 🎬, Utilities ⚡, and Other. Each category has its own color gradient icon for easy identification.',
      },
      {
        question: 'How do I see expenses by category?',
        answer: 'Use the Search & Filter button (magnifying glass) → Select categories to view. Analytics view also shows category-wise breakdowns with charts and percentages.',
      },
    ],
  },
  {
    id: 'recurring',
    title: 'Recurring Expenses',
    icon: Repeat,
    color: 'from-[#ff6b6b] to-[#ee5a6f]',
    items: [
      {
        question: 'What are recurring expenses?',
        answer: 'Recurring expenses are regular payments like subscriptions (Netflix, Spotify), rent, or gym memberships. Set them once, and the app tracks when they\'re due.',
      },
      {
        question: 'How do I add a recurring expense?',
        answer: 'Tap the Recurring Expenses widget → "+" button → Enter name, amount, category → Choose frequency (Daily/Weekly/Monthly/Yearly) → Set start date → Save. The app will track next occurrence automatically.',
      },
      {
        question: 'How do I process a recurring expense?',
        answer: 'When a recurring expense is due, tap "Process Now" → The expense is added to your regular expenses and next occurrence is calculated automatically. You can also pause/resume recurring expenses anytime.',
      },
      {
        question: 'What is Monthly Projection?',
        answer: 'Monthly Projection shows estimated monthly cost of all active recurring expenses. Daily expenses are multiplied by 30, weekly by 4, yearly divided by 12. This helps you plan your budget.',
      },
    ],
  },
  {
    id: 'bills',
    title: 'Bill Reminders',
    icon: Bell,
    color: 'from-[#fd79a8] to-[#e84393]',
    items: [
      {
        question: 'What\'s the difference between Bills and Recurring Expenses?',
        answer: 'Bills are payment reminders (electricity, credit card, rent) with due dates and can be marked as paid. Recurring expenses are for tracking subscriptions and regular spending. Bills focus on payment tracking, recurring expenses focus on spending patterns.',
      },
      {
        question: 'How do I add a bill reminder?',
        answer: 'Tap Upcoming Bills widget → "+" button → Enter bill name, amount, category → Choose type (One-time or Recurring) → Set due date → For recurring, choose frequency → Save.',
      },
      {
        question: 'How do I mark a bill as paid?',
        answer: 'Tap the bill → "Mark as Paid" button. If enabled, the expense will be automatically added to your expense list. For recurring bills, next occurrence is scheduled automatically.',
      },
      {
        question: 'What happens to overdue bills?',
        answer: 'Overdue bills are highlighted in red/orange on the dashboard. The widget shows overdue count prominently to help you stay on top of payments.',
      },
    ],
  },
  {
    id: 'savings',
    title: 'Savings Goals',
    icon: Target,
    color: 'from-[#f7b731] to-[#fa8231]',
    items: [
      {
        question: 'How do I create a savings goal?',
        answer: 'Tap the Savings Goals button (target icon) → "+" button → Enter goal name, target amount, deadline → Add initial contribution (optional) → Save. Track your progress with the visual progress bar!',
      },
      {
        question: 'How do I add contributions to my goal?',
        answer: 'Tap the goal → "Add Contribution" → Enter amount → Save. The progress bar updates instantly and shows percentage completed. You can add multiple contributions over time.',
      },
      {
        question: 'Can I edit or delete a goal?',
        answer: 'Yes! Tap the goal → Use Edit or Delete buttons. You can modify target amount, deadline, or goal name. All contributions are preserved when editing.',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    icon: BarChart3,
    color: 'from-[#4ecdc4] to-[#44a08d]',
    items: [
      {
        question: 'How do I view my spending analytics?',
        answer: 'Tap the Analytics button (bar chart icon) → See category breakdown pie chart, top expenses, weekly spending trends, and daily average. Switch between weekly and monthly views.',
      },
      {
        question: 'What is Weekly Summary?',
        answer: 'Weekly Summary card shows this week\'s spending vs last week, change percentage, and top category. Find it on your dashboard to track weekly spending habits.',
      },
      {
        question: 'How do I export my data?',
        answer: 'Tap the Export button (download icon) → Choose export range (This Month, Last Month, Last 3 Months, All Time, or Custom Range) → Data exports as CSV file with all expense details.',
      },
      {
        question: 'What\'s in the exported CSV?',
        answer: 'The CSV file contains: Date, Description, Category, Amount (₹), and Notes for all expenses in the selected range. Perfect for Excel/Google Sheets analysis or tax purposes.',
      },
    ],
  },
  {
    id: 'calendar',
    title: 'Calendar & History',
    icon: Calendar,
    color: 'from-[#00b894] to-[#00cec9]',
    items: [
      {
        question: 'How do I view past expenses?',
        answer: 'Tap "View Past Expenses" button → Calendar view shows all months with expense counts → Tap any date to see expenses for that day. Navigate between months using arrows.',
      },
      {
        question: 'What are the dots on calendar dates?',
        answer: 'Blue dots indicate days with expenses. Larger dots mean more expenses that day. This gives you a quick visual overview of your spending patterns.',
      },
    ],
  },
  {
    id: 'search',
    title: 'Search & Filters',
    icon: Search,
    color: 'from-[#a29bfe] to-[#6c5ce7]',
    items: [
      {
        question: 'How do I search for expenses?',
        answer: 'Tap the Search icon (magnifying glass) → Type in the search box to find expenses by description or notes. Results update as you type.',
      },
      {
        question: 'How do I filter expenses?',
        answer: 'Tap Search icon → Use Category filter to select specific categories → Use Date Range to filter by time period → Use Amount Range to find expenses within a price range. All filters work together!',
      },
    ],
  },
  {
    id: 'features',
    title: 'Additional Features',
    icon: Zap,
    color: 'from-[#ff6b6b] to-[#ee5a6f]',
    items: [
      {
        question: 'How do I enable dark mode?',
        answer: 'Tap the Sun/Moon icon at the top right. Dark mode reduces eye strain and saves battery on OLED screens. Your preference is saved automatically.',
      },
      {
        question: 'What are swipe gestures?',
        answer: 'Swipe left on any expense to reveal Edit and Delete buttons (iOS Mail-style). This makes managing expenses faster and more intuitive.',
      },
      {
        question: 'Is my data secure?',
        answer: 'Yes! All data is stored locally on your device using browser localStorage. The app has offline-first architecture - works without internet. Your data never leaves your device unless you export it.',
      },
      {
        question: 'Can I set a PIN lock?',
        answer: 'The app supports PIN/biometric lock settings for added security. This prevents unauthorized access to your financial data.',
      },
    ],
  },
  {
    id: 'tips',
    title: 'Pro Tips & Best Practices',
    icon: TrendingUp,
    color: 'from-[#f7b731] to-[#fa8231]',
    items: [
      {
        question: 'How can I use this app most effectively?',
        answer: 'Follow the Kakeibo method: 1) Set a realistic monthly budget, 2) Add expenses daily (use Quick Add for speed), 3) Review weekly spending every Sunday, 4) Check analytics monthly to identify patterns, 5) Adjust budget based on insights.',
      },
      {
        question: 'What should I do at month end?',
        answer: 'Review Analytics → Export monthly report → Compare with previous months → Adjust next month\'s budget → Set new savings goals → Archive or delete unnecessary old expenses.',
      },
      {
        question: 'How do I reduce spending?',
        answer: 'Use category budgets to limit spending per category. Set up bill reminders to avoid late fees. Use recurring expense tracking to identify subscriptions you don\'t use. Review "Top Expenses" in analytics to spot spending leaks.',
      },
    ],
  },
];

export function HelpView({ onClose, isDarkMode }: HelpViewProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const toggleItem = (itemKey: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemKey)) {
      newExpanded.delete(itemKey);
    } else {
      newExpanded.add(itemKey);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden ${
          isDarkMode ? 'bg-[#1c1c1e]' : 'bg-white'
        }`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 backdrop-blur-xl border-b ${
          isDarkMode ? 'bg-[#1c1c1e]/95 border-white/10' : 'bg-white/95 border-black/5'
        }`}>
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-[#0a84ff] to-[#007aff] flex items-center justify-center`}>
                <HelpCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className={`text-[28px] font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Help & Guide
                </h2>
                <p className={`text-[15px] ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                  Learn how to use Kakeibo
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'
              }`}
            >
              <X className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          <div className="p-5 space-y-3">
            {helpSections.map((section) => (
              <div key={section.id}>
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full p-4 rounded-[16px] transition-all ${
                    expandedSection === section.id
                      ? (isDarkMode ? 'bg-white/10' : 'bg-black/5')
                      : (isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/3 hover:bg-black/5')
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0`}>
                      <section.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <h3 className={`text-[17px] font-semibold flex-1 text-left ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      {section.title}
                    </h3>
                    <motion.div
                      animate={{ rotate: expandedSection === section.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className={`w-5 h-5 ${
                        isDarkMode ? 'text-white/50' : 'text-black/50'
                      }`} />
                    </motion.div>
                  </div>
                </button>

                {/* Section Items */}
                <AnimatePresence>
                  {expandedSection === section.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-2">
                        {section.items.map((item, index) => {
                          const itemKey = `${section.id}-${index}`;
                          const isExpanded = expandedItems.has(itemKey);

                          return (
                            <div
                              key={itemKey}
                              className={`ml-4 rounded-[12px] border overflow-hidden ${
                                isDarkMode ? 'border-white/10' : 'border-black/10'
                              }`}
                            >
                              <button
                                onClick={() => toggleItem(itemKey)}
                                className={`w-full p-3 text-left transition-colors ${
                                  isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <motion.div
                                    animate={{ rotate: isExpanded ? 90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex-shrink-0 mt-0.5"
                                  >
                                    <ChevronRight className={`w-4 h-4 ${
                                      isDarkMode ? 'text-white/50' : 'text-black/50'
                                    }`} />
                                  </motion.div>
                                  <p className={`text-[15px] font-medium ${
                                    isDarkMode ? 'text-white/90' : 'text-black/90'
                                  }`}>
                                    {item.question}
                                  </p>
                                </div>
                              </button>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`border-t ${
                                      isDarkMode ? 'border-white/10' : 'border-black/10'
                                    }`}
                                  >
                                    <div className="p-3 pl-9">
                                      <p className={`text-[15px] leading-relaxed ${
                                        isDarkMode ? 'text-white/70' : 'text-black/70'
                                      }`}>
                                        {item.answer}
                                      </p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Footer Info */}
            <div className={`mt-8 p-4 rounded-[16px] border ${
              isDarkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'
            }`}>
              <h4 className={`text-[15px] font-semibold mb-2 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-700'
              }`}>
                Need More Help?
              </h4>
              <p className={`text-[14px] leading-relaxed ${
                isDarkMode ? 'text-white/70' : 'text-black/70'
              }`}>
                This app follows the Kakeibo philosophy of mindful spending. Remember: the goal isn't just to track expenses, but to understand your relationship with money and make conscious financial decisions.
              </p>
            </div>

            {/* Version Info */}
            <div className={`text-center py-4 ${
              isDarkMode ? 'text-white/30' : 'text-black/30'
            }`}>
              <p className="text-[13px]">Kakeibo Expense Tracker v1.0</p>
              <p className="text-[12px] mt-1">Made with mindfulness 🧘‍♂️</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
