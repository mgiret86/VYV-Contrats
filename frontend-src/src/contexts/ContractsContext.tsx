import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from './AuthContext';

// ============================================================
// TYPES
// ============================================================
// NOUVEAU — détail agence avec pourcentage
export interface ContractAgencyDetail {
  agencyId: string;
  agencyCode: string;
  agencyName: string;
  agencyCity: string;
  percentage: number;
}

export interface Contract {
  id: string;
  reference: string;
  supplierReference?: string | null;
  title: string;
  category: string;
  subCategory?: string | null;
  status: string;
  scope: string;
  supplierId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  autoRenewal: boolean;
  renewalDuration?: number | null;
  renewalUnit?: string | null;
  noticePeriod: number;
  noticePeriodUnit: string;
  noticeDeadline?: string | null;
  denouncedAt?: string | null;
  amountHt: number;
  vatRate: number;
  billingPeriod: string;
  tariffRevision?: string | null;
  distributionMode?: string | null;
  notes?: string | null;
  budgetLineId?: string | null;
  agencies: string | string[];
  agencyDetails: ContractAgencyDetail[];
  supplier?: { id: string; name: string };
  leaser?: { id: string; name: string } | null;
  leaserId?: string | null;
  articles?: { id: string; designation: string; quantity: number; agencyId?: string | null; agency?: { id: string; code: string; name: string; city: string } | null }[];
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address?: string;
  siret?: string;
  website?: string;
  notes?: string;
  isActive: boolean;
}

interface ContractsContextValue {
  contracts: Contract[];
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  refreshContracts: () => Promise<void>;
  refreshSuppliers: () => Promise<void>;
  addContract: (contract: Omit<Contract, 'id'>) => Promise<Contract>;
  updateContract: (id: string, data: Partial<Contract>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  denounceContract: (id: string) => Promise<void>;
  getContractById: (id: string) => Contract | undefined;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier>;
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  getSupplierById: (id: string) => Supplier | undefined;
  getContractsBySupplier: (supplierId: string) => Contract[];
}

// ============================================================
// MAPPERS : API → Frontend
// ============================================================

function mapApiContract(raw: any): Contract {
  const scopeMap: Record<string, string> = {
    NATIONAL: 'ALL_AGENCIES',
    LOCAL: 'MULTI_AGENCY',
    REGIONAL: 'MULTI_AGENCY',
    HEADQUARTERS: 'HEADQUARTERS',
  };

  const agencyDetails: ContractAgencyDetail[] = Array.isArray(raw.agencies)
    ? raw.agencies.map((a: any) => ({
        agencyId: a.agency?.id || a.agencyId,
        agencyCode: a.agency?.code || '',
        agencyName: a.agency?.name || '',
        agencyCity: a.agency?.city || '',
        percentage: a.percentage ?? 0,
      }))
    : [];

  return {
    id: raw.id,
    reference: raw.reference,
    supplierReference: null,
    title: raw.title,
    category: raw.category,
    subCategory: null,
    status: raw.status,
    scope: scopeMap[raw.scope] || raw.scope,
    supplierId: raw.supplierId,
    ownerId: '',
    startDate: raw.startDate?.split('T')[0] || '',
    endDate: raw.endDate?.split('T')[0] || '',
    autoRenewal: raw.tacitRenewal ?? false,
    renewalDuration: raw.renewalDurationMonths,
    renewalUnit: raw.renewalDurationMonths ? 'mois' : null,
    noticePeriod: raw.noticePeriodMonths || 3,
    noticePeriodUnit: 'mois',
    noticeDeadline: raw.denounceBeforeDate?.split('T')[0] || null,
    denouncedAt: raw.denouncedAt?.split('T')[0] || null,
    amountHt: raw.amountHt,
    vatRate: raw.vatRate,
    billingPeriod: raw.billingPeriod,
    tariffRevision: null,
    distributionMode: null,
    notes: raw.notes,
    budgetLineId: null,
    agencies: raw.allAgencies
      ? 'ALL'
      : (raw.agencies?.map((a: any) => a.agency?.code || a.agencyId) || []),
    agencyDetails,  // ← NOUVEAU
    supplier: raw.supplier
      ? { id: raw.supplier.id, name: raw.supplier.name }
      : undefined,
    leaser: raw.leaser
      ? { id: raw.leaser.id, name: raw.leaser.name }
      : null,
    leaserId: raw.leaserId || null,
    articles: Array.isArray(raw.articles)
      ? raw.articles.map((a: any) => ({
          id: a.id,
          designation: a.designation,
          quantity: a.quantity,
          agencyId: a.agencyId || null,
          agency: a.agency || null,
        }))
      : [],
  };
}


function mapContractToApi(data: any): any {
  const scopeMap: Record<string, string> = {
    ALL_AGENCIES: 'NATIONAL',
    MULTI_AGENCY: 'LOCAL',
    HEADQUARTERS: 'HEADQUARTERS',
  };

  return {
    reference: data.reference,
    title: data.title,
    category: data.category,
    supplierId: data.supplierId,
    startDate: data.startDate,
    endDate: data.endDate,
    tacitRenewal: data.autoRenewal ?? false,
    renewalDurationMonths: data.renewalDuration || null,
    noticePeriodMonths: data.noticePeriod || 3,
    amountHt: data.amountHt,
    billingPeriod: data.billingPeriod || 'ANNUAL',
    vatRate: data.vatRate || 20,
    scope: scopeMap[data.scope] || 'NATIONAL',
    allAgencies: data.agencies === 'ALL' || data.scope === 'ALL_AGENCIES',
    agencyIds: data.agencies !== 'ALL' && Array.isArray(data.agencies) ? data.agencies : [],
    notes: data.notes || null,
    leaserId: data.leaserId || null,
    articles: Array.isArray(data.articles) ? data.articles : [],
  };
}

function mapApiSupplier(raw: any): Supplier {
  return {
    id: raw.id,
    name: raw.name,
    contactName: raw.contactName || '',
    contactEmail: raw.email || '',
    contactPhone: raw.phone || '',
    address: '',
    siret: '',
    website: '',
    notes: raw.category || '',
    isActive: true,
  };
}

// ============================================================
// CONTEXT
// ============================================================

const ContractsContext = createContext<ContractsContextValue | null>(null);

export function ContractsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===== Fetch data =====
  const refreshContracts = useCallback(async () => {
    try {
      const data = await apiFetch<any[]>('/contracts');
      setContracts(data.map(mapApiContract));
    } catch (err: any) {
      console.error('Erreur chargement contrats:', err);
      setError(err.message);
    }
  }, []);

  const refreshSuppliers = useCallback(async () => {
    try {
      const data = await apiFetch<any[]>('/suppliers');
      setSuppliers(data.map(mapApiSupplier));
    } catch (err: any) {
      console.error('Erreur chargement fournisseurs:', err);
    }
  }, []);

  // Load on mount (when user is logged in)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([refreshContracts(), refreshSuppliers()])
      .finally(() => setLoading(false));
  }, [user, refreshContracts, refreshSuppliers]);

  // ===== Contracts CRUD =====
  const addContract = useCallback(async (contract: Omit<Contract, 'id'>): Promise<Contract> => {
    const apiData = mapContractToApi(contract);
    const created = await apiFetch<any>('/contracts', {
      method: 'POST',
      body: JSON.stringify(apiData),
    });
    const mapped = mapApiContract(created);
    setContracts((prev) => [...prev, mapped]);
    return mapped;
  }, []);

  const updateContract = useCallback(async (id: string, data: Partial<Contract>) => {
    // Merge with existing contract for full payload
    const existing = contracts.find((c) => c.id === id);
    if (!existing) throw new Error('Contrat non trouvé');
    const merged = { ...existing, ...data };
    const apiData = mapContractToApi(merged);
    const updated = await apiFetch<any>(`/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(apiData),
    });
    const mapped = mapApiContract(updated);
    setContracts((prev) => prev.map((c) => (c.id === id ? mapped : c)));
  }, [contracts]);

  const deleteContract = useCallback(async (id: string) => {
    await apiFetch(`/contracts/${id}`, { method: 'DELETE' });
    setContracts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const denounceContract = useCallback(async (id: string) => {
    const updated = await apiFetch<any>(`/contracts/${id}/denounce`, { method: 'PATCH' });
    const mapped = mapApiContract(updated);
    setContracts((prev) => prev.map((c) => (c.id === id ? mapped : c)));
  }, []);

  const getContractById = useCallback(
    (id: string) => contracts.find((c) => c.id === id),
    [contracts]
  );

  // ===== Suppliers CRUD =====
  const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
    const created = await apiFetch<any>('/suppliers', {
      method: 'POST',
      body: JSON.stringify({
        name: supplier.name,
        contactName: supplier.contactName,
        email: supplier.contactEmail,
        phone: supplier.contactPhone,
        category: supplier.notes,
      }),
    });
    const mapped = mapApiSupplier(created);
    setSuppliers((prev) => [...prev, mapped]);
    return mapped;
  }, []);

  const updateSupplier = useCallback(async (id: string, data: Partial<Supplier>) => {
    const updated = await apiFetch<any>(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name,
        contactName: data.contactName,
        email: data.contactEmail,
        phone: data.contactPhone,
        category: data.notes,
      }),
    });
    const mapped = mapApiSupplier(updated);
    setSuppliers((prev) => prev.map((s) => (s.id === id ? mapped : s)));
  }, []);

  const deleteSupplier = useCallback(async (id: string) => {
    await apiFetch(`/suppliers/${id}`, { method: 'DELETE' });
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getSupplierById = useCallback(
    (id: string) => suppliers.find((s) => s.id === id),
    [suppliers]
  );

  const getContractsBySupplier = useCallback(
    (supplierId: string) => contracts.filter((c) => c.supplierId === supplierId),
    [contracts]
  );

  return (
    <ContractsContext.Provider
      value={{
        contracts,
        suppliers,
        loading,
        error,
        refreshContracts,
        refreshSuppliers,
        addContract,
        updateContract,
        deleteContract,
        denounceContract,
        getContractById,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        getSupplierById,
        getContractsBySupplier,
      }}
    >
      {children}
    </ContractsContext.Provider>
  );
}

export function useContracts() {
  const ctx = useContext(ContractsContext);
  if (!ctx) {
    throw new Error('useContracts must be used within ContractsProvider');
  }
  return ctx;
}
