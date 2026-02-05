import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import BottomNav from "../components/BottomNav";
import { useState } from "react";


export default function AddExpense() {
  const [category, setCategory] = useState(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  const handleSave = () => {
  if (!amount || !category || !date) {
    alert("Please fill amount, category, and date");
    return;
  }

  const expense = {
    amount: Number(amount),
    category,
    date,
    note,}; 
    
    console.log("EXPENSE TO SAVE:", expense); };


  return (
    <>
    <div className="min-h-screen bg-[#F2F2F7] flex justify-center py-6 pb-28">
  <div className="w-full max-w-[420px] px-4">


          {/* Header */}
        <h1 className="text-[26px] font-semibold tracking-tight mb-6">
        Add Expense</h1>


          <Card>
            <div className="space-y-5">

              {/* Amount */}
              <div>
                <label className="text-sm text-gray-500">Amount</label>
                <Input placeholder="₹ 0.00" value={amount} onChange={(e) => setAmount(e.target.value)}/>

              </div>

              {/* Category */}
              <div>
                <label className="text-sm text-gray-500">Category</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                 <button onClick={() => setCategory("NEEDS")} 
                 className={`p-3 rounded-xl border transition transform active:scale-95
                ${category === "NEEDS"
                    ? "bg-green-100 border-green-500 text-green-700"
                    : "bg-white border-gray-200 text-gray-600"}
                `}>Needs</button>
                 <button onClick={() => setCategory("WANTS")} 
                 className={`p-3 rounded-xl border transition transform active:scale-95
                ${category === "WANTS"
                    ? "bg-green-100 border-green-500 text-green-700"
                    : "bg-white border-gray-200 text-gray-600"}
                `}>Wants</button>
                 <button onClick={() => setCategory("CULTURE")} 
                 className={`p-3 rounded-xl border transition transform active:scale-95
                ${category === "CULTURE"
                    ? "bg-green-100 border-green-500 text-green-700"
                    : "bg-white border-gray-200 text-gray-600"}
                `}>Culture</button>
                 <button onClick={() => setCategory("UNEXPECTED")} 
                 className={`p-3 rounded-xl border transition transform active:scale-95
                ${category === "UNEXPECTED"
                    ? "bg-green-100 border-green-500 text-green-700"
                    : "bg-white border-gray-200 text-gray-600"}
                `}>Unexpected</button>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-sm text-gray-500">Date</label>
               <Input type="date" value={date} onChange={(e) => setDate(e.target.value)}/>
              </div>

              {/* Note */}
              <div>
                <label className="text-sm text-gray-500">Note (optional)</label>
                <Input placeholder="Lunch, travel, coffee…" value={note} onChange={(e) => setNote(e.target.value)} />

              </div>

              {/* Save Button */}
              <Button onClick={handleSave}>Save Expense</Button>


            </div>
          </Card>
        </div>
        {category && (
        <p className="mt-2 text-sm text-gray-500">Selected: {category}</p>)}
        </div>

      {/* ✅ Bottom nav INSIDE return */}
      <BottomNav />
    </>
  );
}
