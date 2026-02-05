import BottomNav from "../components/BottomNav";

const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

export default function Calendar() {
  const year = 2025;
  const month = 0; // January (0-based)
  const totalDays = daysInMonth(year, month);

  const today = new Date().getDate();

  return (
    <>
      <div className="min-h-screen bg-[#F2F2F7] flex justify-center py-6 pb-28">
        <div className="w-full max-w-[420px] px-4">
          <h1 className="text-[26px] font-semibold tracking-tight mb-4">
            January 2025
          </h1>

          {/* Weekdays */}
          <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const isToday = day === today;

              return (
                <button
                  key={day}
                  className={`h-12 rounded-xl text-sm font-medium
                    ${
                      isToday
                        ? "bg-green-500 text-white"
                        : "bg-white text-gray-800"
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
