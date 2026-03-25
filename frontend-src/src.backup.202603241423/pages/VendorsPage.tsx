import { Building2, Mail, Phone, ChevronRight } from 'lucide-react';

const vendors = [
  { id: 'V-001', name: 'Microsoft France', category: 'Logiciel', contracts: 4, totalValue: '142 000 €', contact: 'Jean Dupont', email: 'jdupont@microsoft.com', phone: '+33 1 57 75 80 00', status: 'active' },
  { id: 'V-002', name: 'Hewlett Packard Enterprise', category: 'Matériel', contracts: 3, totalValue: '98 500 €', contact: 'Marie Martin', email: 'mmartin@hpe.com', phone: '+33 1 47 11 75 00', status: 'active' },
  { id: 'V-003', name: 'Orange Business Services', category: 'Réseau', contracts: 2, totalValue: '210 000 €', contact: 'Pierre Leroy', email: 'pleroy@orange.com', phone: '+33 1 44 44 22 22', status: 'active' },
  { id: 'V-004', name: 'Broadcom / VMware', category: 'Virtualisation', contracts: 2, totalValue: '38 400 €', contact: 'Sophie Bernard', email: 'sbernard@broadcom.com', phone: '+33 1 41 15 50 00', status: 'active' },
  { id: 'V-005', name: 'SentinelOne', category: 'Sécurité', contracts: 1, totalValue: '18 750 €', contact: 'Lucas Petit', email: 'lpetit@sentinelone.com', phone: '+33 9 77 40 10 10', status: 'active' },
  { id: 'V-006', name: 'Fortinet', category: 'Sécurité', contracts: 2, totalValue: '24 600 €', contact: 'Emma Rousseau', email: 'erousseau@fortinet.com', phone: '+33 1 70 61 56 00', status: 'active' },
  { id: 'V-007', name: 'NetApp', category: 'Matériel', contracts: 1, totalValue: '67 000 €', contact: 'Thomas Moreau', email: 'tmoreau@netapp.com', phone: '+33 1 41 91 00 00', status: 'active' },
  { id: 'V-008', name: 'Cisco Systems', category: 'Réseau', contracts: 3, totalValue: '56 800 €', contact: 'Camille Durand', email: 'cdurand@cisco.com', phone: '+33 1 58 04 60 00', status: 'active' },
  { id: 'V-009', name: 'Veeam Software', category: 'Logiciel', contracts: 1, totalValue: '14 200 €', contact: 'Antoine Simon', email: 'asimon@veeam.com', phone: '+33 1 76 49 06 00', status: 'active' },
  { id: 'V-010', name: 'Adobe Systems', category: 'Logiciel', contracts: 1, totalValue: '6 200 €', contact: 'Léa Michel', email: 'lmichel@adobe.com', phone: '+33 1 45 35 35 35', status: 'inactive' },
];

const categoryColors: Record<string, string> = {
  Logiciel: 'bg-blue-50 text-blue-700',
  Matériel: 'bg-violet-50 text-violet-700',
  Réseau: 'bg-emerald-50 text-emerald-700',
  Sécurité: 'bg-red-50 text-red-700',
  Virtualisation: 'bg-amber-50 text-amber-700',
};

export default function VendorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fournisseurs</h1>
          <p className="text-slate-500 text-sm mt-1">{vendors.length} fournisseurs référencés</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-200 self-start">
          <Building2 className="w-4 h-4" />
          Nouveau fournisseur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {vendors.map((vendor) => (
          <div
            key={vendor.id}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate text-sm">
                    {vendor.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{vendor.id}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors shrink-0 mt-1" />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-medium px-2 py-1 rounded-lg ${categoryColors[vendor.category] ?? 'bg-slate-100 text-slate-600'}`}>
                {vendor.category}
              </span>
              <span className={`text-xs font-medium px-2 py-1 rounded-lg ${vendor.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {vendor.status === 'active' ? 'Actif' : 'Inactif'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">Contrats</p>
                <p className="text-lg font-bold text-slate-800">{vendor.contracts}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">Valeur totale</p>
                <p className="text-sm font-bold text-slate-800">{vendor.totalValue}</p>
              </div>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{vendor.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{vendor.phone}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
