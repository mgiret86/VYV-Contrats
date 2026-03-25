import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from './AuthContext';

// ============================================================
// TYPES
// ============================================================

export type BudgetLineType = 'CONTRACT' | 'GIE' | 'INVESTMENT' | 'SUBSCRIPTION' | 'INTERNAL' | 'OTHER';

export interface BudgetLine {
  id: string;
  label: string;
  type: BudgetLineType;
  category: string;
  year: number;
  budgetHt: number;
  actualHt: number;
  vatRate: number;
  notes?: string | null;
  linkedContractIds: string[];
  isRecurring: boolean;
}

interface BudgetContextValue {
  budgetLines: BudgetLine[];
  loading: boolean;
  addBudgetLine: (line: Omit<BudgetLine, 'id'>) => Promise<BudgetLine>;
  updateBudgetLine: (id: string, data: Partial<BudgetLine>) => Promise<void>;
  deleteBudgetLine: (id: string) => Promise<void>;
  getBudgetLineById: (id: string) => BudgetLine | undefined;
  getBudgetLinesByYear: (year: number) => BudgetLine[];
  availableYears: number[];
  refreshBudget: (year?: number) => Promise<void>;
}

// ============================================================
// TYPES LABELS
// ============================================================

export const BUDGET_TYPE_CONFIG: Record<BudgetLineType, { label: string; className: string }> = {
  CONTRACT: { label: 'Contrat', className: 'bg-blue-100 text-blue-700' },
  GIE: { label: 'Cotisation GIE', className: 'bg-purple-100 text-purple-700' },
  INVESTMENT: { label: 'Investissement', className: 'bg-orange-100 text-orange-700' },
  SUBSCRIPTION: { label: 'Abonnement', className: 'bg-cyan-100 text-cyan-700' },
  INTERNAL: { label: 'Charge interne', className: 'bg-yellow-100 text-yellow-700' },
  OTHER: { label: 'Autre', className: 'bg-gray-100 text-gray-600' },
};

// ============================================================
// MAPPERS
// ============================================================

function mapApiBudgetLine(raw: any): BudgetLine {
  return {
    id: raw.id,
    label: raw.label,
    type: raw.type,
    category: raw.category,
    year: raw.year,
    budgetHt: raw.budgetHt,
    actualHt: raw.actualHt,
    vatRate: raw.vatRate,
    notes: raw.notes,
    isRecurring: raw.isRecurring,
    linkedContractIds: raw.linkedContracts?.map((lc: any) => lc.contractId || lc.contract?.id) || [],
  };
}

// ============================================================
// CONTEXT
// ============================================================

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshBudget = useCallback(async (year?: number) => {
    try {
      const y = year || new Date().getFullYear();
      const data = await apiFetch<any[]>(`/budget?year=${y}`);
      setBudgetLines(data.map(mapApiBudgetLine));
    } catch (err) {
      console.error('Erreur chargement budget:', err);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    refreshBudget().finally(() => setLoading(false));
  }, [user, refreshBudget]);

  const addBudgetLine = useCallback(async (line: Omit<BudgetLine, 'id'>): Promise<BudgetLine> => {
    const created = await apiFetch<any>('/budget', {
      method: 'POST',
      body: JSON.stringify({
        label: line.label,
        type: line.type,
        category: line.category,
        year: line.year,
        budgetHt: line.budgetHt,
        actualHt: line.actualHt,
        vatRate: line.vatRate,
        isRecurring: line.isRecurring,
        notes: line.notes,
        linkedContractIds: line.linkedContractIds,
      }),
    });
    const mapped = mapApiBudgetLine(created);
    setBudgetLines((prev) => [...prev, mapped]);
    return mapped;
  }, []);

  const updateBudgetLine = useCallback(async (id: string, data: Partial<BudgetLine>) => {
    const updated = await apiFetch<any>(`/budget/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        label: data.label,
        type: data.type,
        category: data.category,
        year: data.year,
        budgetHt: data.budgetHt,
        actualHt: data.actualHt,
        vatRate: data.vatRate,
        isRecurring: data.isRecurring,
        notes: data.notes,
        linkedContractIds: data.linkedContractIds,
      }),
    });
    const mapped = mapApiBudgetLine(updated);
    setBudgetLines((prev) => prev.map((l) => (l.id === id ? mapped : l)));
  }, []);

  const deleteBudgetLine = useCallback(async (id: string) => {
    await apiFetch(`/budget/${id}`, { method: 'DELETE' });
    setBudgetLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const getBudgetLineById = useCallback(
    (id: string) => budgetLines.find((l) => l.id === id),
    [budgetLines]
  );

  const getBudgetLinesByYear = useCallback(
    (year: number) => budgetLines.filter((l) => l.year === year),
    [budgetLines]
  );

  const availableYears = useMemo(() => {
    const years = [...new Set(budgetLines.map((l) => l.year))];
    const currentYear = new Date().getFullYear();
    if (!years.includes(currentYear)) years.push(currentYear);
    return years.sort((a, b) => b - a);
  }, [budgetLines]);

  return (
    <BudgetContext.Provider
      value={{
        budgetLines,
        loading,
        addBudgetLine,
        updateBudgetLine,
        deleteBudgetLine,
        getBudgetLineById,
        getBudgetLinesByYear,
        availableYears,
        refreshBudget,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider');
  return ctx;
}

export const BUDGET_CATEGORIES = [
  'Infrastructure',
  'Licences',
  'Télécom',
  'Sécurité',
  'Services managés',
  'GIE Groupe',
  'Matériels',
  'Cloud & Hébergement',
  'Autres',
];
