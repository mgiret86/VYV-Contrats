import { useMemo, useState } from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import { useContracts } from '@/contexts/ContractsContext';
import { useAgencies, Agency } from '@/hooks/useAgencies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Building2,
  Euro,
  BarChart3,
  ChevronRight,
  MapPin,
  FileText,
  Loader2,
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface AgencyBudget {
  agencyId: string;
  agencyCode: string;
  agencyName: string;
  agencyCity: string;
  contractCount: number;
  totalBudget: number;
  totalActual: number;
  remaining: number;
  pct: number;
  contracts: {
    id: string;
    reference: string;
    title: string;
    category: string;
    supplierName: string;
    annualized: number;
    percentage: number;
    share: number;
  }[];
}

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

function getAnnualized(amount: number, period: string): number {
  if (period === 'MONTHLY') return amount * 12;
  if (period === 'QUARTERLY') return amount * 4;
  return amount;
}

function consumptionColor(pct: number): string {
  if (pct > 100) return 'text-red-600';
  if (pct > 90) return 'text-orange-600';
  if (pct > 75) return 'text-yellow-600';
  return 'text-green-600';
}

function consumptionBarColor(pct: number): string {
  if (pct > 100) return 'bg-red-500';
  if (pct > 90) return 'bg-orange-500';
  if (pct > 75) return 'bg-yellow-500';
  return 'bg-green-500';
}

const DONUT_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
  '#a855f7', '#64748b', '#d946ef', '#0ea5e9', '#84cc16',
  '#e11d48', '#7c3aed', '#059669', '#dc2626', '#2563eb',
  '#ca8a04', '#9333ea', '#0891b2', '#c2410c', '#4f46e5',
];

// ============================================================
// COMPOSANT
// ============================================================

export default function BudgetAgencesPage() {
  const { contracts, suppliers } = useContracts();
  const { budgetLines, availableYears } = useBudget();
  const { agencies, loading: agenciesLoading } = useAgencies();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(
    availableYears.includes(currentYear) ? currentYear : availableYears[0]
  );
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'budget' | 'name' | 'contracts'>('budget');
  const [detailAgencyId, setDetailAgencyId] = useState<string | null>(null);

  // ===== Calcul ventilation par agence (DONNÉES RÉELLES) =====
  const agencyBudgets: AgencyBudget[] = useMemo(() => {
    if (agencies.length === 0) return [];

    const yearStart = new Date(`${selectedYear}-01-01`);
    const yearEnd = new Date(`${selectedYear}-12-31`);

    // Contrats qui chevauchent l'année sélectionnée
    const yearContracts = contracts.filter((c) => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      return start <= yearEnd && end >= yearStart;
    });

    // Lignes budget de l'année
    const yearBudgetLines = budgetLines.filter((l) => l.year === selectedYear);

    return agencies.map((agency) => {
      const contractDetails: AgencyBudget['contracts'] = [];

      yearContracts.forEach((c) => {
        const annualized = getAnnualized(c.amountHt, c.billingPeriod);

        // Prorata temporel sur l'année
        const contractStart = new Date(c.startDate);
        const contractEnd = new Date(c.endDate);
        const overlapStart = contractStart > yearStart ? contractStart : yearStart;
        const overlapEnd = contractEnd < yearEnd ? contractEnd : yearEnd;
        const overlapDays = Math.max(
          0,
          (overlapEnd.getTime() - overlapStart.getTime()) / 86400000 + 1
        );
        const yearDays =
          (yearEnd.getTime() - yearStart.getTime()) / 86400000 + 1;
        const yearProrata = overlapDays / yearDays;

        // ── Déterminer le pourcentage de cette agence ──
        let agencyPercentage = 0;

        if (c.agencies === 'ALL') {
          // Contrat national : vérifier si un percentage est défini
          // dans agencyDetails, sinon répartition équitable
          const detail = c.agencyDetails.find(
            (ad) => ad.agencyId === agency.id
          );
          if (detail && detail.percentage > 0) {
            agencyPercentage = detail.percentage;
          } else {
            // Répartition équitable entre toutes les agences actives
            agencyPercentage = 100 / agencies.filter((a) => a.isActive).length;
          }
        } else if (Array.isArray(c.agencies)) {
          // Contrat multi-agences ou local : chercher dans agencyDetails
          const detail = c.agencyDetails.find(
            (ad) => ad.agencyId === agency.id
          );
          if (detail) {
            if (detail.percentage > 0) {
              agencyPercentage = detail.percentage;
            } else {
              // percentage = 0 → répartition équitable entre agences liées
              agencyPercentage = 100 / c.agencyDetails.length;
            }
          }
          // Si l'agence n'est pas dans agencyDetails → agencyPercentage reste 0
        }
        // scope HEADQUARTERS → seul le siège est concerné, géré par agencyDetails

        if (agencyPercentage <= 0) return; // Cette agence n'est pas concernée

        const share = annualized * yearProrata * (agencyPercentage / 100);
        const supplier = suppliers.find((s) => s.id === c.supplierId);

        contractDetails.push({
          id: c.id,
          reference: c.reference,
          title: c.title,
          category: c.category,
          supplierName: supplier?.name || '—',
          annualized,
          percentage: agencyPercentage,
          share,
        });
      });

      const totalBudget = contractDetails.reduce((s, cd) => s + cd.share, 0);

      // ── Réalisé depuis les lignes budgétaires ──
      let totalActual = 0;

      contractDetails.forEach((cd) => {
        const linkedBL = yearBudgetLines.find((bl) =>
          bl.linkedContractIds.includes(cd.id)
        );
        if (linkedBL) {
          // Utiliser le percentage réel de BudgetLineAgency si disponible
          const blAgency = linkedBL.agencyDetails.find(
            (ba) => ba.agencyId === agency.id
          );
          if (blAgency && blAgency.percentage > 0) {
            totalActual += linkedBL.actualHt * (blAgency.percentage / 100);
          } else if (linkedBL.agencyDetails.length > 0) {
            // L'agence n'est pas dans la ventilation budget → 0
          } else {
            // Pas de ventilation budget → utiliser le % du contrat
            totalActual += linkedBL.actualHt * (cd.percentage / 100);
          }
        }
      });

      // Estimation pour les contrats sans ligne budget liée
      const contractsWithoutBL = contractDetails.filter(
        (cd) =>
          !yearBudgetLines.some((bl) =>
            bl.linkedContractIds.includes(cd.id)
          )
      );

      if (contractsWithoutBL.length > 0) {
        const now = new Date();
        const monthProgress =
          selectedYear < now.getFullYear()
            ? 1
            : selectedYear > now.getFullYear()
              ? 0
              : now.getMonth() / 12;
        const unlinkedBudget = contractsWithoutBL.reduce(
          (s, c) => s + c.share,
          0
        );
        totalActual += unlinkedBudget * monthProgress;
      }

      totalActual = Math.round(totalActual);
      const totalBudgetRounded = Math.round(totalBudget);

      return {
        agencyId: agency.id,
        agencyCode: agency.code,
        agencyName: agency.name,
        agencyCity: agency.city,
        contractCount: contractDetails.length,
        totalBudget: totalBudgetRounded,
        totalActual,
        remaining: totalBudgetRounded - totalActual,
        pct: totalBudgetRounded > 0 ? (totalActual / totalBudgetRounded) * 100 : 0,
        contracts: contractDetails,
      };
    });
  }, [contracts, suppliers, budgetLines, agencies, selectedYear]);

  // ===== Filtrage et tri =====
  const filtered = useMemo(() => {
    let result = agencyBudgets.filter(
      (a) =>
        a.agencyName.toLowerCase().includes(search.toLowerCase()) ||
        a.agencyCity.toLowerCase().includes(search.toLowerCase()) ||
        a.agencyCode.toLowerCase().includes(search.toLowerCase())
    );

    if (sortBy === 'budget') {
      result = result.sort((a, b) => b.totalBudget - a.totalBudget);
    } else if (sortBy === 'name') {
      result = result.sort((a, b) => a.agencyName.localeCompare(b.agencyName));
    } else {
      result = result.sort((a, b) => b.contractCount - a.contractCount);
    }

    return result;
  }, [agencyBudgets, search, sortBy]);

  // ===== Totaux =====
  const totals = useMemo(() => {
    const budget = agencyBudgets.reduce((s, a) => s + a.totalBudget, 0);
    const actual = agencyBudgets.reduce((s, a) => s + a.totalActual, 0);
    return {
      budget,
      actual,
      remaining: budget - actual,
      pct: budget > 0 ? (actual / budget) * 100 : 0,
    };
  }, [agencyBudgets]);

  // ===== Top 5 =====
  const top5 = useMemo(() => {
    return [...agencyBudgets]
      .sort((a, b) => b.totalBudget - a.totalBudget)
      .slice(0, 5);
  }, [agencyBudgets]);

  const maxBudget = top5.length > 0 ? top5[0].totalBudget : 1;

  // ===== Détail =====
  const detailAgency = detailAgencyId
    ? agencyBudgets.find((a) => a.agencyId === detailAgencyId)
    : null;

  // ===== Loading =====
  if (agenciesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-slate-500">Chargement des agences…</span>
      </div>
    );
  }

  if (agencies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Building2 className="h-12 w-12 mb-3" />
        <p className="text-lg font-medium">Aucune agence configurée</p>
        <p className="text-sm mt-1">
          Ajoutez des agences dans le module Agences pour activer la ventilation budgétaire.
        </p>
      </div>
    );
  }

  // ========== RENDU ==========
  return (
    <div className="space-y-6">
      {/* ===== EN-TÊTE ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Budget par agence
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Ventilation du budget IT sur {agencies.length} agence
            {agencies.length > 1 ? 's' : ''} — {selectedYear}
          </p>
        </div>
        <Select
          value={String(selectedYear)}
          onValueChange={(v) => setSelectedYear(Number(v))}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ===== KPIs ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Budget total ventilé
                </p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {formatCurrency(totals.budget)}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Euro className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Consommation globale
                </p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {totals.pct.toFixed(0)}%
                </p>
                <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-2">
                  <div
                    className={`h-1.5 rounded-full ${consumptionBarColor(totals.pct)}`}
                    style={{ width: `${Math.min(100, totals.pct)}%` }}
                  />
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Budget moyen / agence
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {formatCurrency(
                    agencies.length > 0
                      ? Math.round(totals.budget / agencies.length)
                      : 0
                  )}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Agences couvertes
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {agencyBudgets.filter((a) => a.contractCount > 0).length}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  sur {agencies.length}
                </p>
              </div>
              <div className="p-3 bg-cyan-50 rounded-xl">
                <MapPin className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== TOP 5 + DONUT ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Top 5 */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">
                Top 5 — Agences par budget ({selectedYear})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {top5.map((agency, index) => {
                  const barWidth =
                    maxBudget > 0 ? (agency.totalBudget / maxBudget) * 100 : 0;
                  return (
                    <div
                      key={agency.agencyId}
                      className="cursor-pointer hover:bg-slate-50 rounded-xl p-3 -mx-3 transition-colors"
                      onClick={() => setDetailAgencyId(agency.agencyId)}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-slate-500">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {agency.agencyName}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {agency.agencyCity} · {agency.agencyCode} · {agency.contractCount} contrat
                              {agency.contractCount > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-600">
                            {formatCurrency(agency.totalBudget)}
                          </p>
                          <p
                            className={`text-[10px] font-medium ${consumptionColor(agency.pct)}`}
                          >
                            {agency.pct.toFixed(0)}% consommé
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-400 transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {top5.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">
                    Aucune donnée pour {selectedYear}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Donut */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">
                Répartition {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 200 200" className="w-48 h-48">
                  {(() => {
                    const sorted = [...agencyBudgets].sort(
                      (a, b) => b.totalBudget - a.totalBudget
                    );
                    const topN = sorted.slice(0, 8);
                    const othersTotal = sorted
                      .slice(8)
                      .reduce((s, a) => s + a.totalBudget, 0);
                    const segments = [
                      ...topN.map((a) => ({
                        label: a.agencyCity,
                        value: a.totalBudget,
                      })),
                    ];
                    if (othersTotal > 0) {
                      segments.push({ label: 'Autres', value: othersTotal });
                    }
                    const total = segments.reduce((s, seg) => s + seg.value, 0);

                    if (total === 0) {
                      return (
                        <text
                          x="100"
                          y="105"
                          textAnchor="middle"
                          className="text-xs fill-gray-400"
                        >
                          Aucune donnée
                        </text>
                      );
                    }

                    let cumulative = 0;
                    return segments.map((seg, i) => {
                      const pct = seg.value / total;
                      if (pct === 0) return null;
                      const startAngle = cumulative * 360;
                      const endAngle = (cumulative + pct) * 360;
                      cumulative += pct;

                      const startRad = ((startAngle - 90) * Math.PI) / 180;
                      const endRad = ((endAngle - 90) * Math.PI) / 180;
                      const largeArc = pct > 0.5 ? 1 : 0;

                      const outerR = 90;
                      const innerR = 58;
                      const cx = 100;
                      const cy = 100;

                      const x1 = cx + outerR * Math.cos(startRad);
                      const y1 = cy + outerR * Math.sin(startRad);
                      const x2 = cx + outerR * Math.cos(endRad);
                      const y2 = cy + outerR * Math.sin(endRad);
                      const x3 = cx + innerR * Math.cos(endRad);
                      const y3 = cy + innerR * Math.sin(endRad);
                      const x4 = cx + innerR * Math.cos(startRad);
                      const y4 = cy + innerR * Math.sin(startRad);

                      const path = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;

                      return (
                        <path
                          key={seg.label}
                          d={path}
                          fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                          stroke="white"
                          strokeWidth="1.5"
                        >
                          <title>
                            {seg.label}: {formatCurrency(seg.value)} (
                            {(pct * 100).toFixed(1)}%)
                          </title>
                        </path>
                      );
                    });
                  })()}
                  <text
                    x="100"
                    y="94"
                    textAnchor="middle"
                    className="text-[10px] fill-gray-400"
                  >
                    {agencies.length} agence{agencies.length > 1 ? 's' : ''}
                  </text>
                  <text
                    x="100"
                    y="112"
                    textAnchor="middle"
                    className="text-sm font-bold fill-gray-800"
                  >
                    {formatCurrency(totals.budget)}
                  </text>
                </svg>

                <div className="w-full mt-3 space-y-1">
                  {(() => {
                    const sorted = [...agencyBudgets].sort(
                      (a, b) => b.totalBudget - a.totalBudget
                    );
                    const topN = sorted.slice(0, 8);
                    const othersTotal = sorted
                      .slice(8)
                      .reduce((s, a) => s + a.totalBudget, 0);
                    const items = [
                      ...topN.map((a) => ({
                        label: a.agencyCity,
                        value: a.totalBudget,
                      })),
                    ];
                    if (othersTotal > 0)
                      items.push({
                        label: `Autres (${sorted.length - 8})`,
                        value: othersTotal,
                      });

                    return items.map((item, i) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-sm shrink-0"
                            style={{
                              backgroundColor:
                                DONUT_COLORS[i % DONUT_COLORS.length],
                            }}
                          />
                          <span className="text-slate-600">{item.label}</span>
                        </div>
                        <span className="text-slate-500 font-medium">
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== FILTRES ===== */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher une agence (nom, ville, code)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as typeof sortBy)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="budget">Budget décroissant</SelectItem>
            <SelectItem value="name">Nom A→Z</SelectItem>
            <SelectItem value="contracts">Nb contrats</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ===== TABLEAU ===== */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agence</TableHead>
                  <TableHead className="hidden md:table-cell">Ville</TableHead>
                  <TableHead className="text-center">Contrats</TableHead>
                  <TableHead className="text-right">Budget ventilé</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
                    Réalisé
                  </TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
                    Reste
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Consommation
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-12 text-slate-400"
                    >
                      Aucune agence trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((agency) => (
                    <TableRow
                      key={agency.agencyId}
                      className="cursor-pointer hover:bg-slate-50/70 group"
                      onClick={() => setDetailAgencyId(agency.agencyId)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                            {agency.agencyName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {agency.agencyCode}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-slate-500">
                        {agency.agencyCity}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {agency.contractCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">
                        {formatCurrency(agency.totalBudget)}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell text-sm text-slate-600">
                        {formatCurrency(agency.totalActual)}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        <span
                          className={`text-sm font-medium ${
                            agency.remaining >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {agency.remaining < 0 ? '-' : ''}
                          {formatCurrency(Math.abs(agency.remaining))}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${consumptionBarColor(agency.pct)}`}
                              style={{
                                width: `${Math.min(100, agency.pct)}%`,
                              }}
                            />
                          </div>
                          <span
                            className={`text-xs font-medium w-10 text-right ${consumptionColor(agency.pct)}`}
                          >
                            {agency.pct.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {filtered.length > 0 && (
                <TableFooter>
                  <TableRow className="font-bold">
                    <TableCell colSpan={3}>
                      Total ({filtered.length} agence
                      {filtered.length > 1 ? 's' : ''})
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(
                        filtered.reduce((s, a) => s + a.totalBudget, 0)
                      )}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {formatCurrency(
                        filtered.reduce((s, a) => s + a.totalActual, 0)
                      )}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {formatCurrency(
                        filtered.reduce((s, a) => s + a.remaining, 0)
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell" />
                    <TableCell />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===== DIALOG DÉTAIL AGENCE ===== */}
      <Dialog
        open={!!detailAgencyId}
        onOpenChange={() => setDetailAgencyId(null)}
      >
        <DialogContent className="max-w-2xl">
          {detailAgency && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  {detailAgency.agencyName}
                  <Badge variant="secondary" className="text-xs">
                    {detailAgency.agencyCity}
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">
                    {detailAgency.agencyCode}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-2">
                {/* KPIs agence */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(detailAgency.totalBudget)}
                    </p>
                    <p className="text-xs text-blue-500">Budget ventilé</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(detailAgency.totalActual)}
                    </p>
                    <p className="text-xs text-green-500">Réalisé</p>
                  </div>
                  <div
                    className={`rounded-xl p-3 text-center ${
                      detailAgency.remaining >= 0
                        ? 'bg-emerald-50'
                        : 'bg-red-50'
                    }`}
                  >
                    <p
                      className={`text-xl font-bold ${
                        detailAgency.remaining >= 0
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(Math.abs(detailAgency.remaining))}
                    </p>
                    <p
                      className={`text-xs ${
                        detailAgency.remaining >= 0
                          ? 'text-emerald-500'
                          : 'text-red-500'
                      }`}
                    >
                      {detailAgency.remaining >= 0 ? 'Reste' : 'Dépassement'}
                    </p>
                  </div>
                </div>

                {/* Barre consommation */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600">Consommation</span>
                    <span
                      className={`text-sm font-medium ${consumptionColor(detailAgency.pct)}`}
                    >
                      {detailAgency.pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${consumptionBarColor(detailAgency.pct)}`}
                      style={{
                        width: `${Math.min(100, detailAgency.pct)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Liste des contrats */}
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    {detailAgency.contractCount} contrat
                    {detailAgency.contractCount > 1 ? 's' : ''} ventilé
                    {detailAgency.contractCount > 1 ? 's' : ''} ({selectedYear})
                  </p>
                  {detailAgency.contracts.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      Aucun contrat affecté
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {detailAgency.contracts
                        .sort((a, b) => b.share - a.share)
                        .map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">
                                {c.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {c.reference}
                                </span>
                                <span className="text-[10px] text-slate-300">·</span>
                                <span className="text-[10px] text-slate-400">
                                  {c.supplierName}
                                </span>
                                <span className="text-[10px] text-slate-300">·</span>
                                <span className="text-[10px] text-blue-500 font-medium">
                                  {c.percentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold text-blue-600">
                                {formatCurrency(Math.round(c.share))}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                sur {formatCurrency(c.annualized)} total
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
