import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface Agency {
  id: string;
  code: string;
  name: string;
  city: string;
  address?: string | null;
  region?: string | null;
  managerName?: string | null;
  managerEmail?: string | null;
  phone?: string | null;
  isActive: boolean;
}

export function useAgencies() {
  const { user } = useAuth();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshAgencies = useCallback(async () => {
    try {
      const data = await apiFetch<any[]>('/agencies');
      setAgencies(
        data.map((raw) => ({
          id: raw.id,
          code: raw.code,
          name: raw.name,
          city: raw.city,
          address: raw.address,
          region: raw.region,
          managerName: raw.managerName,
          managerEmail: raw.managerEmail,
          phone: raw.phone,
          isActive: raw.isActive ?? true,
        }))
      );
    } catch (err) {
      console.error('Erreur chargement agences:', err);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    refreshAgencies().finally(() => setLoading(false));
  }, [user, refreshAgencies]);

  return { agencies, loading, refreshAgencies };
}

