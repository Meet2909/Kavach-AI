import { createContext, useContext, useState, useEffect } from 'react';

const ViewModeContext = createContext(null);

export function ViewModeProvider({ children }) {
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('kavach_view_mode') || 'simple';
  });

  useEffect(() => {
    localStorage.setItem('kavach_view_mode', viewMode);
  }, [viewMode]);

  const toggleViewMode = (mode) => setViewMode(mode);

  return (
    <ViewModeContext.Provider value={{ viewMode, toggleViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  return useContext(ViewModeContext);
}

