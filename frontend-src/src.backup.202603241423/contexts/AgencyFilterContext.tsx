import React, { createContext, useContext, useState } from 'react';

interface AgencyFilterContextValue {
  selectedAgency: string | null;
  setSelectedAgency: (id: string | null) => void;
}

const AgencyFilterContext = createContext<AgencyFilterContextValue | null>(null);

export function AgencyFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);

  return (
    <AgencyFilterContext.Provider value={{ selectedAgency, setSelectedAgency }}>
      {children}
    </AgencyFilterContext.Provider>
  );
}

export function useAgencyFilter() {
  const ctx = useContext(AgencyFilterContext);
  if (!ctx) throw new Error('useAgencyFilter must be used within AgencyFilterProvider');
  return ctx;
}
