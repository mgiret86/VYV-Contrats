import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBudget, BUDGET_TYPE_CONFIG } from '@/contexts/BudgetContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Euro,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  ChevronRight,
  PieChart,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
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

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
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
  '#a855f7', '#64748b',
];

// ============================================================
// COMPOSANT
// ============================================================

export default function BudgetSynthesePage() {
  const navigate = useNavigate();
  const { budgetLines, availableYears } = useBudget();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(
    availableYears.includes(currentYear) ? currentYear : availableYears[0]
  );

  const previousYear = selectedYear - 1;

  // ===== Données année sélectionnée =====
  const yearLines = useMemo(
    () => budgetLines.filter((l) => l.year === selectedYear),
    [budgetLines, selectedYear]
  );

  const prevYearLines = useMemo(
    () => budgetLines.filter((l) => l.year === previousYear),
    [budgetLines, previousYear]
  );

  // ===== KPIs globaux =====
  const kpis = useMemo(() => {
    const budget = yearLines.reduce((s, l) => s + l.budgetHt, 0);
    const actual = yearLines.reduce((s, l) => s + l.actualHt, 0);
    const remaining = budget - actual;
    const pct = budget > 0 ? (actual / budget) * 100 : 0;

    const prevBudget = prevYearLines.reduce((s, l) => s + l.budgetHt, 0);
    const prevActual = prevYearLines.reduce((s, l) => s + l.actualHt, 0);

    const budgetEvolution = pctChange(budget, prevBudget);
    const actualEvolution = pctChange(actual, prevActual);

    const overBudgetLines = yearLines.filter(
      (l) => l.actualHt > l.budgetHt && l.budgetHt > 0
    );
    const underConsumed = yearLines.filter(
      (l) => l.budgetHt > 0 && l.actualHt / l.budgetHt < 0.25 && l.actualHt > 0
    );

    return {
      budget,
      actual,
      remaining,
      pct,
      prevBudget,
      prevActual,
      budgetEvolution,
      actualEvolution,
      lineCount: yearLines.length,
      overBudgetCount: overBudgetLines.length,
      overBudgetAmount: overBudgetLines.reduce(
        (s, l) => s + (l.actualHt - l.budgetHt),
        0
      ),
      underConsumedCount: underConsumed.length,
    };
  }, [yearLines, prevYearLines]);

  // ===== Par catégorie =====
  const byCategory = useMemo(() => {
    const map: Record<string, { budget: number; actual: number; count: number }> = {};
    yearLines.forEach((l) => {
      if (!map[l.category]) map[l.category] = { budget: 0, actual: 0, count: 0 };
      map[l.category].budget += l.budgetHt;
      map[l.category].actual += l.actualHt;
      map[l.category].count += 1;
    });
    return Object.entries(map)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.budget - a.budget);
  }, [yearLines]);

  const totalBudgetCat = byCategory.reduce((s, c) => s + c.budget, 0);

  // ===== Par type =====
  const byType = useMemo(() => {
    const map: Record<string, { budget: number; actual: number; count: number }> = {};
    yearLines.forEach((l) => {
      if (!map[l.type]) map[l.type] = { budget: 0, actual: 0, count: 0 };
      map[l.type].budget += l.budgetHt;
      map[l.type].actual += l.actualHt;
      map[l.type].count += 1;
    });
    return Object.entries(map)
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.budget - a.budget);
  }, [yearLines]);

  // ===== Comparatif N / N-1 par catégorie =====
  const comparison = useMemo(() => {
    const currentMap: Record<string, number> = {};
    const prevMap: Record<string, number> = {};

    yearLines.forEach((l) => {
      currentMap[l.category] = (currentMap[l.category] || 0) + l.budgetHt;
    });
    prevYearLines.forEach((l) => {
      prevMap[l.category] = (prevMap[l.category] || 0) + l.budgetHt;
    });

    const allCats = Array.from(
      new Set([...Object.keys(currentMap), ...Object.keys(prevMap)])
    ).sort();

    return allCats.map((cat) => {
      const current = currentMap[cat] || 0;
      const previous = prevMap[cat] || 0;
      const diff = current - previous;
      const evolution = pctChange(current, previous);
      return { category: cat, current, previous, diff, evolution };
    });
  }, [yearLines, prevYearLines]);

  // ===== Top dépassements =====
  const overBudgetLines = useMemo(() => {
    return yearLines
      .filter((l) => l.actualHt > l.budgetHt && l.budgetHt > 0)
      .map((l) => ({
        ...l,
        overAmount: l.actualHt - l.budgetHt,
        overPct: ((l.actualHt - l.budgetHt) / l.budgetHt) * 100,
      }))
      .sort((a, b) => b.overAmount - a.overAmount);
  }, [yearLines]);

  // ========== RENDU ==========
  return (
    <div className="space-y-6">
      {/* ===== EN-TÊTE ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Synthèse budgétaire
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Vue consolidée du budget DSI — {selectedYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button
            variant="outline"
            onClick={() => navigate('/budget/lignes')}
          >
            Voir les lignes
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* ===== KPIs PRINCIPAUX ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Budget prévisionnel
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {formatCurrency(kpis.budget)}
                </p>
                {kpis.budgetEvolution !== null && (
                  <div className="flex items-center gap-1 mt-1">
                    {kpis.budgetEvolution > 0 ? (
                      <TrendingUp className="h-3 w-3 text-red-500" />
                    ) : kpis.budgetEvolution < 0 ? (
                      <TrendingDown className="h-3 w-3 text-green-500" />
                    ) : (
                      <Minus className="h-3 w-3 text-slate-400" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        kpis.budgetEvolution > 0
                          ? 'text-red-500'
                          : kpis.budgetEvolution < 0
                            ? 'text-green-500'
                            : 'text-slate-400'
                      }`}
                    >
                      {kpis.budgetEvolution > 0 ? '+' : ''}
                      {kpis.budgetEvolution.toFixed(1)}% vs {previousYear}
                    </span>
                  </div>
                )}
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
                <p className="text-sm text-slate-500 font-medium">Réalisé</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {formatCurrency(kpis.actual)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-20">
                    <div
                      className={`h-1.5 rounded-full transition-all ${consumptionBarColor(kpis.pct)}`}
                      style={{
                        width: `${Math.min(100, kpis.pct)}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${consumptionColor(kpis.pct)}`}
                  >
                    {kpis.pct.toFixed(0)}%
                  </span>
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
                  {kpis.remaining >= 0 ? 'Reste à consommer' : 'Dépassement'}
                </p>
                <p
                  className={`text-3xl font-bold mt-1 ${
                    kpis.remaining >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(Math.abs(kpis.remaining))}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {kpis.lineCount} lignes budgétaires
                </p>
              </div>
              <div
                className={`p-3 rounded-xl ${
                  kpis.remaining >= 0 ? 'bg-emerald-50' : 'bg-red-50'
                }`}
              >
                {kpis.remaining >= 0 ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Lignes en dépassement
                </p>
                <p className="text-3xl font-bold text-amber-600 mt-1">
                  {kpis.overBudgetCount}
                </p>
                {kpis.overBudgetCount > 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    {formatCurrency(kpis.overBudgetAmount)} de dépassement
                  </p>
                )}
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== GRAPHIQUES ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Donut catégories */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-slate-400" />
                <CardTitle className="text-lg">
                  Budget par catégorie
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 200 200" className="w-52 h-52">
                  {(() => {
                    let cumulative = 0;
                    return byCategory.map((cat, i) => {
                      const pct =
                        totalBudgetCat > 0
                          ? cat.budget / totalBudgetCat
                          : 0;
                      if (pct === 0) return null;
                      const startAngle = cumulative * 360;
                      const endAngle = (cumulative + pct) * 360;
                      cumulative += pct;

                      const startRad =
                        ((startAngle - 90) * Math.PI) / 180;
                      const endRad =
                        ((endAngle - 90) * Math.PI) / 180;
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
                          key={cat.category}
                          d={path}
                          fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                          stroke="white"
                          strokeWidth="1.5"
                        >
                          <title>
                            {cat.category}: {formatCurrency(cat.budget)} (
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
                    className="text-xs fill-gray-400"
                  >
                    Budget
                  </text>
                  <text
                    x="100"
                    y="112"
                    textAnchor="middle"
                    className="text-sm font-bold fill-gray-800"
                  >
                    {formatCurrency(totalBudgetCat)}
                  </text>
                </svg>

                <div className="w-full mt-4 space-y-1.5">
                  {byCategory.map((cat, i) => {
                    const pct =
                      totalBudgetCat > 0
                        ? ((cat.budget / totalBudgetCat) * 100).toFixed(1)
                        : '0';
                    return (
                      <div
                        key={cat.category}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{
                              backgroundColor:
                                DONUT_COLORS[i % DONUT_COLORS.length],
                            }}
                          />
                          <span className="text-slate-600 truncate max-w-[140px]">
                            {cat.category}
                          </span>
                          <span className="text-slate-300">
                            ({cat.count})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">
                            {formatCurrency(cat.budget)}
                          </span>
                          <span className="text-slate-300 w-10 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Par type + Dépassements */}
        <div className="lg:col-span-3 space-y-6">
          {/* Par type */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-slate-400" />
                <CardTitle className="text-lg">
                  Budget par type de dépense
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {byType.map((item) => {
                  const cfg =
                    BUDGET_TYPE_CONFIG[
                      item.type as keyof typeof BUDGET_TYPE_CONFIG
                    ] || { label: item.type, className: 'bg-gray-100' };
                  const pctBudget =
                    kpis.budget > 0
                      ? (item.budget / kpis.budget) * 100
                      : 0;
                  const pctConsumed =
                    item.budget > 0
                      ? (item.actual / item.budget) * 100
                      : 0;

                  return (
                    <div key={item.type}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Badge className={cfg.className}>
                            {cfg.label}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {item.count} ligne{item.count > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-slate-500">
                            {formatCurrency(item.actual)}
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="font-semibold text-slate-700">
                            {formatCurrency(item.budget)}
                          </span>
                        </div>
                      </div>
                      <div className="relative w-full bg-gray-100 rounded-full h-3">
                        {/* Barre budget (gris clair) */}
                        <div
                          className="absolute top-0 left-0 h-3 rounded-full bg-gray-200"
                          style={{ width: `${pctBudget}%` }}
                        />
                        {/* Barre réalisé */}
                        <div
                          className={`absolute top-0 left-0 h-3 rounded-full transition-all ${consumptionBarColor(pctConsumed)}`}
                          style={{
                            width: `${Math.min(pctBudget, (item.actual / kpis.budget) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-[10px] text-slate-400">
                          {pctBudget.toFixed(0)}% du budget total
                        </span>
                        <span
                          className={`text-[10px] font-medium ${consumptionColor(pctConsumed)}`}
                        >
                          {pctConsumed.toFixed(0)}% consommé
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Dépassements */}
          {overBudgetLines.length > 0 && (
            <Card className="border-red-100">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-lg text-red-700">
                    Lignes en dépassement
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overBudgetLines.map((line) => (
                    <div
                      key={line.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-red-50/50 hover:bg-red-50 cursor-pointer transition-colors"
                      onClick={() => navigate('/budget/lignes')}
                    >
                      <div className="w-1 self-stretch rounded-full bg-red-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {line.label}
                        </p>
                        <p className="text-xs text-slate-400">
                          {line.category}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-red-600">
                          +{formatCurrency(line.overAmount)}
                        </p>
                        <p className="text-[10px] text-red-400">
                          +{line.overPct.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ===== COMPARATIF N / N-1 ===== */}
      {prevYearLines.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-slate-400" />
              <CardTitle className="text-lg">
                Comparatif {selectedYear} vs {previousYear}
              </CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              Par catégorie
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">
                      Catégorie
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">
                      {previousYear}
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">
                      {selectedYear}
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">
                      Écart
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">
                      Évolution
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {comparison.map((row) => (
                    <tr key={row.category} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-medium text-slate-700">
                        {row.category}
                      </td>
                      <td className="py-2.5 text-right text-slate-500">
                        {row.previous > 0
                          ? formatCurrency(row.previous)
                          : '—'}
                      </td>
                      <td className="py-2.5 text-right font-medium text-slate-800">
                        {row.current > 0
                          ? formatCurrency(row.current)
                          : '—'}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`font-medium ${
                            row.diff > 0
                              ? 'text-red-600'
                              : row.diff < 0
                                ? 'text-green-600'
                                : 'text-slate-400'
                          }`}
                        >
                          {row.diff > 0 ? '+' : ''}
                          {formatCurrency(row.diff)}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        {row.evolution !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              row.evolution > 0
                                ? 'text-red-600'
                                : row.evolution < 0
                                  ? 'text-green-600'
                                  : 'text-slate-400'
                            }`}
                          >
                            {row.evolution > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : row.evolution < 0 ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                            {row.evolution > 0 ? '+' : ''}
                            {row.evolution.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">
                            Nouveau
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 font-bold">
                    <td className="py-2.5">Total</td>
                    <td className="py-2.5 text-right text-slate-600">
                      {formatCurrency(kpis.prevBudget)}
                    </td>
                    <td className="py-2.5 text-right text-slate-800">
                      {formatCurrency(kpis.budget)}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={
                          kpis.budget - kpis.prevBudget > 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }
                      >
                        {kpis.budget - kpis.prevBudget > 0 ? '+' : ''}
                        {formatCurrency(kpis.budget - kpis.prevBudget)}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      {kpis.budgetEvolution !== null && (
                        <span
                          className={`text-xs ${
                            kpis.budgetEvolution > 0
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {kpis.budgetEvolution > 0 ? '+' : ''}
                          {kpis.budgetEvolution.toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== ACCÈS RAPIDE ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/budget/lignes')}
        >
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">
                Lignes budgétaires
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Gérer les {kpis.lineCount} lignes de {selectedYear}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300" />
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/budget/agences')}
        >
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">
                Ventilation par agence
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Répartition du budget sur les 25 agences
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
