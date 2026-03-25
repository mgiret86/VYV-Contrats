import { BarChart3, TrendingUp, Download, Calendar, Euro, FileText } from 'lucide-react';

const monthlyData = [
  { month: 'Juil', value: 98, contracts: 5 },
  { month: 'Août', value: 72, contracts: 3 },
  { month: 'Sep', value: 115, contracts: 7 },
  { month: 'Oct', value: 88, contracts: 4 },
  { month: 'Nov', value: 134, contracts: 8 },
  { month: 'Déc', value: 156, contracts: 6 },
];

const maxVal = Math.max(...monthlyData.map((d) => d.value));

const reports = [
  { title: 'Rapport mensuel DSI — Décembre 2024', date: '01/01/2025', type: 'Mensuel', size: '2.4 MB' },
  { title: 'Analyse des renouvellements Q4 2024', date: '15/12/2024', type: 'Trimestriel', size: '1.8 MB' },
  { title: 'Audit fournisseurs 2024', date: '01/12/2024', type: 'Annuel', size: '4.1 MB' },
  { title: 'Rapport mensuel DSI — Novembre 2024', date: '01/12/2024', type: 'Mensuel', size: '2.2 MB' },
  { title: 'Synthèse budgétaire IT S2 2024', date: '15/11/2024', type: 'Semestriel', size: '3.3 MB' },
];

const typeColors: Record<string, string> = {
  Mensuel: 'bg-blue-50 text-blue-700',
  Trimestriel: 'bg-violet-50 text-violet-700',
  Annuel: 'bg-emerald-50 text-emerald-700',
  Semestriel: 'bg-amber-50 text-amber-700',
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rapports</h1>
          <p className="text-slate-500 text-sm mt-1">Analyses et exports de données</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-200 self-start">
          <BarChart3 className="w-4 h-4" />
          Générer un rapport
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Valeur totale des contrats', value: '1,24M€', sub: '+8% vs N-1', icon: Euro, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Contrats signés en 2024', value: '47', sub: '+3 ce mois', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Économies réalisées', value: '34 200€', sub: 'Renégociations 2024', icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`rounded-2xl border p-5 ${kpi.bg}`}>
              <div className="flex items-center gap-3 mb-3">
                <Icon className={`w-5 h-5 ${kpi.color}`} />
                <p className="text-sm text-slate-600 font-medium">{kpi.label}</p>
              </div>
              <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-slate-500 mt-1">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Chart + reports list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-slate-900">Dépenses mensuelles</h2>
              <p className="text-xs text-slate-400 mt-0.5">En milliers d'euros — 6 derniers mois</p>
            </div>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-end gap-3 h-40">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">{d.value}k</span>
                <div className="w-full relative group">
                  <div
                    className="w-full bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-600"
                    style={{ height: `${(d.value / maxVal) * 120}px` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-6">Répartition budgétaire</h2>
          <div className="space-y-4">
            {[
              { label: 'Logiciel', value: '468 000 €', pct: 38, color: 'bg-blue-500' },
              { label: 'Réseau', value: '266 000 €', pct: 21, color: 'bg-emerald-500' },
              { label: 'Matériel', value: '197 500 €', pct: 16, color: 'bg-violet-500' },
              { label: 'Sécurité', value: '185 000 €', pct: 15, color: 'bg-red-500' },
              { label: 'Virtualisation', value: '123 500 €', pct: 10, color: 'bg-amber-500' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-sm text-slate-700 font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-800">{item.value}</span>
                    <span className="text-xs text-slate-400 w-8 text-right">{item.pct}%</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reports list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Rapports disponibles</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {reports.map((report, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors group cursor-pointer">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                    {report.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{report.date} · {report.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className={`text-xs font-medium px-2 py-1 rounded-lg ${typeColors[report.type]}`}>
                  {report.type}
                </span>
                <button className="w-8 h-8 rounded-lg hover:bg-blue-50 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
