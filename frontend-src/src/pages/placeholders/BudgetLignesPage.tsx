import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  TrendingUp,
  AlertTriangle,
  Building2,
  Percent,
  LayoutTemplate,
  FileText,
  Link2,
  Unlink,
  Euro,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Agency {
  id: string;
  code: string;
  name: string;
  city: string;
}

interface AgencyLine {
  agencyId: string;
  percentage: number;
  agency?: Agency;
}

interface DistributionTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  lines: { agencyId: string; percentage: number; agency: Agency }[];
}

interface ContractRef {
  id: string;
  reference: string;
  title: string;
}

interface BudgetLine {
  id: string;
  label: string;
  type: string;
  category: string;
  year: number;
  budgetHt: number;
  actualHt: number;
  vatRate: number;
  isRecurring: boolean;
  notes?: string;
  createdAt: string;
  linkedContracts?: { contract: ContractRef }[];
  agencies?: { agencyId: string; percentage: number; agency: Agency }[];
}

/* ------------------------------------------------------------------ */
/* Constantes                                                          */
/* ------------------------------------------------------------------ */

const TYPES = [
  { value: 'CONTRACT', label: 'Contrat' },
  { value: 'GIE', label: 'Cotisation GIE' },
  { value: 'INVESTMENT', label: 'Investissement' },
  { value: 'INTERNAL', label: 'Charge interne' },
  { value: 'OTHER', label: 'Autre' },
];

const CATEGORIES = [
  'Copieurs',
  'Matériels',
  'Maintenance',
  'Téléphonie',
  'Réseau-Télécom',
  'Licences-Logiciels',
  'Hébergement-Cloud',
  'Prestations',
  'Sécurité',
  'Cotisation GIE',
  'Infrastructure',
  'Autres',
];

const TYPE_COLORS: Record<string, string> = {
  CONTRACT: 'bg-blue-100 text-blue-700',
  GIE: 'bg-purple-100 text-purple-700',
  INVESTMENT: 'bg-amber-100 text-amber-700',
  INTERNAL: 'bg-slate-100 text-slate-600',
  OTHER: 'bg-gray-100 text-gray-600',
};

const TYPE_LABELS: Record<string, string> = {
  CONTRACT: 'Contrat',
  GIE: 'Cotisation GIE',
  INVESTMENT: 'Investissement',
  INTERNAL: 'Charge interne',
  OTHER: 'Autre',
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/* ------------------------------------------------------------------ */
/* Formulaire vide                                                     */
/* ------------------------------------------------------------------ */

const emptyForm = {
  label: '',
  type: 'CONTRACT',
  category: 'Maintenance',
  year: new Date().getFullYear(),
  budgetHt: 0,
  actualHt: 0,
  vatRate: 20,
  isRecurring: false,
  notes: '',
};

/* ================================================================== */
/* Composant principal                                                 */
/* ================================================================== */

export default function BudgetLignesPage() {
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [allContracts, setAllContracts] = useState<ContractRef[]>([]);
  const [allAgencies, setAllAgencies] = useState<Agency[]>([]);
  const [templates, setTemplates] = useState<DistributionTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterType, setFilterType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<BudgetLine | null>(null);
  const [deletingLine, setDeletingLine] = useState<BudgetLine | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [linkedContractIds, setLinkedContractIds] = useState<string[]>([]);
  const [agencyLines, setAgencyLines] = useState<AgencyLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  /* ---------------------------------------------------------------- */
  /* Chargement des données                                            */
  /* ---------------------------------------------------------------- */

  const fetchLines = async (year?: number) => {
    try {
      setLoading(true);
      const y = year || filterYear;
      const data = await apiFetch(`/budget?year=${y}`);
      setLines(data);
    } catch (err) {
      console.error('Erreur chargement budget:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchYears = async () => {
    try {
      const data = await apiFetch('/budget/years');
      const currentYear = new Date().getFullYear();
      const years = data.length > 0 ? data : [currentYear];
      if (!years.includes(currentYear)) years.unshift(currentYear);
      setAvailableYears(years.sort((a: number, b: number) => b - a));
    } catch {
      setAvailableYears([new Date().getFullYear()]);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [contractsData, agenciesData, tplData] = await Promise.all([
        apiFetch('/contracts'),
        apiFetch('/agencies'),
        apiFetch('/distribution-templates'),
      ]);
      setAllContracts(
        contractsData.map((c: any) => ({
          id: c.id,
          reference: c.reference,
          title: c.title,
        }))
      );
      setAllAgencies(agenciesData.filter((a: any) => a.isActive));
      setTemplates(tplData);
    } catch (err) {
      console.error('Erreur chargement données de référence:', err);
    }
  };

  useEffect(() => {
    fetchYears();
    fetchReferenceData();
  }, []);

  useEffect(() => {
    fetchLines(filterYear);
  }, [filterYear]);

  /* ---------------------------------------------------------------- */
  /* Filtrage                                                          */
  /* ---------------------------------------------------------------- */

  const filtered = useMemo(() => {
    return lines.filter((l) => {
      const matchSearch =
        !search ||
        l.label.toLowerCase().includes(search.toLowerCase()) ||
        l.category.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'ALL' || l.type === filterType;
      const matchCat = filterCategory === 'ALL' || l.category === filterCategory;
      return matchSearch && matchType && matchCat;
    });
  }, [lines, search, filterType, filterCategory]);

  /* ---------------------------------------------------------------- */
  /* KPIs                                                              */
  /* ---------------------------------------------------------------- */

  const stats = useMemo(() => {
    const totalBudget = lines.reduce((s, l) => s + l.budgetHt, 0);
    const totalActual = lines.reduce((s, l) => s + l.actualHt, 0);
    const variance = totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) * 100 : 0;
    const byType = TYPES.map((t) => ({
      ...t,
      total: lines.filter((l) => l.type === t.value).reduce((s, l) => s + l.budgetHt, 0),
    }));
    return { totalBudget, totalActual, variance, count: lines.length, byType };
  }, [lines]);

  /* ---------------------------------------------------------------- */
  /* Ventilation agences                                               */
  /* ---------------------------------------------------------------- */

  const totalPercentage = useMemo(() => {
    return agencyLines.reduce((s, l) => s + (l.percentage || 0), 0);
  }, [agencyLines]);

  const availableAgencies = allAgencies.filter(
    (a) => !agencyLines.find((l) => l.agencyId === a.id)
  );

  const addAgencyLine = (agencyId: string) => {
    const agency = allAgencies.find((a) => a.id === agencyId);
    if (!agency || agencyLines.find((l) => l.agencyId === agencyId)) return;
    setAgencyLines([...agencyLines, { agencyId, percentage: 0, agency }]);
  };

  const updateAgencyPercentage = (agencyId: string, percentage: number) => {
    setAgencyLines(
      agencyLines.map((l) => (l.agencyId === agencyId ? { ...l, percentage } : l))
    );
  };

  const removeAgencyLine = (agencyId: string) => {
    setAgencyLines(agencyLines.filter((l) => l.agencyId !== agencyId));
  };

  const distributeEqually = () => {
    if (agencyLines.length === 0) return;
    const pct = parseFloat((100 / agencyLines.length).toFixed(2));
    const remainder = parseFloat((100 - pct * agencyLines.length).toFixed(2));
    setAgencyLines(
      agencyLines.map((l, i) => ({
        ...l,
        percentage: i === 0 ? pct + remainder : pct,
      }))
    );
  };

  const addAllAgencies = () => {
    const newLines = allAgencies
      .filter((a) => !agencyLines.find((l) => l.agencyId === a.id))
      .map((a) => ({ agencyId: a.id, percentage: 0, agency: a }));
    setAgencyLines([...agencyLines, ...newLines]);
  };

  const applyTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    setAgencyLines(
      tpl.lines.map((l) => ({
        agencyId: l.agencyId,
        percentage: l.percentage,
        agency: l.agency,
      }))
    );
  };

  /* ---------------------------------------------------------------- */
  /* Contrats liés                                                     */
  /* ---------------------------------------------------------------- */

  const toggleContract = (contractId: string) => {
    setLinkedContractIds((prev) =>
      prev.includes(contractId)
        ? prev.filter((id) => id !== contractId)
        : [...prev, contractId]
    );
  };

  /* ---------------------------------------------------------------- */
  /* Dialog open / close                                               */
  /* ---------------------------------------------------------------- */

  const handleAdd = () => {
    setEditingLine(null);
    setForm({ ...emptyForm, year: filterYear });
    setLinkedContractIds([]);
    setAgencyLines([]);
    setError('');
    setDialogOpen(true);
  };

  const handleEdit = (line: BudgetLine) => {
    setEditingLine(line);
    setForm({
      label: line.label,
      type: line.type,
      category: line.category,
      year: line.year,
      budgetHt: line.budgetHt,
      actualHt: line.actualHt,
      vatRate: line.vatRate,
      isRecurring: line.isRecurring,
      notes: line.notes || '',
    });
    setLinkedContractIds(
      line.linkedContracts?.map((lc) => lc.contract.id) || []
    );
    setAgencyLines(
      line.agencies?.map((a) => ({
        agencyId: a.agencyId,
        percentage: a.percentage,
        agency: a.agency,
      })) || []
    );
    setError('');
    setDialogOpen(true);
  };

  const handleDeleteClick = (line: BudgetLine) => {
    setDeletingLine(line);
    setDeleteDialogOpen(true);
  };

  /* ---------------------------------------------------------------- */
  /* CRUD                                                              */
  /* ---------------------------------------------------------------- */

  const handleSave = async () => {
    if (!form.label) {
      setError('Le libellé est obligatoire.');
      return;
    }
    if (agencyLines.length > 0 && Math.abs(totalPercentage - 100) > 0.01) {
      setError(
        `Le total de la ventilation doit être 100% (actuellement ${totalPercentage.toFixed(2)}%).`
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        linkedContractIds,
        agencies: agencyLines.map((l) => ({
          agencyId: l.agencyId,
          percentage: l.percentage,
        })),
      };

      if (editingLine) {
        await apiFetch(`/budget/${editingLine.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/budget', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setDialogOpen(false);
      await fetchLines();
      await fetchYears();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLine) return;
    try {
      await apiFetch(`/budget/${deletingLine.id}`, { method: 'DELETE' });
      setDeleteDialogOpen(false);
      setDeletingLine(null);
      await fetchLines();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la suppression.');
    }
  };

  /* ---------------------------------------------------------------- */
  /* Rendu                                                             */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Lignes budgétaires
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestion détaillée du budget DSI — Exercice {filterYear}
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle ligne
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.count}</p>
                <p className="text-xs text-slate-500">Lignes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Euro className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(stats.totalBudget)}
                </p>
                <p className="text-xs text-slate-500">Budget HT</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(stats.totalActual)}
                </p>
                <p className="text-xs text-slate-500">Réalisé HT</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  stats.variance <= 0 ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <Percent
                  className={`h-5 w-5 ${
                    stats.variance <= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                />
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${
                    stats.variance <= 0 ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {stats.variance > 0 ? '+' : ''}
                  {stats.variance.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500">Écart</p>
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
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={String(filterYear)}
              onValueChange={(v) => setFilterYear(Number(v))}
            >
              <SelectTrigger className="w-[130px]">
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
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les types</SelectItem>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes catégories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
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
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune ligne budgétaire</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Budget HT</TableHead>
                  <TableHead className="text-right">Réalisé HT</TableHead>
                  <TableHead className="text-right">Écart</TableHead>
                  <TableHead className="text-center">Agences</TableHead>
                  <TableHead className="text-center">Contrats</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((line) => {
                  const ecart = line.actualHt - line.budgetHt;
                  const ecartPct =
                    line.budgetHt > 0
                      ? ((ecart / line.budgetHt) * 100).toFixed(1)
                      : '—';
                  return (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{line.label}</p>
                          {line.isRecurring && (
                            <Badge
                              variant="outline"
                              className="text-[10px] mt-0.5"
                            >
                              Récurrent
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={TYPE_COLORS[line.type] || ''}>
                          {TYPE_LABELS[line.type] || line.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {line.category}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(line.budgetHt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.actualHt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-medium ${
                            ecart <= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {ecart > 0 ? '+' : ''}
                          {formatCurrency(ecart)}
                          {ecartPct !== '—' && (
                            <span className="text-xs ml-1">({ecartPct}%)</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {line.agencies && line.agencies.length > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            {line.agencies.length}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {line.linkedContracts &&
                        line.linkedContracts.length > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            <Link2 className="h-3 w-3 mr-1" />
                            {line.linkedContracts.length}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(line)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteClick(line)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Ligne de total */}
                <TableRow className="bg-slate-50 font-semibold">
                  <TableCell colSpan={3} className="text-right text-sm">
                    Total ({filtered.length} ligne{filtered.length > 1 ? 's' : ''})
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(
                      filtered.reduce((s, l) => s + l.budgetHt, 0)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(
                      filtered.reduce((s, l) => s + l.actualHt, 0)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {(() => {
                      const tBudget = filtered.reduce(
                        (s, l) => s + l.budgetHt,
                        0
                      );
                      const tActual = filtered.reduce(
                        (s, l) => s + l.actualHt,
                        0
                      );
                      const tEcart = tActual - tBudget;
                      return (
                        <span
                          className={
                            tEcart <= 0 ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {tEcart > 0 ? '+' : ''}
                          {formatCurrency(tEcart)}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Dialog Ajout / Modification                                   */}
      {/* ============================================================ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLine
                ? 'Modifier la ligne budgétaire'
                : 'Nouvelle ligne budgétaire'}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations, liez des contrats et ventiler par
              agence si nécessaire.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Infos de base */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Libellé *</Label>
                <Input
                  value={form.label}
                  onChange={(e) =>
                    setForm({ ...form, label: e.target.value })
                  }
                  placeholder="Ex: Cotisation GIE informatique groupe"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Catégorie</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Montants */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Exercice</Label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) =>
                    setForm({ ...form, year: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Budget HT (€)</Label>
                <Input
                  type="number"
                  value={form.budgetHt}
                  onChange={(e) =>
                    setForm({ ...form, budgetHt: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Réalisé HT (€)</Label>
                <Input
                  type="number"
                  value={form.actualHt}
                  onChange={(e) =>
                    setForm({ ...form, actualHt: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>TVA (%)</Label>
                <Input
                  type="number"
                  value={form.vatRate}
                  onChange={(e) =>
                    setForm({ ...form, vatRate: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            {/* Récurrent */}
            <div className="flex items-center gap-2 border rounded-xl p-3">
              <Switch
                checked={form.isRecurring}
                onCheckedChange={(v) =>
                  setForm({ ...form, isRecurring: v })
                }
              />
              <Label>Charge récurrente</Label>
              <span className="text-xs text-slate-400 ml-2">
                (sera reconduite automatiquement à l'exercice suivant)
              </span>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
                rows={2}
                placeholder="Commentaires..."
              />
            </div>

            {/* ====================================================== */}
            {/* Contrats liés                                           */}
            {/* ====================================================== */}
            <div className="border rounded-xl p-4 space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Link2 className="h-4 w-4 text-blue-600" />
                Contrats liés ({linkedContractIds.length})
              </Label>
              {allContracts.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {allContracts.map((c) => {
                    const linked = linkedContractIds.includes(c.id);
                    return (
                      <Button
                        key={c.id}
                        type="button"
                        variant={linked ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs"
                        onClick={() => toggleContract(c.id)}
                      >
                        {linked ? (
                          <Unlink className="h-3 w-3 mr-1" />
                        ) : (
                          <Link2 className="h-3 w-3 mr-1" />
                        )}
                        {c.reference} — {c.title}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Aucun contrat disponible
                </p>
              )}
            </div>

            {/* ====================================================== */}
            {/* Ventilation par agence                                  */}
            {/* ====================================================== */}
            <div className="border rounded-xl p-4 space-y-4">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                Ventilation par agence
              </Label>

              {/* Modèles */}
              {templates.length > 0 && (
                <div>
                  <Label className="text-xs text-slate-500">
                    Appliquer un modèle
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {templates.map((tpl) => (
                      <Button
                        key={tpl.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => applyTemplate(tpl.id)}
                      >
                        <LayoutTemplate className="h-3 w-3 mr-1" />
                        {tpl.name}
                        {tpl.isDefault && (
                          <Badge className="ml-1 bg-amber-100 text-amber-700 text-[10px] px-1">
                            défaut
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

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
                  Ajouter toutes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={distributeEqually}
                  disabled={agencyLines.length === 0}
                >
                  <Percent className="h-3.5 w-3.5 mr-1" />
                  Répartir équitablement
                </Button>
              </div>

              {/* Sélection agence */}
              {availableAgencies.length > 0 && (
                <Select onValueChange={addAgencyLine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ajouter une agence..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAgencies.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.code} — {a.name} ({a.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Tableau des lignes */}
              {agencyLines.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agence</TableHead>
                        <TableHead className="w-32">%</TableHead>
                        <TableHead className="w-32 text-right">
                          Montant HT
                        </TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agencyLines.map((line) => {
                        const agency =
                          line.agency ||
                          allAgencies.find((a) => a.id === line.agencyId);
                        const lineAmount =
                          (form.budgetHt * (line.percentage || 0)) / 100;
                        return (
                          <TableRow key={line.agencyId}>
                            <TableCell>
                              <p className="font-medium text-sm">
                                {agency?.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {agency?.code} — {agency?.city}
                              </p>
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
                                    updateAgencyPercentage(
                                      line.agencyId,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-24 text-right"
                                />
                                <span className="text-sm text-slate-400">
                                  %
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium text-slate-700">
                              {formatCurrency(lineAmount)}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-500"
                                onClick={() =>
                                  removeAgencyLine(line.agencyId)
                                }
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
                    <div className="flex gap-6">
                      <span>{totalPercentage.toFixed(2)}%</span>
                      <span>{formatCurrency(form.budgetHt)}</span>
                    </div>
                  </div>
                </div>
              )}

              {agencyLines.length === 0 && (
                <div className="text-center py-4 text-slate-400 border rounded-lg border-dashed">
                  <Building2 className="h-6 w-6 mx-auto mb-1 opacity-30" />
                  <p className="text-xs">
                    Aucune ventilation — optionnel
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? 'Enregistrement...'
                : editingLine
                ? 'Modifier'
                : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* Dialog Suppression                                            */}
      {/* ============================================================ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Êtes-vous sûr de vouloir supprimer la ligne{' '}
            <strong>{deletingLine?.label}</strong> ? Cette action est
            irréversible.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
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
