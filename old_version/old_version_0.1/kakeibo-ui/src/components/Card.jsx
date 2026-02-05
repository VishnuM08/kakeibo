export default function Card({ children }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
      {children}
    </div>
  );
}
