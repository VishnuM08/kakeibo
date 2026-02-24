import { Filter, X } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const categories = [
  { value: 'food', label: 'Food', color: 'from-[#ff6b6b] to-[#ee5a6f]' },
  { value: 'transport', label: 'Transport', color: 'from-[#4ecdc4] to-[#44a08d]' },
  { value: 'coffee', label: 'Coffee', color: 'from-[#f7b731] to-[#fa8231]' },
  { value: 'shopping', label: 'Shopping', color: 'from-[#a29bfe] to-[#6c5ce7]' },
  { value: 'entertainment', label: 'Entertainment', color: 'from-[#fd79a8] to-[#e84393]' },
  { value: 'utilities', label: 'Utilities', color: 'from-[#00b894] to-[#00cec9]' },
  { value: 'other', label: 'Other', color: 'from-[#b2bec3] to-[#636e72]' },
];

export function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-black/50" strokeWidth={2.5} />
        <p className="text-[13px] font-semibold text-black/50 uppercase tracking-wider">
          Filter by Category
        </p>
      </div>
      
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* All button */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold text-[15px] transition-all ${
            selectedCategory === null
              ? 'bg-black text-white'
              : 'bg-white text-black border border-black/10 hover:bg-[#f5f5f7]'
          }`}
        >
          All
        </button>

        {/* Category buttons */}
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onSelectCategory(cat.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold text-[15px] transition-all flex items-center gap-2 ${
              selectedCategory === cat.value
                ? `bg-gradient-to-r ${cat.color} text-white shadow-sm`
                : 'bg-white text-black border border-black/10 hover:bg-[#f5f5f7]'
            }`}
          >
            {cat.label}
            {selectedCategory === cat.value && (
              <X className="w-4 h-4" strokeWidth={2.5} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
