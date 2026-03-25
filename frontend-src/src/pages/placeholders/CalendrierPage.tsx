import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContracts } from '@/contexts/ContractsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CalendarClock,
  Bell,
  BellOff,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Filter,
} from 'lucide-react';

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateLong(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getAnnualized(amount: number, period: string): number {
  if (period === 'MONTHLY') return amount * 12;
  if (period === 'QUARTERLY') return amount * 4;
  return amount;
}

function daysUntil(dateStr: string): number {
  return Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / 86400000
  );
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const URGENCY_CONFIG = {
  OVERDUE: {
    label: '⚠️ Dépassée',
    className: 'bg-red-100 text-red-700 border-red-200',
    barColor: 'bg-red-500',
    icon: XCircle,
    iconColor: 'text-red-500',
    priority: 0,
  },
  URGENT: {
    label: 'Urgent (< 30j)',
    className: 'bg-red-100 text-red-700 border-red-200',
    barColor: 'bg-red-500',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    priority: 1,
  },
  PLAN: {
    label: 'À planifier (< 90j)',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
    barColor: 'bg-orange-500',
    icon: Clock,
    iconColor: 'text-orange-500',
    priority: 2,
  },
  ANTICIPATE: {
    label: 'À anticiper (< 180j)',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    barColor: 'bg-yellow-400',
    icon: Bell,
    iconColor: 'text-yellow-600',
    priority: 3,
  },
  OK: {
    label: 'OK (> 180j)',
    className: 'bg-green-100 text-green-700 border-green-200',
    barColor: 'bg-green-500',
    icon: CheckCircle2,
    iconColor: 'text-green-500',
    priority: 4,
  },
  NONE: {
    label: 'Pas de deadline',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
    barColor: 'bg-gray-300',
    icon: BellOff,
    iconColor: 'text-gray-400',
    priority: 5,
  },
};

type UrgencyLevel = keyof typeof URGENCY_CONFIG;

function getUrgency(days: number | null): UrgencyLevel {
  if (days === null) return 'NONE';
  if (days < 0) return 'OVERDUE';
  if (days < 30) return 'URGENT';
  if (days < 90) return 'PLAN';
  if (days < 180) return 'ANTICIPATE';
  return 'OK';
}

const categoryColors: Record<string, string> = {
  'Copieurs': 'bg-blue-100 text-blue-700',
  'Matériels': 'bg-purple-100 text-purple-700',
  'Maintenance': 'bg-orange-100 text-orange-700',
  'Téléphonie': 'bg-green-100 text-green-700',
  'Réseau-Télécom': 'bg-indigo-100 text-indigo-700',
  'Licences-Logiciels': 'bg-pink-100 text-pink-700',
  'Hébergement-Cloud': 'bg-cyan-100 text-cyan-700',
  'Prestations': 'bg-yellow-100 text-yellow-700',
  'Sécurité': 'bg-red-100 text-red-700',
  'Autres': 'bg-gray-100 text-gray-700',
};

// ============================================================
// TYPES
// ============================================================

interface EnrichedContract {
  id: string;
  reference: string;
  title: string;
  category: string;
  status: string;
  supplierId: string;
  supplierName: string;
  startDate: string;
  endDate: string;
  noticeDeadline: string | null;
  noticePeriod: number;
  noticePeriodUnit: string;
  autoRenewal: boolean;
  amountHt: number;
  billingPeriod: string;
  annualized: number;
  daysUntilDeadline: number | null;
  daysUntilEnd: number;
  urgency: UrgencyLevel;
  deadlineMonth: string | null; // "2025-05"
  endMonth: string; // "2025-08"
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function CalendrierPage() {
  const navigate = useNavigate();
  const { contracts, suppliers } = useContracts();

  const now = new Date();
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [yearOffset, setYearOffset] = useState(0);
  const [filterUrgency, setFilterUrgency] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const currentYear = now.getFullYear() + yearOffset;

  // ===== Données enrichies =====
  const enriched: EnrichedContract[] = useMemo(() => {
    return contracts
      .filter((c) => c.status === 'ACTIVE' || c.status === 'RENEWING')
      .map((c) => {
        const supplier = suppliers.find((s) => s.id === c.supplierId);
        const deadlineDays = c.noticeDeadline
          ? daysUntil(c.noticeDeadline)
          : null;
        const endDays = daysUntil(c.endDate);
        const annualized = getAnnualized(c.amountHt, c.billingPeriod);

        const deadlineDate = c.noticeDeadline
          ? new Date(c.noticeDeadline)
          : null;
        const endDate = new Date(c.endDate);

        return {
          id: c.id,
          reference: c.reference,
          title: c.title,
          category: c.category,
          status: c.status,
          supplierId: c.supplierId,
          supplierName: supplier?.name || '—',
          startDate: c.startDate,
          endDate: c.endDate,
          noticeDeadline: c.noticeDeadline || null,
          noticePeriod: c.noticePeriod,
          noticePeriodUnit: c.noticePeriodUnit,
          autoRenewal: c.autoRenewal,
          amountHt: c.amountHt,
          billingPeriod: c.billingPeriod,
          annualized,
          daysUntilDeadline: deadlineDays,
          daysUntilEnd: endDays,
          urgency: getUrgency(deadlineDays),
          deadlineMonth: deadlineDate
            ? `${deadlineDate.getFullYear()}-${String(deadlineDate.getMonth() + 1).padStart(2, '0')}`
            : null,
          endMonth: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`,
        };
      })
      .sort((a, b) => {
        const pa = URGENCY_CONFIG[a.urgency].priority;
        const pb = URGENCY_CONFIG[b.urgency].priority;
        if (pa !== pb) return pa - pb;
        return (a.daysUntilDeadline ?? 9999) - (b.daysUntilDeadline ?? 9999);
      });
  }, [contracts, suppliers]);

  // ===== Filtrage =====
  const filtered = useMemo(() => {
    return enriched.filter((c) => {
      const matchUrgency =
        filterUrgency === 'ALL' || c.urgency === filterUrgency;
      const matchCategory =
        filterCategory === 'ALL' || c.category === filterCategory;
      return matchUrgency && matchCategory;
    });
  }, [enriched, filterUrgency, filterCategory]);

  // ===== Catégories dynamiques =====
  const categories = useMemo(() => {
    return Array.from(new Set(enriched.map((c) => c.category))).sort();
  }, [enriched]);

  // ===== KPIs =====
  const kpis = useMemo(() => {
    const overdue = enriched.filter((c) => c.urgency === 'OVERDUE').length;
    const urgent = enriched.filter((c) => c.urgency === 'URGENT').length;
    const plan = enriched.filter((c) => c.urgency === 'PLAN').length;
    const anticipate = enriched.filter(
      (c) => c.urgency === 'ANTICIPATE'
    ).length;
    const ok = enriched.filter((c) => c.urgency === 'OK').length;
    const totalAtRisk = overdue + urgent + plan;
    const amountAtRisk = enriched
      .filter(
        (c) =>
          c.urgency === 'OVERDUE' ||
          c.urgency === 'URGENT' ||
          c.urgency === 'PLAN'
      )
      .reduce((sum, c) => sum + c.annualized, 0);
    return { overdue, urgent, plan, anticipate, ok, totalAtRisk, amountAtRisk };
  }, [enriched]);

  // ===== Timeline : mois de l'année courante =====
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    return `${currentYear}-${m}`;
  });

  const contractsByMonth = useMemo(() => {
    const map: Record<string, EnrichedContract[]> = {};
    months.forEach((m) => {
      map[m] = filtered.filter(
        (c) => c.deadlineMonth === m || c.endMonth === m
      );
    });
    return map;
  }, [filtered, months]);

  // ========== RENDU ==========
  return (
    <div className="space-y-6">
      {/* ===== EN-TÊTE ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Calendrier des échéances
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Suivi des dates de dénonciation et fins de contrats
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('timeline')}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
              viewMode === 'timeline'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Liste
          </button>
        </div>
      </div>

      {/* ===== KPIs URGENCE ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {([
          { key: 'OVERDUE', count: kpis.overdue },
          { key: 'URGENT', count: kpis.urgent },
          { key: 'PLAN', count: kpis.plan },
          { key: 'ANTICIPATE', count: kpis.anticipate },
          { key: 'OK', count: kpis.ok },
        ] as { key: UrgencyLevel; count: number }[]).map(({ key, count }) => {
          const cfg = URGENCY_CONFIG[key];
          const Icon = cfg.icon;
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${
                filterUrgency === key
                  ? 'ring-2 ring-blue-500 shadow-md'
                  : 'hover:shadow-md'
              }`}
              onClick={() =>
                setFilterUrgency(filterUrgency === key ? 'ALL' : key)
              }
            >
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
                  <span className="text-2xl font-bold text-slate-800">
                    {count}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                  {cfg.label}
                </p>
              </CardContent>
            </Card>
          );
        })}

        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-100">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-lg font-bold text-red-700">
                {formatCurrency(kpis.amountAtRisk)}
              </span>
            </div>
            <p className="text-[11px] text-red-500 mt-1">
              Engagement à risque (≤ 90j)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ===== FILTRES ===== */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <Select
          value={filterCategory}
          onValueChange={setFilterCategory}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Toutes catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes catégories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterUrgency !== 'ALL' || filterCategory !== 'ALL') && (
          <button
            onClick={() => {
              setFilterUrgency('ALL');
              setFilterCategory('ALL');
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            Réinitialiser les filtres
          </button>
        )}
        <span className="text-xs text-slate-400 ml-auto">
          {filtered.length} contrat{filtered.length > 1 ? 's' : ''} affiché
          {filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* ===== VUE TIMELINE ===== */}
      {viewMode === 'timeline' && (
        <div>
          {/* Navigation année */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setYearOffset((y) => y - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-bold text-slate-800 w-20 text-center">
              {currentYear}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setYearOffset((y) => y + 1)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Grille mois */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {months.map((monthKey, idx) => {
              const monthContracts = contractsByMonth[monthKey] || [];
              const isCurrentMonth =
                now.getFullYear() === currentYear &&
                now.getMonth() === idx;

              return (
                <Card
                  key={monthKey}
                  className={`transition-all ${
                    isCurrentMonth
                      ? 'ring-2 ring-blue-400 shadow-md'
                      : ''
                  }`}
                >
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span
                        className={
                          isCurrentMonth
                            ? 'text-blue-600'
                            : 'text-slate-700'
                        }
                      >
                        {MONTH_NAMES[idx]}
                      </span>
                      {monthContracts.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {monthContracts.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {monthContracts.length === 0 ? (
                      <p className="text-xs text-slate-300 text-center py-3">
                        Aucune échéance
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {monthContracts.map((c) => {
                          const cfg = URGENCY_CONFIG[c.urgency];
                          const isDeadlineThisMonth =
                            c.deadlineMonth === monthKey;
                          const isEndThisMonth = c.endMonth === monthKey;

                          return (
                            <div
                              key={`${c.id}-${monthKey}`}
                              className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                              onClick={() =>
                                navigate(`/contrats/${c.id}`)
                              }
                            >
                              <div
                                className={`w-1 self-stretch rounded-full shrink-0 ${cfg.barColor}`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                  {c.title}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {c.supplierName}
                                </p>
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                  {isDeadlineThisMonth && (
                                    <Badge
                                      className={`text-[9px] px-1 py-0 border ${cfg.className}`}
                                    >
                                      Dénonciation{' '}
                                      {c.noticeDeadline
                                        ? formatDate(c.noticeDeadline)
                                        : ''}
                                    </Badge>
                                  )}
                                  {isEndThisMonth && (
                                    <Badge className="text-[9px] px-1 py-0 bg-slate-100 text-slate-600 border border-slate-200">
                                      Fin {formatDate(c.endDate)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] font-semibold text-blue-600 shrink-0">
                                {formatCurrency(c.annualized)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== VUE LISTE ===== */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Urgence
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Contrat
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">
                      Catégorie
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">
                      Fournisseur
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Limite dénonciation
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">
                      Fin contrat
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">
                      Reconduction
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">
                      Montant /an
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-12 text-center text-slate-400"
                      >
                        <CalendarClock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        Aucun contrat ne correspond aux filtres
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => {
                      const cfg = URGENCY_CONFIG[c.urgency];
                      const Icon = cfg.icon;
                      const catColor =
                        categoryColors[c.category] ||
                        'bg-gray-100 text-gray-700';

                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-50/70 cursor-pointer group transition-colors"
                          onClick={() => navigate(`/contrats/${c.id}`)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Icon
                                className={`h-4 w-4 ${cfg.iconColor}`}
                              />
                              <Badge
                                className={`text-[10px] border ${cfg.className}`}
                              >
                                {c.daysUntilDeadline !== null
                                  ? c.daysUntilDeadline < 0
                                    ? `${Math.abs(c.daysUntilDeadline)}j retard`
                                    : `${c.daysUntilDeadline}j`
                                  : '—'}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors truncate max-w-[250px]">
                              {c.title}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {c.reference}
                            </p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <Badge
                              className={`text-[10px] ${catColor}`}
                            >
                              {c.category}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell text-sm text-slate-600">
                            {c.supplierName}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-slate-700">
                              {c.noticeDeadline
                                ? formatDate(c.noticeDeadline)
                                : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-sm text-slate-600">
                            {formatDate(c.endDate)}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <Badge
                              variant="outline"
                              className="text-[10px]"
                            >
                              {c.autoRenewal
                                ? 'Tacite reconduction'
                                : 'Non reconduit'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right hidden sm:table-cell">
                            <span className="text-sm font-semibold text-blue-600">
                              {formatCurrency(c.annualized)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
