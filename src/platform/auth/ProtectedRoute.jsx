import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "./AuthContext";

function LoadingScreen({
  message = "Loading SchoolOS...",
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

        <p className="mt-4 text-sm font-bold text-slate-600">
          {message}
        </p>
      </div>
    </div>
  );
}

export default function ProtectedRoute() {
  const {
    isAuthenticated,
    initializing,
    bootstrapLoading,
    accessStatus,
  } = useAuth();

  const location = useLocation();

  if (initializing) {
    return (
      <LoadingScreen message="Restoring your SchoolOS session..." />
    );
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

  if (bootstrapLoading) {
    return (
      <LoadingScreen message="Loading your enterprise workspace..." />
    );
  }

  if (accessStatus !== "ready") {
    return (
      <Navigate
        to="/account-pending"
        replace
        state={{
          accessStatus,
        }}
      />
    );
  }

  return <Outlet />;
}
