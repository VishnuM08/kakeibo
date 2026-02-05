import { Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function AppLayout() {
  return (
    <>
      <Outlet /> {/* page content */}
      <BottomNav />
    </>
  );
}
