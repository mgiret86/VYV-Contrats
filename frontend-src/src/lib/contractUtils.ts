import { Contract, ContractStatus, ContractScope, BillingPeriod } from '@/types/contract';

export const STATUS_CONFIG: Record<ContractStatus, { label: string; className: string; dot: string; badgeBg: string }> = {
  ACTIVE: {
    label: 'Actif',
    className: 'text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50',
  },
  DENOUNCED: {
    label: 'Dénoncé',
    className: 'text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    badgeBg: 'bg-orange-50',
  },
  EXPIRED: {
    label: 'Expiré',
    className: 'text-red-700 border-red-200',
    dot: 'bg-red-500',
    badgeBg: 'bg-red-50',
  },
  NEGOTIATING: {
    label: 'En négociation',
    className: 'text-violet-700 border-violet-200',
    dot: 'bg-violet-500',
    badgeBg: 'bg-violet-50',
  },
  TO_TRANSFER: {
    label: 'À transférer',
    className: 'text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    badgeBg: 'bg-purple-50',
  },
  TRANSFERRING: {
    label: 'En cours de transfert',
    className: 'text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    badgeBg: 'bg-amber-50',
  },
};

export const SCOPE_CONFIG: Record<ContractScope, { label: string; icon: string }> = {
  ALL_AGENCIES: { label: 'Toutes agences', icon: '🌐' },
  HEADQUARTERS: { label: 'Siège', icon: '🏢' },
  MULTI_AGENCY: { label: 'Multi-agences', icon: '🔗' },
};

export const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  MONTHLY: 'Mensuelle',
  QUARTERLY: 'Trimestrielle',
  ANNUAL: 'Annuelle',
};

export const CATEGORIES = [
  'Copieurs',
  'Maintenance',
  'Réseau-Télécom',
  'Licences-Logiciels',
  'Téléphonie',
  'Sécurité',
  'Hébergement-Cloud',
  'Prestations',
  'Matériels',
];

export const CATEGORY_COLORS: Record<string, string> = {
  'Copieurs': 'bg-sky-100 text-sky-700',
  'Maintenance': 'bg-orange-100 text-orange-700',
  'Réseau-Télécom': 'bg-blue-100 text-blue-700',
  'Licences-Logiciels': 'bg-violet-100 text-violet-700',
  'Téléphonie': 'bg-pink-100 text-pink-700',
  'Sécurité': 'bg-red-100 text-red-700',
  'Hébergement-Cloud': 'bg-cyan-100 text-cyan-700',
  'Prestations': 'bg-amber-100 text-amber-700',
  'Matériels': 'bg-slate-100 text-slate-700',
};

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getUrgencyLevel(contract: Contract): 'critical' | 'warning' | 'normal' | null {
  if (contract.status !== 'ACTIVE') return null;
  if (!contract.noticeDeadline) return null;
  const days = getDaysUntil(contract.noticeDeadline);
  if (days <= 30) return 'critical';
  if (days <= 90) return 'warning';
  return 'normal';
}

export function computeTotalHt(contracts: Contract[]): number {
  return contracts
    .filter((c) => c.status === 'ACTIVE' || c.status === 'NEGOTIATING')
    .reduce((sum, c) => sum + c.amountHt, 0);
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}
