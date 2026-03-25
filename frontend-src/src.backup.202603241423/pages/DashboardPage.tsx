import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContracts } from '@/contexts/ContractsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  AlertTriangle,
  TrendingUp,
  Clock,
  Ban,
  ChevronRight,
  ArrowRight,
  CalendarClock,
  Euro,
  Building2,
  ShieldAlert,
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

// ============================================================
// CONFIG
// ============================================================

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
];

const categoryColors: Record<string, { bg: string; text: string; badge: string }> = {
  'Copieurs': { bg: '#3b82f6', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  'Matériels': { bg: '#8b5cf6', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  'Maintenance': { bg: '#f97316', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  'Téléphonie': { bg: '#22c55e', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  'Réseau-Télécom': { bg: '#6366f1', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
  'Licences-Logiciels': { bg: '#ec4899', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-700' },
  'Hébergement-Cloud': { bg: '#06b6d4', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-700' },
  'Prestations': { bg: '#f59e0b', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
  'Sécurité': { bg: '#ef4444', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
  'Autres': { bg: '#6b7280', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700' },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Actif', className: 'bg-green-100 text-green-700' },
  DENOUNCED: { label: 'Dénoncé', className: 'bg-gray-100 text-gray-600' },
  EXPIRED: { label: 'Expiré', className: 'bg-red-100 text-red-700' },
  NEGOTIATING: { label: 'En négociation', className: 'bg-yellow-100 text-yellow-700' },
  RENEWING: { label: 'En renouvellement', className: 'bg-blue-100 text-blue-700' },
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function DashboardPage() {
  const navigate = useNavigate();
  const { contracts, suppliers } = useContracts();

  // ========== CALCULS ==========

  const stats = useMemo(() => {
    const active = contracts.filter((c) => c.status === 'ACTIVE');
    const denounced = contracts.filter((c) => c.status === 'DENOUNCED');
    const expired = contracts.filter((c) => c.status === 'EXPIRED');
    const negotiating = contracts.filter((c) => c.status === 'NEGOTIATING');

    const totalAnnualized = contracts.reduce(
      (sum, c) => sum + getAnnualized(c.amountHt, c.billingPeriod),
      0
    );

    const activeAnnualized = active.reduce(
      (sum, c) => sum + getAnnualized(c.amountHt, c.billingPeriod),
      0
    );

    return {
      total: contracts.length,
      active: active.length,
      denounced: denounced.length,
      expired: expired.length,
      negotiating: negotiating.length,
      totalAnnualized,
      activeAnnualized,
    };
  }, [contracts]);

  // Alertes de dénonciation (contrats actifs avec deadline)
  const alerts = useMemo(() => {
    return contracts
      .filter(
        (c) =>
          c.status === 'ACTIVE' &&
          c.noticeDeadline
      )
      .map((c) => {
        const days = daysUntil(c.noticeDeadline!);
        let urgency: { level: string; className: string; label: string };

        if (days < 0) {
          urgency = {
            level: 'OVERDUE',
            className: 'bg-red-100 text-red-700 border-red-200',
            label: '⚠️ Dépassée',
          };
        } else if (days < 30) {
          urgency = {
            level: 'URGENT',
            className: 'bg-red-100 text-red-700 border-red-200',
            label: 'Urgent',
          };
        } else if (days < 90) {
          urgency = {
            level: 'PLAN',
            className: 'bg-orange-100 text-orange-700 border-orange-200',
            label: 'À planifier',
          };
        } else if (days < 180) {
          urgency = {
            level: 'ANTICIPATE',
            className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            label: 'À anticiper',
          };
        } else {
          urgency = {
            level: 'OK',
            className: 'bg-green-100 text-green-700 border-green-200',
            label: 'OK',
          };
        }

        return { ...c, days, urgency };
      })
      .sort((a, b) => a.days - b.days);
  }, [contracts]);

  const urgentAlerts = alerts.filter(
    (a) => a.urgency.level !== 'OK'
  );

  // Répartition par catégorie
  const byCategory = useMemo(() => {
    const map: Record<string, { count: number; amount: number }> = {};
    contracts.forEach((c) => {
      if (!map[c.category]) map[c.category] = { count: 0, amount: 0 };
      map[c.category].count += 1;
      map[c.category].amount += getAnnualized(c.amountHt, c.billingPeriod);
    });
    return Object.entries(map)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [contracts]);

  const totalCategoryAmount = byCategory.reduce((s, c) => s + c.amount, 0);

  // Répartition par statut
  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    contracts.forEach((c) => {
      map[c.status] = (map[c.status] || 0) + 1;
    });
    return Object.entries(map)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [contracts]);

  // Top 5 contrats par montant annualisé
  const top5 = useMemo(() => {
    return [...contracts]
      .map((c) => ({
        ...c,
        annualized: getAnnualized(c.amountHt, c.billingPeriod),
      }))
      .sort((a, b) => b.annualized - a.annualized)
      .slice(0, 5);
  }, [contracts]);

  // ========== RENDU ==========

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Tableau de bord DSI
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Vue d'ensemble de vos contrats et engagements IT
        </p>
      </div>

      {/* ========== KPIs ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/contrats')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Contrats actifs
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {stats.active}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  sur {stats.total} au total
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Budget annualisé
                </p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {formatCurrency(stats.activeAnnualized)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  contrats actifs uniquement
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Euro className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/contrats')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Alertes dénonciation
                </p>
                <p className="text-3xl font-bold text-amber-600 mt-1">
                  {urgentAlerts.length}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  à traiter sous 180 jours
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Fournisseurs
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {suppliers.length}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  référencés
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========== ALERTES DÉNONCIATION ========== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">
              Alertes de dénonciation
            </CardTitle>
            {urgentAlerts.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700">
                {urgentAlerts.length}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/contrats')}
          >
            Voir tous les contrats
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {urgentAlerts.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <CalendarClock className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                Aucune alerte de dénonciation dans les 180 prochains jours
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {urgentAlerts.map((alert) => {
                const supplier = suppliers.find(
                  (s) => s.id === alert.supplierId
                );
                const annualized = getAnnualized(
                  alert.amountHt,
                  alert.billingPeriod
                );
                const catCfg = categoryColors[alert.category];

                return (
                  <div
                    key={alert.id}
                    className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 cursor-pointer transition-all"
                    onClick={() => navigate(`/contrats/${alert.id}`)}
                  >
                    {/* Indicateur urgence */}
                    <div className="shrink-0">
                      <Badge
                        className={`text-xs border ${alert.urgency.className}`}
                      >
                        {alert.urgency.label}
                      </Badge>
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {alert.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400 font-mono">
                          {alert.reference}
                        </span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-500">
                          {supplier?.name}
                        </span>
                      </div>
                    </div>

                    {/* Deadline */}
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-sm font-medium text-slate-700">
                        {alert.noticeDeadline
                          ? formatDate(alert.noticeDeadline)
                          : '—'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {alert.days < 0
                          ? `${Math.abs(alert.days)}j de retard`
                          : `dans ${alert.days}j`}
                      </p>
                    </div>

                    {/* Montant */}
                    <div className="text-right shrink-0 hidden md:block">
                      <p className="text-sm font-semibold text-blue-600">
                        {formatCurrency(annualized)}
                      </p>
                      <p className="text-xs text-slate-400">/an</p>
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========== GRAPHIQUES ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Donut catégories */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">
                Répartition par catégorie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                {/* Donut SVG */}
                <svg viewBox="0 0 200 200" className="w-52 h-52">
                  {(() => {
                    let cumulative = 0;
                    return byCategory.map((cat, i) => {
                      const pct = cat.amount / totalCategoryAmount;
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

                      const color =
                        categoryColors[cat.category]?.bg ||
                        COLORS[i % COLORS.length];

                      const path = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;

                      return (
                        <path
                          key={cat.category}
                          d={path}
                          fill={color}
                          stroke="white"
                          strokeWidth="1.5"
                        >
                          <title>
                            {cat.category}: {formatCurrency(cat.amount)} (
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
                    Total
                  </text>
                  <text
                    x="100"
                    y="112"
                    textAnchor="middle"
                    className="text-sm font-bold fill-gray-800"
                  >
                    {formatCurrency(totalCategoryAmount)}
                  </text>
                </svg>

                {/* Légende */}
                <div className="w-full mt-4 space-y-1.5">
                  {byCategory.map((cat, i) => {
                    const pct = (
                      (cat.amount / totalCategoryAmount) *
                      100
                    ).toFixed(1);
                    const color =
                      categoryColors[cat.category]?.bg ||
                      COLORS[i % COLORS.length];

                    return (
                      <div
                        key={cat.category}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-slate-600">
                            {cat.category}
                          </span>
                          <span className="text-slate-300">
                            ({cat.count})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">
                            {formatCurrency(cat.amount)}
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

        {/* Top 5 contrats + Statuts */}
        <div className="lg:col-span-3 space-y-6">
          {/* Répartition par statut */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Répartition par statut
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {byStatus.map((item) => {
                  const cfg = statusConfig[item.status] || {
                    label: item.status,
                    className: 'bg-gray-100 text-gray-600',
                  };
                  const pct = (item.count / stats.total) * 100;

                  return (
                    <div key={item.status}>
                      <div className="flex items-center justify-between mb-1">
                        <Badge className={cfg.className}>
                          {cfg.label}
                        </Badge>
                        <span className="text-sm text-slate-600 font-medium">
                          {item.count} contrat{item.count > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all bg-slate-400"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              item.status === 'ACTIVE'
                                ? '#22c55e'
                                : item.status === 'EXPIRED'
                                  ? '#ef4444'
                                  : item.status === 'DENOUNCED'
                                    ? '#94a3b8'
                                    : item.status === 'NEGOTIATING'
                                      ? '#f59e0b'
                                      : '#3b82f6',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top 5 contrats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">
                Top 5 — Plus gros contrats
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/contrats')}
              >
                Tous
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {top5.map((contract, index) => {
                  const supplier = suppliers.find(
                    (s) => s.id === contract.supplierId
                  );
                  const catCfg = categoryColors[contract.category];
                  const pct =
                    (contract.annualized / top5[0].annualized) * 100;

                  return (
                    <div
                      key={contract.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() =>
                        navigate(`/contrats/${contract.id}`)
                      }
                    >
                      {/* Rang */}
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-slate-500">
                          {index + 1}
                        </span>
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {contract.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">
                            {supplier?.name}
                          </span>
                          <Badge
                            className={`text-[10px] px-1.5 py-0 ${catCfg?.badge || 'bg-gray-100 text-gray-700'}`}
                          >
                            {contract.category}
                          </Badge>
                        </div>
                        {/* Barre proportionnelle */}
                        <div className="w-full bg-gray-100 rounded-full h-1 mt-1.5">
                          <div
                            className="h-1 rounded-full bg-blue-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Montant */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-blue-600">
                          {formatCurrency(contract.annualized)}
                        </p>
                        <p className="text-[10px] text-slate-400">/an</p>
                      </div>

                      <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========== RÉSUMÉ RAPIDE ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Engagement total
                </p>
                <p className="text-xl font-bold text-blue-700">
                  {formatCurrency(stats.totalAnnualized)}
                </p>
                <p className="text-xs text-blue-400">
                  tous contrats confondus
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm text-amber-600 font-medium">
                  En négociation
                </p>
                <p className="text-xl font-bold text-amber-700">
                  {stats.negotiating} contrat{stats.negotiating > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-amber-400">en attente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Ban className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-red-600 font-medium">Expirés</p>
                <p className="text-xl font-bold text-red-700">
                  {stats.expired} contrat{stats.expired > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-red-400">
                  à renouveler ou archiver
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
