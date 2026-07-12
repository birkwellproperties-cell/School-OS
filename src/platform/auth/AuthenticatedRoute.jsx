import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "./AuthContext";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-300/20 border-t-indigo-400" />

        <p className="mt-4 text-sm font-bold text-slate-300">
          Loading your account...
        </p>
      </div>
    </div>
  );
}

export default function AuthenticatedRoute() {
  const {
    isAuthenticated,
    initializing,
  } = useAuth();

  const location = useLocation();

  if (initializing) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname +
            location.search +
            location.hash,
        }}
      />
    );
  }

  return <Outlet />;
}
