import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  LayoutTemplate,
  AlertTriangle,
  Building2,
  Percent,
  Star,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Agency {
  id: string;
  code: string;
  name: string;
  city: string;
}

interface TemplateLine {
  agencyId: string;
  percentage: number;
  agency?: Agency;
}

interface DistributionTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  lines: TemplateLine[];
  createdAt: string;
}

const emptyForm = {
  name: '',
  description: '',
  isDefault: false,
  lines: [] as TemplateLine[],
};

export default function DistributionTemplatesPage() {
  const [templates, setTemplates] = useState<DistributionTemplate[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DistributionTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<DistributionTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tplData, agData] = await Promise.all([
        apiFetch('/distribution-templates'),
        apiFetch('/agencies'),
      ]);
      setTemplates(tplData);
      setAgencies(agData.filter((a: any) => a.isActive));
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return templates;
    const s = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(s) ||
        (t.description || '').toLowerCase().includes(s)
    );
  }, [templates, search]);

  const totalPercentage = useMemo(() => {
    return form.lines.reduce((sum, l) => sum + (l.percentage || 0), 0);
  }, [form.lines]);

  const handleAdd = () => {
    setEditingTemplate(null);
    setForm(emptyForm);
    setError('');
    setDialogOpen(true);
  };

  const handleEdit = (tpl: DistributionTemplate) => {
    setEditingTemplate(tpl);
    setForm({
      name: tpl.name,
      description: tpl.description || '',
      isDefault: tpl.isDefault,
      lines: tpl.lines.map((l) => ({
        agencyId: l.agencyId,
        percentage: l.percentage,
        agency: l.agency,
      })),
    });
    setError('');
    setDialogOpen(true);
  };

  const handleDeleteClick = (tpl: DistributionTemplate) => {
    setDeletingTemplate(tpl);
    setDeleteDialogOpen(true);
  };

  // Gestion des lignes
  const addLine = (agencyId: string) => {
    if (form.lines.find((l) => l.agencyId === agencyId)) return;
    const agency = agencies.find((a) => a.id === agencyId);
    setForm({
      ...form,
      lines: [...form.lines, { agencyId, percentage: 0, agency }],
    });
  };

  const updateLinePercentage = (agencyId: string, percentage: number) => {
    setForm({
      ...form,
      lines: form.lines.map((l) =>
        l.agencyId === agencyId ? { ...l, percentage } : l
      ),
    });
  };

  const removeLine = (agencyId: string) => {
    setForm({
      ...form,
      lines: form.lines.filter((l) => l.agencyId !== agencyId),
    });
  };

  const distributeEqually = () => {
    if (form.lines.length === 0) return;
    const pct = parseFloat((100 / form.lines.length).toFixed(2));
    const remainder = parseFloat((100 - pct * form.lines.length).toFixed(2));
    setForm({
      ...form,
      lines: form.lines.map((l, i) => ({
        ...l,
        percentage: i === 0 ? pct + remainder : pct,
      })),
    });
  };

  const addAllAgencies = () => {
    const newLines = agencies
      .filter((a) => !form.lines.find((l) => l.agencyId === a.id))
      .map((a) => ({ agencyId: a.id, percentage: 0, agency: a }));
    const allLines = [...form.lines, ...newLines];
    setForm({ ...form, lines: allLines });
  };

  const handleSave = async () => {
    if (!form.name) {
      setError('Le nom du modèle est obligatoire.');
      return;
    }
    if (form.lines.length === 0) {
      setError('Ajoutez au moins une agence.');
      return;
    }
    if (Math.abs(totalPercentage - 100) > 0.01) {
      setError(`Le total des pourcentages doit être 100% (actuellement ${totalPercentage.toFixed(2)}%).`);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        isDefault: form.isDefault,
        lines: form.lines.map((l) => ({
          agencyId: l.agencyId,
          percentage: l.percentage,
        })),
      };

      if (editingTemplate) {
        await apiFetch(`/distribution-templates/${editingTemplate.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/distribution-templates', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setDialogOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    try {
      await apiFetch(`/distribution-templates/${deletingTemplate.id}`, {
        method: 'DELETE',
      });
      setDeleteDialogOpen(false);
      setDeletingTemplate(null);
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la suppression.');
    }
  };

  const availableAgencies = agencies.filter(
    (a) => !form.lines.find((l) => l.agencyId === a.id)
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Modèles de ventilation</h1>
          <p className="text-slate-500 text-sm mt-1">
            Créez des modèles de répartition réutilisables pour les contrats et le budget
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau modèle
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <LayoutTemplate className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{templates.length}</p>
                <p className="text-xs text-slate-500">Modèles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {templates.filter((t) => t.isDefault).length}
                </p>
                <p className="text-xs text-slate-500">Par défaut</p>
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
                <p className="text-2xl font-bold text-slate-900">{agencies.length}</p>
                <p className="text-xs text-slate-500">Agences disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher un modèle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des modèles */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-slate-400">
              <LayoutTemplate className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun modèle de ventilation</p>
              <p className="text-sm mt-1">Créez-en un pour faciliter la répartition budgétaire</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((tpl) => (
            <Card key={tpl.id}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{tpl.name}</h3>
                      {tpl.isDefault && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Par défaut
                        </Badge>
                      )}
                    </div>
                    {tpl.description && (
                      <p className="text-sm text-slate-500 mt-1">{tpl.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(tpl)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteClick(tpl)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tpl.lines.map((line) => (
                    <Badge
                      key={line.agencyId}
                      variant="outline"
                      className="text-xs py-1 px-2"
                    >
                      {line.agency?.name || line.agencyId} — {line.percentage}%
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Ajout/Modification */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Modifier le modèle' : 'Nouveau modèle de ventilation'}
            </DialogTitle>
            <DialogDescription>
              Définissez la répartition par agence. Le total doit être égal à 100%.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Infos de base */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom du modèle *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Répartition standard"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description optionnelle"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 border rounded-xl p-3">
              <Switch
                checked={form.isDefault}
                onCheckedChange={(v) => setForm({ ...form, isDefault: v })}
              />
              <Label>Modèle par défaut</Label>
              <span className="text-xs text-slate-400 ml-2">
                (sera proposé en premier lors de la ventilation)
              </span>
            </div>

            {/* Actions rapides */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAllAgencies}
                disabled={availableAgencies.length === 0}
              >
                <Building2 className="h-3.5 w-3.5 mr-1" />
                Ajouter toutes les agences
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={distributeEqually}
                disabled={form.lines.length === 0}
              >
                <Percent className="h-3.5 w-3.5 mr-1" />
                Répartir équitablement
              </Button>
            </div>

            {/* Sélection agence */}
            {availableAgencies.length > 0 && (
              <div>
                <Label className="text-xs text-slate-500">Ajouter une agence</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {availableAgencies.map((a) => (
                    <Button
                      key={a.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => addLine(a.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {a.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Lignes de ventilation */}
            {form.lines.length > 0 && (
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agence</TableHead>
                      <TableHead className="w-32">Pourcentage</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.lines.map((line) => {
                      const agency =
                        line.agency || agencies.find((a) => a.id === line.agencyId);
                      return (
                        <TableRow key={line.agencyId}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{agency?.name}</p>
                              <p className="text-xs text-slate-400">
                                {agency?.code} — {agency?.city}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={line.percentage}
                                onChange={(e) =>
                                  updateLinePercentage(
                                    line.agencyId,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-24 text-right"
                              />
                              <span className="text-sm text-slate-400">%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500"
                              onClick={() => removeLine(line.agencyId)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div
                  className={`px-4 py-2 text-sm font-semibold flex justify-between ${
                    Math.abs(totalPercentage - 100) < 0.01
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  <span>Total</span>
                  <span>{totalPercentage.toFixed(2)}%</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? 'Enregistrement...'
                : editingTemplate
                ? 'Modifier'
                : 'Créer'}
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
            Êtes-vous sûr de vouloir supprimer le modèle{' '}
            <strong>{deletingTemplate?.name}</strong> ? Cette action est irréversible.
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
