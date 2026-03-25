import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Building2,
  MapPin,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Agency {
  id: string;
  code: string;
  name: string;
  city: string;
  address?: string;
  region?: string;
  managerName?: string;
  managerEmail?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  _count?: { contracts: number };
}

const REGIONS = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  "Provence-Alpes-Côte d'Azur",
];

const emptyForm = {
  code: '',
  name: '',
  city: '',
  address: '',
  region: '',
  managerName: '',
  managerEmail: '',
  phone: '',
  isActive: true,
};

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [deletingAgency, setDeletingAgency] = useState<Agency | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Charger les agences
  const fetchAgencies = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/agencies');
      setAgencies(data);
    } catch (err) {
      console.error('Erreur chargement agences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  // Filtrage
  const filtered = useMemo(() => {
    return agencies.filter((a) => {
      const matchSearch =
        !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.code.toLowerCase().includes(search.toLowerCase()) ||
        a.city.toLowerCase().includes(search.toLowerCase());
      const matchRegion = filterRegion === 'ALL' || a.region === filterRegion;
      return matchSearch && matchRegion;
    });
  }, [agencies, search, filterRegion]);

  // Stats
  const stats = useMemo(() => {
    const active = agencies.filter((a) => a.isActive).length;
    const totalContracts = agencies.reduce((sum, a) => sum + (a._count?.contracts || 0), 0);
    const regions = new Set(agencies.map((a) => a.region).filter(Boolean)).size;
    return { total: agencies.length, active, totalContracts, regions };
  }, [agencies]);

  // Ouvrir le dialog
  const handleAdd = () => {
    setEditingAgency(null);
    setForm(emptyForm);
    setError('');
    setDialogOpen(true);
  };

  const handleEdit = (agency: Agency) => {
    setEditingAgency(agency);
    setForm({
      code: agency.code,
      name: agency.name,
      city: agency.city,
      address: agency.address || '',
      region: agency.region || '',
      managerName: agency.managerName || '',
      managerEmail: agency.managerEmail || '',
      phone: agency.phone || '',
      isActive: agency.isActive,
    });
    setError('');
    setDialogOpen(true);
  };

  const handleDeleteClick = (agency: Agency) => {
    setDeletingAgency(agency);
    setDeleteDialogOpen(true);
  };

  // Sauvegarder
  const handleSave = async () => {
    if (!form.code || !form.name || !form.city) {
      setError('Les champs Code, Nom et Ville sont obligatoires.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingAgency) {
        await apiFetch(`/agencies/${editingAgency.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch('/agencies', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      setDialogOpen(false);
      await fetchAgencies();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  // Supprimer
  const handleDelete = async () => {
    if (!deletingAgency) return;
    try {
      await apiFetch(`/agencies/${deletingAgency.id}`, { method: 'DELETE' });
      setDeleteDialogOpen(false);
      setDeletingAgency(null);
      await fetchAgencies();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la suppression.');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agences</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestion des agences et sites de l'entreprise
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle agence
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500">Agences</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
                <p className="text-xs text-slate-500">Actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.regions}</p>
                <p className="text-xs text-slate-500">Régions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalContracts}</p>
                <p className="text-xs text-slate-500">Contrats liés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par nom, code ou ville..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les régions</SelectItem>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune agence trouvée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Région</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead className="text-center">Contrats</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell className="font-mono text-xs font-semibold text-blue-700">
                      {agency.code}
                    </TableCell>
                    <TableCell className="font-medium">{agency.name}</TableCell>
                    <TableCell>{agency.city}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {agency.region || '—'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{agency.managerName || '—'}</p>
                        {agency.managerEmail && (
                          <p className="text-xs text-slate-400">{agency.managerEmail}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{agency._count?.contracts || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          agency.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }
                      >
                        {agency.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(agency)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteClick(agency)}
                          disabled={(agency._count?.contracts || 0) > 0}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Ajout/Modification */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAgency ? 'Modifier l\'agence' : 'Nouvelle agence'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="AG-LYO"
                  disabled={!!editingAgency}
                />
              </div>
              <div>
                <Label>Nom *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Agence Lyon"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ville *</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Lyon"
                />
              </div>
              <div>
                <Label>Région</Label>
                <Select
                  value={form.region}
                  onValueChange={(v) => setForm({ ...form, region: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Adresse</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="15 rue de la Santé"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Responsable</Label>
                <Input
                  value={form.managerName}
                  onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <Label>Email responsable</Label>
                <Input
                  type="email"
                  value={form.managerEmail}
                  onChange={(e) => setForm({ ...form, managerEmail: e.target.value })}
                  placeholder="j.dupont@vyv-ambulance.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Téléphone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="01 23 45 67 89"
                />
              </div>
              <div className="flex items-end pb-1">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                  />
                  <Label>Agence active</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement...' : editingAgency ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Êtes-vous sûr de vouloir supprimer l'agence{' '}
            <strong>{deletingAgency?.name}</strong> ({deletingAgency?.code}) ?
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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
