import { createContext, useContext, useEffect, useMemo, useState } from "react";

type PreferencesContextValue = {
  showEmptySections: boolean;
  setShowEmptySections: (value: boolean) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);
const STORAGE_KEY = "expense-manager-preferences";

function readInitialPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { showEmptySections: false };
    const parsed = JSON.parse(raw) as Partial<PreferencesContextValue>;
    return { showEmptySections: parsed.showEmptySections === true };
  } catch {
    return { showEmptySections: false };
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [showEmptySections, setShowEmptySections] = useState(
    () => readInitialPreferences().showEmptySections,
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ showEmptySections }));
  }, [showEmptySections]);

  const value = useMemo(
    () => ({ showEmptySections, setShowEmptySections }),
    [showEmptySections],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences must be used within PreferencesProvider");
  return context;
}
