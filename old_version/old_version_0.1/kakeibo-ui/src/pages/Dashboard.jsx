import { useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import BottomNav from "../components/BottomNav";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const [todayExpenses, setTodayExpenses] = useState([
    {
      id: 1,
      amount: 120,
      category: "NEEDS",
      note: "Coffee",
    },
    {
      id: 2,
      amount: 250,
      category: "NEEDS",
      note: "Lunch",
    },
  ]);

  return (
    <>
      <div className="min-h-screen bg-[#F2F2F7] flex justify-center py-6 pb-28">
        <div className="w-full max-w-[420px] px-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-[26px] font-semibold tracking-tight">
              January 2025
            </h1>

            <span className="text-gray-500 text-sm">Profile</span>
          </div>

          {/* Total Spent */}
          <Card>
            <p className="text-gray-500 text-sm">Total Spent</p>
            <h2 className="text-3xl font-semibold mt-1">₹12,450</h2>
          </Card>

          {/* Today's Expenses */}
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-500 mb-3">Today</h2>

            {todayExpenses.length === 0 ? (
              <p className="text-sm text-gray-400">No expenses added today.</p>
            ) : (
              <div className="space-y-4">
                {todayExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="bg-white rounded-2xl p-4 flex justify-between items-center
shadow-[0_6px_20px_rgba(0,0,0,0.08)]"
                  >
                    <div>
                      <p className="font-medium">
                        {expense.note || expense.category}
                      </p>
                      <p className="text-xs text-gray-400">
                        {expense.category}
                      </p>
                    </div>

                    <p className="font-semibold">₹{expense.amount}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Card>
              <p className="text-gray-500 text-sm">Needs</p>
              <h3 className="text-xl font-semibold mt-1">₹5,200</h3>
            </Card>

            <Card>
              <p className="text-gray-500 text-sm">Wants</p>
              <h3 className="text-xl font-semibold mt-1">₹3,100</h3>
            </Card>

            <Card>
              <p className="text-gray-500 text-sm">Culture</p>
              <h3 className="text-xl font-semibold mt-1">₹2,000</h3>
            </Card>

            <Card>
              <p className="text-gray-500 text-sm">Unexpected</p>
              <h3 className="text-xl font-semibold mt-1">₹2,150</h3>
            </Card>
          </div>

          {/* Add Expense Button */}
          <div className="mt-8">
            <Button onClick={() => navigate("/add-expense")}>
              + Add Expense
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
