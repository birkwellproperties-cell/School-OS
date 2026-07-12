import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./App.jsx";
import { AuthProvider } from "./platform/auth";
import { AuthorizationProvider } from "./platform/authorization";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <AuthorizationProvider>
        <App />
      </AuthorizationProvider>
    </AuthProvider>
  </StrictMode>,
);