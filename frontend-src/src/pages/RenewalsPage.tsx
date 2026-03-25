import { Clock, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

const renewals = [
  { id: 'CTR-2024-046', name: 'Maintenance serveurs HPE', vendor: 'Hewlett Packard Enterprise', expiry: '15/01/2025', days: 18, value: '32 500 €', priority: 'critical' },
  { id: 'CTR-2024-041', name: 'Firewall Fortinet FortiGate', vendor: 'Fortinet', expiry: '05/01/2025', days: 8, value: '9 800 €', priority: 'critical' },
  { id: 'CTR-2024-044', name: 'Support VMware vSphere', vendor: 'Broadcom / VMware', expiry: '28/02/2025', days: 45, value: '21 200 €', priority: 'warning' },
  { id: 'CTR-2024-047', name: 'Licence Microsoft 365 E3', vendor: 'Microsoft France', expiry: '31/03/2025', days: 87, value: '84 000 €', priority: 'normal' },
  { id: 'CTR-2024-040', name: 'Stockage NetApp AFF', vendor: 'NetApp', expiry: '31/08/2025', days: 240, value: '67 000 €', priority: 'normal' },
  { id: 'CTR-2024-039', name: 'Cisco Catalyst switches', vendor: 'Cisco Systems', expiry: '31/12/2025', days: 365, value: '28 400 €', priority: 'normal' },
];

const priorityConfig: Record<string, { label: string; icon: React.ReactNode; bar: string; badge: string }> = {
  critical: {
    label: 'Critique',
    icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
    bar: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
  },
  warning: {
    label: 'Attention',
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    bar: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  normal: {
    label: 'Normal',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

export default function RenewalsPage() {
  const critical = renewals.filter((r) => r.priority === 'critical');
  const warning = renewals.filter((r) => r.priority === 'warning');
  const normal = renewals.filter((r) => r.priority === 'normal');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Renouvellements</h1>
        <p className="text-slate-500 text-sm mt-1">Suivi des échéances et actions requises</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Critiques (< 30j)', count: critical.length, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
          { label: 'Attention (30–60j)', count: warning.length, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'Planifiés (> 60j)', count: normal.length, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl border p-5 ${item.bg}`}>
            <p className={`text-3xl font-bold ${item.color}`}>{item.count}</p>
            <p className="text-sm text-slate-600 mt-1 font-medium">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Renewals list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Calendrier des renouvellements</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {renewals.map((r) => {
            const cfg = priorityConfig[r.priority];
            const pct = Math.min(100, Math.round((r.days / 365) * 100));
            return (
              <div key={r.id} className="px-6 py-4 hover:bg-slate-50/70 transition-colors cursor-pointer group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 shrink-0">{cfg.icon}</div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {r.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{r.vendor} · {r.id}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-32">
                          <div
                            className={`h-full rounded-full ${cfg.bar} transition-all`}
                            style={{ width: `${100 - pct}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${r.days <= 30 ? 'text-red-600' : r.days <= 60 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {r.days}j restants
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-sm font-semibold text-slate-800">{r.value}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                      {r.expiry}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
