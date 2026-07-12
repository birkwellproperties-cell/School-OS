import { Outlet } from "react-router-dom";

import PublicFooter from "../components/PublicFooter";
import PublicHeader from "../components/PublicHeader";

export default function PublicSiteLayout() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main>
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  );
}
