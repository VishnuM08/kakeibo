export default function Button({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-green-500 text-white py-4 rounded-xl font-semibold active:scale-95 transition"
    >
      {children}
    </button>
  );
}
