"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface InstallationContextValue {
  selectedInstallationId: number | null;
  setSelectedInstallationId: (id: number | null) => void;
  selectedQuarter: string | null;
  setSelectedQuarter: (quarter: string | null) => void;
}

const InstallationContext = createContext<InstallationContextValue | null>(
  null,
);

export function InstallationProvider({ children }: { children: ReactNode }) {
  const [selectedInstallationId, setSelectedInstallationId] = useState<
    number | null
  >(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);

  return (
    <InstallationContext.Provider
      value={{
        selectedInstallationId,
        setSelectedInstallationId,
        selectedQuarter,
        setSelectedQuarter,
      }}
    >
      {children}
    </InstallationContext.Provider>
  );
}

export function useInstallation() {
  const ctx = useContext(InstallationContext);
  if (!ctx)
    throw new Error("useInstallation must be used within InstallationProvider");
  return ctx;
}
