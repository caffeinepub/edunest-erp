// Stub — registration context replaced by real backend auth
import { createContext, useContext } from "react";

interface RegistrationContextType {
  selfRegistrationEnabled: boolean;
}

const RegistrationContext = createContext<RegistrationContextType>({
  selfRegistrationEnabled: false,
});

export function RegistrationProvider({
  children,
}: { children: React.ReactNode }) {
  return (
    <RegistrationContext.Provider value={{ selfRegistrationEnabled: false }}>
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  return useContext(RegistrationContext);
}
