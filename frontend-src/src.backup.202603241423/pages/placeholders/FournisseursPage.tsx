import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContracts } from '@/contexts/ContractsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Building2,
  Mail,
  Phone,
  Globe,
  FileText,
  ChevronRight,
  ExternalLink,
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

function getAnnualized(amount: number, period: string): number {
  if (period === 'MONTHLY') return amount * 12;
  if (period === 'QUARTERLY') return amount * 4;
  return amount;
}

// ============================================================
// COMPOSANT
// ============================================================

export default function FournisseursPage() {
  const navigate = useNavigate();
  const {
    suppliers,
    contracts,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    getContractsBySupplier,
  } = useContracts();

  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  const [detailSupplierId, setDetailSupplierId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    siret: '',
    website: '',
    notes: '',
  });

  // ===== Données enrichies =====
  const enrichedSuppliers = useMemo(() => {
    return suppliers.map((s) => {
      const supplierContracts = getContractsBySupplier(s.id);
      const activeContracts = supplierContracts.filter(
        (c) => c.status === 'ACTIVE'
      );
      const totalAnnualized = supplierContracts.reduce(
        (sum, c) => sum + getAnnualized(c.amountHt, c.billingPeriod),
        0
      );
      return {
        ...s,
        contractCount: supplierContracts.length,
        activeContractCount: activeContracts.length,
        totalAnnualized,
      };
    });
  }, [suppliers, getContractsBySupplier]);

  // ===== Filtrage =====
  const filtered = useMemo(() => {
    return enrichedSuppliers.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.contactName.toLowerCase().includes(search.toLowerCase()) ||
        s.contactEmail.toLowerCase().includes(search.toLowerCase());
      const matchActive = showInactive || s.isActive;
      return matchSearch && matchActive;
    });
  }, [enrichedSuppliers, search, showInactive]);

  // ===== Totaux =====
  const totalActive = suppliers.filter((s) => s.isActive).length;
  const totalEngagement = enrichedSuppliers.reduce(
    (sum, s) => sum + s.totalAnnualized,
    0
  );

  // ===== CRUD =====
  const openCreate = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      siret: '',
      website: '',
      notes: '',
    });
    setIsDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const s = suppliers.find((sup) => sup.id === id);
    if (!s) return;
    setEditingSupplier(id);
    setFormData({
      name: s.name,
      contactName: s.contactName,
      contactEmail: s.contactEmail,
      contactPhone: s.contactPhone,
      address: s.address || '',
      siret: s.siret || '',
      website: s.website || '',
      notes: s.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.contactName || !formData.contactEmail) {
      return;
    }

    if (editingSupplier) {
      await updateSupplier(editingSupplier, formData);
    } else {
      await addSupplier({
        ...formData,
        isActive: true,
      });
    }
    setIsDialogOpen(false);
    setEditingSupplier(null);
  };

  const handleDelete = () => {
    if (supplierToDelete) {
      deleteSupplier(supplierToDelete);
      setSupplierToDelete(null);
    }
  };

  const toggleActive = (id: string) => {
    const s = suppliers.find((sup) => sup.id === id);
    if (s) {
      updateSupplier(id, { isActive: !s.isActive });
    }
  };

  const supplierToDeleteData = supplierToDelete
    ? enrichedSuppliers.find((s) => s.id === supplierToDelete)
    : null;

  const detailSupplier = detailSupplierId
    ? enrichedSuppliers.find((s) => s.id === detailSupplierId)
    : null;

  const detailContracts = detailSupplierId
    ? getContractsBySupplier(detailSupplierId)
    : [];

  const set = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  // ===== RENDU =====
  return (
    <div className="space-y-6">
      {/* ========== EN-TÊTE ========== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fournisseurs</h1>
          <p className="text-slate-500 text-sm mt-1">
            {totalActive} fournisseur{totalActive > 1 ? 's' : ''} actif
            {totalActive > 1 ? 's' : ''} ·{' '}
            {formatCurrency(totalEngagement)} d'engagement annuel
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau fournisseur
        </Button>
      </div>

      {/* ========== FILTRES ========== */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher par nom, contact, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <button
          onClick={() => setShowInactive(!showInactive)}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
            showInactive
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          {showInactive ? 'Tous affichés' : 'Afficher les inactifs'}
        </button>
      </div>

      {/* ========== TABLEAU ========== */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Contact
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Email
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Téléphone
                  </TableHead>
                  <TableHead className="text-center">Contrats</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
                    Engagement /an
                  </TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-12 text-slate-400"
                    >
                      Aucun fournisseur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((supplier) => (
                    <TableRow
                      key={supplier.id}
                      className="cursor-pointer hover:bg-slate-50/70 group"
                      onClick={() => setDetailSupplierId(supplier.id)}
                    >
                      <TableCell>
                        <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                          {supplier.name}
                        </p>
                        {supplier.siret && (
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            SIRET: {supplier.siret}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-600">
                        {supplier.contactName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <a
                          href={`mailto:${supplier.contactEmail}`}
                          className="text-sm text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {supplier.contactEmail}
                        </a>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-600">
                        {supplier.contactPhone}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Badge
                            variant="secondary"
                            className="text-xs"
                          >
                            {supplier.contractCount}
                          </Badge>
                          {supplier.activeContractCount > 0 && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              {supplier.activeContractCount} actif
                              {supplier.activeContractCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        <span className="text-sm font-semibold text-blue-600">
                          {formatCurrency(supplier.totalAnnualized)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            supplier.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }
                        >
                          {supplier.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Modifier"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(supplier.id);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={
                              supplier.isActive
                                ? 'Désactiver'
                                : 'Activer'
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActive(supplier.id);
                            }}
                          >
                            <span
                              className={`text-xs ${supplier.isActive ? 'text-red-500' : 'text-green-500'}`}
                            >
                              ●
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Supprimer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSupplierToDelete(supplier.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ========== DIALOG DÉTAIL ========== */}
      <Dialog
        open={!!detailSupplierId}
        onOpenChange={() => setDetailSupplierId(null)}
      >
        <DialogContent className="max-w-2xl">
          {detailSupplier && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  {detailSupplier.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-2">
                {/* Infos générales */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-slate-500 text-xs">Contact</p>
                        <p className="font-medium">
                          {detailSupplier.contactName}
                        </p>
                        <a
                          href={`mailto:${detailSupplier.contactEmail}`}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          {detailSupplier.contactEmail}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-slate-500 text-xs">Téléphone</p>
                        <p className="font-medium">
                          {detailSupplier.contactPhone}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {detailSupplier.address && (
                      <div>
                        <p className="text-slate-500 text-xs">Adresse</p>
                        <p className="font-medium text-xs">
                          {detailSupplier.address}
                        </p>
                      </div>
                    )}
                    {detailSupplier.siret && (
                      <div>
                        <p className="text-slate-500 text-xs">SIRET</p>
                        <p className="font-mono text-xs">
                          {detailSupplier.siret}
                        </p>
                      </div>
                    )}
                    {detailSupplier.website && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3 text-slate-400" />
                        <a
                          href={detailSupplier.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          {detailSupplier.website}
                          <ExternalLink className="h-3 w-3 inline ml-1" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {detailSupplier.notes && (
                  <div className="text-sm bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-1">Notes</p>
                    <p className="text-slate-700">{detailSupplier.notes}</p>
                  </div>
                )}

                {/* KPIs */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {detailSupplier.contractCount}
                    </p>
                    <p className="text-xs text-blue-500">
                      Contrat{detailSupplier.contractCount > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {detailSupplier.activeContractCount}
                    </p>
                    <p className="text-xs text-green-500">
                      Actif{detailSupplier.activeContractCount > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-purple-600">
                      {formatCurrency(detailSupplier.totalAnnualized)}
                    </p>
                    <p className="text-xs text-purple-500">
                      Engagement /an
                    </p>
                  </div>
                </div>

                {/* Liste des contrats */}
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    Contrats associés
                  </p>
                  {detailContracts.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      Aucun contrat associé
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {detailContracts.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setDetailSupplierId(null);
                            navigate(`/contrats/${c.id}`);
                          }}
                        >
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {c.title}
                            </p>
                            <p className="text-xs text-slate-400 font-mono">
                              {c.reference}
                            </p>
                          </div>
                          <Badge
                            className={`text-[10px] ${
                              c.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : c.status === 'EXPIRED'
                                  ? 'bg-red-100 text-red-700'
                                  : c.status === 'DENOUNCED'
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {c.status === 'ACTIVE'
                              ? 'Actif'
                              : c.status === 'EXPIRED'
                                ? 'Expiré'
                                : c.status === 'DENOUNCED'
                                  ? 'Dénoncé'
                                  : c.status}
                          </Badge>
                          <span className="text-sm font-medium text-blue-600 shrink-0">
                            {formatCurrency(
                              getAnnualized(c.amountHt, c.billingPeriod)
                            )}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
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

      {/* ========== DIALOG CRÉATION / ÉDITION ========== */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier
                ? 'Modifier le fournisseur'
                : 'Nouveau fournisseur'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom *</Label>
              <Input
                value={formData.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Ex: Orange Business"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact principal *</Label>
                <Input
                  value={formData.contactName}
                  onChange={(e) => set('contactName', e.target.value)}
                  placeholder="Prénom Nom"
                />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input
                  value={formData.contactPhone}
                  onChange={(e) => set('contactPhone', e.target.value)}
                  placeholder="01 23 45 67 89"
                />
              </div>
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => set('contactEmail', e.target.value)}
                placeholder="contact@fournisseur.fr"
              />
            </div>
            <div>
              <Label>Adresse</Label>
              <Input
                value={formData.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Adresse complète"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SIRET</Label>
                <Input
                  value={formData.siret}
                  onChange={(e) => set('siret', e.target.value)}
                  placeholder="XXX XXX XXX XXXXX"
                />
              </div>
              <div>
                <Label>Site web</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => set('website', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={2}
                placeholder="Informations complémentaires..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== DIALOG SUPPRESSION ========== */}
      <Dialog
        open={!!supplierToDelete}
        onOpenChange={() => setSupplierToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le fournisseur «{' '}
              {supplierToDeleteData?.name} » ?
              {supplierToDeleteData && supplierToDeleteData.contractCount > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  ⚠️ Ce fournisseur est lié à{' '}
                  {supplierToDeleteData.contractCount} contrat
                  {supplierToDeleteData.contractCount > 1 ? 's' : ''}.
                  La suppression peut causer des incohérences.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSupplierToDelete(null)}
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
