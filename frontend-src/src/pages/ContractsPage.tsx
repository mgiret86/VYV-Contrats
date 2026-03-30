import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  ChevronRight,
  ArrowUpDown,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useContracts } from '@/contexts/ContractsContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// ============================================================
// CONFIG
// ============================================================

const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
  ACTIVE: { label: 'Actif', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  RENEWING: { label: 'En renouvellement', className: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  DENOUNCED: { label: 'Dénoncé', className: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  EXPIRED: { label: 'Expiré', className: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  NEGOTIATING: { label: 'En négociation', className: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  TO_TRANSFER: { label: 'À transférer', className: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  TRANSFERRING: { label: 'En cours de transfert', className: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
};

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

const periodLabels: Record<string, string> = {
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
  ANNUAL: 'Annuel',
  ONE_TIME: 'Ponctuel',
};

// ============================================================
// HELPERS
// ============================================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getAnnualized(amount: number, period: string): number {
  if (period === 'MONTHLY') return amount * 12;
  if (period === 'QUARTERLY') return amount * 4;
  return amount;
}

// ============================================================
// COMPOSANT
// ============================================================

export default function ContractsPage() {
  const navigate = useNavigate();
  const { contracts, suppliers, deleteContract } = useContracts();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedStatus, setSelectedStatus] = useState('Tous');
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);

  // Extraire les catégories dynamiquement depuis les données
  const categories = useMemo(() => {
    const cats = Array.from(new Set(contracts.map((c) => c.category)));
    return ['Tous', ...cats.sort()];
  }, [contracts]);

  // Extraire les statuts dynamiquement
  const statuses = useMemo(() => {
    const sts = Array.from(new Set(contracts.map((c) => c.status)));
    return ['Tous', ...sts];
  }, [contracts]);

  // Filtrage
  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      const supplierName =
        suppliers.find((s) => s.id === c.supplierId)?.name || '';

      const matchSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.reference.toLowerCase().includes(search.toLowerCase()) ||
        supplierName.toLowerCase().includes(search.toLowerCase());

      const matchCat =
        selectedCategory === 'Tous' || c.category === selectedCategory;

      const matchStatus =
        selectedStatus === 'Tous' || c.status === selectedStatus;

      return matchSearch && matchCat && matchStatus;
    });
  }, [contracts, suppliers, search, selectedCategory, selectedStatus]);

  // Suppression
  const handleDelete = () => {
    if (contractToDelete) {
      deleteContract(contractToDelete);
      setContractToDelete(null);
    }
  };

  const contractToDeleteData = contractToDelete
    ? contracts.find((c) => c.id === contractToDelete)
    : null;

  return (
    <div className="space-y-6">
      {/* ========== EN-TÊTE ========== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contrats</h1>
          <p className="text-slate-500 text-sm mt-1">
            {contracts.length} contrat{contracts.length > 1 ? 's' : ''} au total
            {filtered.length !== contracts.length &&
              ` · ${filtered.length} affiché${filtered.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2 rounded-xl transition-colors">
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <Button
            onClick={() => navigate('/contrats/nouveau')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-200"
          >
            <Plus className="w-4 h-4" />
            Nouveau contrat
          </Button>
        </div>
      </div>

      {/* ========== FILTRES ========== */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom, fournisseur, référence…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
          <div className="w-px h-5 bg-slate-200" />
          {statuses.map((s) => {
            const cfg = statusConfig[s];
            return (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                  selectedStatus === s
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {s === 'Tous' ? 'Tous statuts' : cfg?.label || s}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========== TABLEAU ========== */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                    Contrat <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  Catégorie
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                  Fournisseur
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                  Échéance
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">
                  Périodicité
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                  Montant HT
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  Annualisé HT
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-slate-400 text-sm"
                  >
                    Aucun contrat trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((contract) => {
                  const s = statusConfig[contract.status] || {
                    label: contract.status,
                    className: 'bg-gray-50 text-gray-600 border-gray-200',
                    dot: 'bg-gray-400',
                  };
                  const supplierName =
                    suppliers.find((sup) => sup.id === contract.supplierId)
                      ?.name || '—';
                  const annualized = getAnnualized(
                    contract.amountHt,
                    contract.billingPeriod
                  );
                  const catColor =
                    categoryColors[contract.category] ||
                    'bg-gray-100 text-gray-700';

                  return (
                    <tr
                      key={contract.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/contrats/${contract.id}`)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                          {contract.title}
                        </p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {contract.reference}
                        </p>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span
                          className={`text-xs px-2 py-1 rounded-md font-medium ${catColor}`}
                        >
                          {contract.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-sm text-slate-600">
                          {supplierName}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-sm text-slate-600 font-medium">
                          {formatDate(contract.endDate)}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden xl:table-cell">
                        <span className="text-sm text-slate-600">
                          {periodLabels[contract.billingPeriod] ||
                            contract.billingPeriod}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right hidden sm:table-cell">
                        <span className="text-sm font-medium text-slate-700">
                          {formatCurrency(contract.amountHt)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right hidden md:table-cell">
                        <span className="text-sm font-semibold text-blue-600">
                          {formatCurrency(annualized)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${s.className}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${s.dot}`}
                          />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Voir le détail"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/contrats/${contract.id}`);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-amber-600 transition-colors"
                            title="Modifier"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/contrats/${contract.id}/modifier`);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors"
                            title="Supprimer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setContractToDelete(contract.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pied de tableau */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          </p>
          <p className="text-xs text-slate-500 font-medium">
            Total annualisé :{' '}
            <span className="text-blue-600 font-semibold">
              {formatCurrency(
                filtered.reduce(
                  (sum, c) => sum + getAnnualized(c.amountHt, c.billingPeriod),
                  0
                )
              )}
            </span>
          </p>
        </div>
      </div>

      {/* ========== DIALOG SUPPRESSION ========== */}
      <Dialog
        open={!!contractToDelete}
        onOpenChange={() => setContractToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le contrat «{' '}
              {contractToDeleteData?.title} » ({contractToDeleteData?.reference}
              ) ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setContractToDelete(null)}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
