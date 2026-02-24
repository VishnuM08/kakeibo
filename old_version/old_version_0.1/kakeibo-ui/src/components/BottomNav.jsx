import { NavLink } from "react-router-dom";

export default function BottomNav() {
  const base =
    "flex flex-col items-center justify-center flex-1 text-[11px] font-medium";
  const active = "text-green-600";
  const inactive = "text-gray-500";

  return (
    <div className="fixed bottom-4 left-0 right-0 z-[9999] flex justify-center px-4">
      <div
        className="
          w-full max-w-[420px]
          h-16
          flex
          rounded-2xl
          bg-white
          border border-gray-300
          shadow-[0_4px_20px_rgba(0,0,0,0.15)]
        "
      >
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${base} ${isActive ? active : inactive}`
          }
        >
          <span className="text-lg">🏠</span>
          Home
        </NavLink>

        <NavLink
          to="/calendar"
          className={({ isActive }) =>
            `${base} ${isActive ? active : inactive}`
          }
        >
          <span className="text-lg">📅</span>
          Calendar
        </NavLink>

        <NavLink
          to="/add-expense"
          className={({ isActive }) =>
            `${base} ${isActive ? active : inactive}`
          }
        >
          <span className="text-lg">➕</span>
          Add
        </NavLink>
      </div>
    </div>
  );
}
