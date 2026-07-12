import {
  createContext,
  useContext,
} from "react";

export const AuthorizationContext = createContext(null);

export function useAuthorization() {
  const context = useContext(AuthorizationContext);

  if (!context) {
    throw new Error(
      "useAuthorization must be used within an AuthorizationProvider.",
    );
  }

  return context;
}
