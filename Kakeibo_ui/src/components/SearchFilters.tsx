import { Search, X, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';

/**
 * Search & Advanced Filters Component
 * 
 * BACKEND INTEGRATION:
 * - Search queries will be sent to GET /api/expenses?search=query
 * - Filters will be sent as query parameters: category, startDate, endDate, minAmount, maxAmount
 * - Debounced search to avoid excessive API calls
 */

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onFilter: (filters: {
    category?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
  }) => void;
  isDarkMode?: boolean;
}

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'food', label: 'Food', icon: '🍴' },
  { value: 'transport', label: 'Transport', icon: '🚂' },
  { value: 'coffee', label: 'Coffee', icon: '☕' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'utilities', label: 'Utilities', icon: '⚡' },
  { value: 'other', label: 'Other', icon: '⋯' },
];

export function SearchFilters({ onSearch, onFilter, isDarkMode = false }: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // TODO: BACKEND INTEGRATION - Implement debounced search
    // Debounce search to avoid excessive API calls
    // After 500ms of no typing, call API
    const timeoutId = setTimeout(() => {
      onSearch(value);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  const handleApplyFilters = () => {
    // TODO: BACKEND INTEGRATION - Send filters to API
    // GET /api/expenses?category=food&startDate=2024-01-01&endDate=2024-01-31&minAmount=10&maxAmount=100
    
    onFilter({
      category: selectedCategory || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
    });
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    onFilter({});
  };

  const hasActiveFilters = selectedCategory || startDate || endDate || minAmount || maxAmount;

  return (
    <div className="mb-5">
      {/* Search Bar */}
      <div className="flex gap-2 mb-3">
        <div className={`flex-1 relative ${isDarkMode ? 'bg-[#1c1c1e]' : 'bg-white'} rounded-[14px] shadow-sm`}>
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search expenses..."
            className={`w-full pl-12 pr-10 py-3.5 rounded-[14px] text-[17px] focus:outline-none focus:ring-2 ${
              isDarkMode
                ? 'bg-[#1c1c1e] text-white placeholder:text-white/30 focus:ring-[#0a84ff]'
                : 'bg-white text-black placeholder:text-black/30 focus:ring-[#007aff]'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                onSearch('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/10 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`w-12 h-12 rounded-[14px] flex items-center justify-center transition-colors shadow-sm relative ${
            isDarkMode
              ? hasActiveFilters 
                ? 'bg-[#0a84ff] text-white' 
                : 'bg-[#1c1c1e] text-white hover:bg-[#2c2c2e]'
              : hasActiveFilters 
                ? 'bg-[#007aff] text-white' 
                : 'bg-white text-black hover:bg-[#f5f5f7]'
          }`}
        >
          <Filter className="w-5 h-5" strokeWidth={2.5} />
          {hasActiveFilters && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className={`rounded-[20px] p-5 shadow-sm animate-slide-down ${
          isDarkMode ? 'bg-[#1c1c1e]' : 'bg-white'
        }`}>
          <h3 className={`text-[17px] font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Advanced Filters
          </h3>

          <div className="space-y-4">
            {/* Category Filter */}
            <div>
              <label className={`block text-[15px] font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`w-full px-4 py-3 rounded-[12px] text-[17px] focus:outline-none focus:ring-2 ${
                  isDarkMode
                    ? 'bg-[#2c2c2e] text-white focus:ring-[#0a84ff]'
                    : 'bg-[#f5f5f7] text-black focus:ring-[#007aff]'
                }`}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon ? `${cat.icon} ${cat.label}` : cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-[15px] font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-4 py-3 rounded-[12px] text-[15px] focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-[#2c2c2e] text-white focus:ring-[#0a84ff]'
                      : 'bg-[#f5f5f7] text-black focus:ring-[#007aff]'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-[15px] font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full px-4 py-3 rounded-[12px] text-[15px] focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-[#2c2c2e] text-white focus:ring-[#0a84ff]'
                      : 'bg-[#f5f5f7] text-black focus:ring-[#007aff]'
                  }`}
                />
              </div>
            </div>

            {/* Amount Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-[15px] font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Min Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-4 py-3 rounded-[12px] text-[17px] focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-[#2c2c2e] text-white placeholder:text-white/30 focus:ring-[#0a84ff]'
                      : 'bg-[#f5f5f7] text-black placeholder:text-black/30 focus:ring-[#007aff]'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-[15px] font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Max Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-4 py-3 rounded-[12px] text-[17px] focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-[#2c2c2e] text-white placeholder:text-white/30 focus:ring-[#0a84ff]'
                      : 'bg-[#f5f5f7] text-black placeholder:text-black/30 focus:ring-[#007aff]'
                  }`}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className={`flex-1 py-3 px-4 rounded-[12px] transition-colors font-semibold text-[15px] ${
                  isDarkMode
                    ? 'bg-[#2c2c2e] hover:bg-[#3c3c3e] text-white'
                    : 'bg-[#f5f5f7] hover:bg-[#e5e5e7] text-black'
                }`}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className={`flex-1 py-3 px-4 rounded-[12px] transition-colors font-semibold text-[15px] ${
                  isDarkMode
                    ? 'bg-white hover:bg-white/90 text-black'
                    : 'bg-black hover:bg-black/90 text-white'
                }`}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
