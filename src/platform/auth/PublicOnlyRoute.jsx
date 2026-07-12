import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "./AuthContext";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-300/20 border-t-indigo-400" />

        <p className="mt-4 text-sm font-bold text-slate-300">
          Loading SchoolOS...
        </p>
      </div>
    </div>
  );
}

export default function PublicOnlyRoute() {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
