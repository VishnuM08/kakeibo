import { ArrowLeft, Plus, Target, TrendingUp, X, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SavingsGoal } from '../types/SavingsGoal.ts';
import { getSavingsGoals, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal } from '../services/api';

/**
 * Savings Goals View Component
 * 
 * BACKEND INTEGRATION:
 * - Fetches savings goals via GET /api/savings-goals
 * - Creates new goals via POST /api/savings-goals
 * - Updates goal progress via PUT /api/savings-goals/{id}
 * - Deletes goals via DELETE /api/savings-goals/{id}
 */

interface SavingsGoalsViewProps {
  onClose: () => void;
  isDarkMode?: boolean;
}

export function SavingsGoalsView({ onClose, isDarkMode = false }: SavingsGoalsViewProps) {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const fetchedGoals = await getSavingsGoals();
      setGoals(fetchedGoals);
    } catch (error) {
      console.error('Failed to fetch savings goals:', error);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoalName.trim() || !newGoalTarget || !newGoalDeadline) return;

    try {
      const newGoal = await createSavingsGoal({
        name: newGoalName,
        targetAmount: parseFloat(newGoalTarget),
        deadline: newGoalDeadline,
      });

      setGoals([...goals, newGoal]);
      setNewGoalName('');
      setNewGoalTarget('');
      setNewGoalDeadline('');
      setIsAddingGoal(false);
    } catch (error) {
      console.error('Failed to create savings goal:', error);
      alert('Failed to create savings goal. Please try again.');
    }
  };

  const handleAddToGoal = async (goalId: string) => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const updatedGoal = await updateSavingsGoal(goalId, {
        addAmount: amount
      });

      setGoals(goals.map(g => 
        g.id === goalId ? updatedGoal : g
      ));
      setAddAmount('');
      setSelectedGoal(null);
    } catch (error) {
      console.error('Failed to update savings goal:', error);
      alert('Failed to add amount. Please try again.');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm('Delete this savings goal?')) return;

    try {
      await deleteSavingsGoal(goalId);
      setGoals(goals.filter(g => g.id !== goalId));
    } catch (error) {
      console.error('Failed to delete savings goal:', error);
      alert('Failed to delete savings goal. Please try again.');
    }
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isDarkMode ? 'bg-[#121212]' : 'bg-[#f5f5f7]'}`}>
      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onClose}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isDarkMode ? 'bg-[#1c1c1e] hover:bg-[#2c2c2e]' : 'bg-white hover:bg-[#e5e5e7]'
            }`}
          >
            <ArrowLeft className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} strokeWidth={2.5} />
          </button>
          <h1 className={`text-[28px] font-bold flex-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Savings Goals
          </h1>
          <button
            onClick={() => setIsAddingGoal(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007aff] to-[#0051d5] flex items-center justify-center"
          >
            <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </div>

        {/* Add Goal Modal */}
        {isAddingGoal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setIsAddingGoal(false)}>
            <div className={`rounded-[28px] w-full max-w-md mx-5 p-6 ${isDarkMode ? 'bg-[#1c1c1e]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
              <h3 className={`text-[24px] font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                New Savings Goal
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Goal name (e.g., Vacation)"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-[12px] text-[17px] focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-[#2c2c2e] text-white placeholder:text-white/30 focus:ring-[#0a84ff]'
                      : 'bg-[#f5f5f7] text-black placeholder:text-black/30 focus:ring-[#007aff]'
                  }`}
                />
                <input
                  type="number"
                  placeholder="Target amount (₹)"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className={`w-full px-4 py-3 rounded-[12px] text-[17px] focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-[#2c2c2e] text-white placeholder:text-white/30 focus:ring-[#0a84ff]'
                      : 'bg-[#f5f5f7] text-black placeholder:text-black/30 focus:ring-[#007aff]'
                  }`}
                />
                <input
                  type="date"
                  value={newGoalDeadline}
                  onChange={(e) => setNewGoalDeadline(e.target.value)}
                  className={`w-full px-4 py-3 rounded-[12px] text-[17px] focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-[#2c2c2e] text-white focus:ring-[#0a84ff]'
                      : 'bg-[#f5f5f7] text-black focus:ring-[#007aff]'
                  }`}
                />
                <button
                  onClick={handleCreateGoal}
                  className={`w-full py-3 rounded-[12px] font-semibold ${
                    isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                  }`}
                >
                  Create Goal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Goals List */}
        {goals.length === 0 ? (
          <div className={`rounded-[20px] p-10 text-center ${isDarkMode ? 'bg-[#1c1c1e]' : 'bg-white'}`}>
            <Target className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-white/20' : 'text-black/20'}`} />
            <p className={`text-[17px] mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              No Savings Goals Yet
            </p>
            <p className={`text-[15px] ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
              Create a goal to start tracking your savings progress
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isExpanded = selectedGoal === goal.id;

              return (
                <div key={goal.id} className={`rounded-[20px] p-5 shadow-sm ${isDarkMode ? 'bg-[#1c1c1e]' : 'bg-white'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className={`text-[20px] font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {goal.name}
                      </h3>
                      <p className={`text-[13px] ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isDarkMode ? 'hover:bg-[#2c2c2e]' : 'hover:bg-[#f5f5f7]'
                      }`}
                    >
                      <X className={`w-4 h-4 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`} />
                    </button>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between mb-2">
                      <span className={`text-[24px] font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        ₹{goal.currentAmount.toFixed(2)}
                      </span>
                      <span className={`text-[17px] ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                        / ₹{goal.targetAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className={`w-full h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`}>
                      <div
                        className="h-full bg-gradient-to-r from-[#34c759] to-[#30d158] transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className={`text-[13px] mt-1 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                      {progress.toFixed(0)}% complete
                    </p>
                  </div>

                  {isExpanded ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Add amount"
                        value={addAmount}
                        onChange={(e) => setAddAmount(e.target.value)}
                        className={`flex-1 px-3 py-2 rounded-[10px] text-[15px] focus:outline-none ${
                          isDarkMode ? 'bg-[#2c2c2e] text-white' : 'bg-[#f5f5f7] text-black'
                        }`}
                      />
                      <button
                        onClick={() => handleAddToGoal(goal.id)}
                        className="px-4 py-2 rounded-[10px] bg-[#34c759] text-white font-semibold text-[15px]"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedGoal(goal.id)}
                      className={`w-full py-2 rounded-[10px] font-semibold text-[15px] ${
                        isDarkMode ? 'bg-[#2c2c2e] text-white' : 'bg-[#f5f5f7] text-black'
                      }`}
                    >
                      Add Money
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
