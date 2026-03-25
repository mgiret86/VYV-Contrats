import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useBudget,
  BUDGET_TYPE_CONFIG,
  BUDGET_CATEGORIES,
  type BudgetLineType,
} from '@/contexts/BudgetContext';
import { useContracts } from '@/contexts/ContractsContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Link2,
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

// ============================================================
// COMPOSANT
// ============================================================

export default function BudgetLignesPage() {
  const navigate = useNavigate();
  const {
    budgetLines,
    addBudgetLine,
    updateBudgetLine,
    deleteBudgetLine,
    availableYears,
  } = useBudget();
  const { contracts } = useContracts();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(
    availableYears.includes(currentYear) ? currentYear : availableYears[0]
  );
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<string | null>(null);
  const [lineToDelete, setLineToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    label: '',
    type: 'OTHER' as BudgetLineType,
    category: 'Divers',
    budgetHt: 0,
    actualHt: 0,
    vatRate: 20,
    notes: '',
    isRecurring: false,
    linkedContractId: '',
  });

  // ===== Données filtrées =====
  const yearLines = useMemo(
    () => budgetLines.filter((l) => l.year === selectedYear),
    [budgetLines, selectedYear]
  );

  const filtered = useMemo(() => {
    return yearLines.filter((l) => {
      const matchSearch = l.label
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchType = filterType === 'ALL' || l.type === filterType;
      const matchCat =
        filterCategory === 'ALL' || l.category === filterCategory;
      return matchSearch && matchType && matchCat;
    });
  }, [yearLines, search, filterType, filterCategory]);

  // ===== Totaux =====
  const totals = useMemo(() => {
    const budget = filtered.reduce((s, l) => s + l.budgetHt, 0);
    const actual = filtered.reduce((s, l) => s + l.actualHt, 0);
    const remaining = budget - actual;
    const pct = budget > 0 ? (actual / budget) * 100 : 0;
    return { budget, actual, remaining, pct };
  }, [filtered]);

  const yearTotals = useMemo(() => {
    const budget = yearLines.reduce((s, l) => s + l.budgetHt, 0);
    const actual = yearLines.reduce((s, l) => s + l.actualHt, 0);
    return { budget, actual, remaining: budget - actual };
  }, [yearLines]);

  // ===== Catégories dynamiques =====
  const yearCategories = useMemo(
    () => Array.from(new Set(yearLines.map((l) => l.category))).sort(),
    [yearLines]
  );

  // ===== Types dynamiques =====
  const yearTypes = useMemo(
    () => Array.from(new Set(yearLines.map((l) => l.type))),
    [yearLines]
  );

  // ===== CRUD =====
  const openCreate = () => {
    setEditingLine(null);
    setFormData({
      label: '',
      type: 'OTHER',
      category: 'Divers',
      budgetHt: 0,
      actualHt: 0,
      vatRate: 20,
      notes: '',
      isRecurring: false,
      linkedContractId: 'NONE',
    });
    setIsDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const l = budgetLines.find((line) => line.id === id);
    if (!l) return;
    setEditingLine(id);
    setFormData({
      label: l.label,
      type: l.type,
      category: l.category,
      budgetHt: l.budgetHt,
      actualHt: l.actualHt,
      vatRate: l.vatRate,
      notes: l.notes || '',
      isRecurring: l.isRecurring,
      linkedContractId: l.linkedContractIds[0] || 'NONE',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.label || formData.budgetHt <= 0) return;

    const data = {
      label: formData.label,
      type: formData.type,
      category: formData.category,
      budgetHt: formData.budgetHt,
      actualHt: formData.actualHt,
      vatRate: formData.vatRate,
      notes: formData.notes || null,
      isRecurring: formData.isRecurring,
      linkedContractIds: formData.linkedContractId && formData.linkedContractId !== 'NONE'
  ? [formData.linkedContractId]
  : [],

    };

    if (editingLine) {
      await updateBudgetLine(editingLine, data);
    } else {
      await addBudgetLine({
        ...data,
        year: selectedYear,
      });
    }

    setIsDialogOpen(false);
    setEditingLine(null);
  };

  const handleDelete = () => {
    if (lineToDelete) {
      deleteBudgetLine(lineToDelete);
      setLineToDelete(null);
    }
  };

  const lineToDeleteData = lineToDelete
    ? budgetLines.find((l) => l.id === lineToDelete)
    : null;

  const set = (key: string, value: string | number | boolean) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  // ========== RENDU ==========
  return (
    <div className="space-y-6">
      {/* ===== EN-TÊTE ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Lignes budgétaires
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {yearLines.length} ligne{yearLines.length > 1 ? 's' : ''} pour{' '}
            {selectedYear} · Budget total :{' '}
            {formatCurrency(yearTotals.budget)}
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
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle ligne
          </Button>
        </div>
      </div>

      {/* ===== KPIs ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-100">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-blue-600 font-medium">
              Budget prévisionnel
            </p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {formatCurrency(yearTotals.budget)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-100">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-green-600 font-medium">Réalisé</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {formatCurrency(yearTotals.actual)}
            </p>
            <div className="w-full bg-green-200 rounded-full h-1.5 mt-2">
              <div
                className="h-1.5 rounded-full bg-green-500 transition-all"
                style={{
                  width: `${Math.min(100, (yearTotals.actual / yearTotals.budget) * 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
        <Card
          className={`bg-gradient-to-br ${
            yearTotals.remaining >= 0
              ? 'from-emerald-50 to-emerald-100/50 border-emerald-100'
              : 'from-red-50 to-red-100/50 border-red-100'
          }`}
        >
          <CardContent className="pt-5 pb-4">
            <p
              className={`text-sm font-medium ${
                yearTotals.remaining >= 0
                  ? 'text-emerald-600'
                  : 'text-red-600'
              }`}
            >
              {yearTotals.remaining >= 0
                ? 'Reste à consommer'
                : 'Dépassement'}
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                yearTotals.remaining >= 0
                  ? 'text-emerald-700'
                  : 'text-red-700'
              }`}
            >
              {formatCurrency(Math.abs(yearTotals.remaining))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ===== FILTRES ===== */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher une ligne budgétaire…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tous types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous types</SelectItem>
            {yearTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {BUDGET_TYPE_CONFIG[t].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Toutes catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes catégories</SelectItem>
            {yearCategories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterType !== 'ALL' ||
          filterCategory !== 'ALL' ||
          search) && (
          <button
            onClick={() => {
              setFilterType('ALL');
              setFilterCategory('ALL');
              setSearch('');
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* ===== TABLEAU ===== */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Catégorie
                  </TableHead>
                  <TableHead className="text-right">Budget HT</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
                    Réalisé HT
                  </TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
                    Écart
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Consommation
                  </TableHead>
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
                      Aucune ligne budgétaire trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((line) => {
                    const pct =
                      line.budgetHt > 0
                        ? (line.actualHt / line.budgetHt) * 100
                        : 0;
                    const ecart = line.budgetHt - line.actualHt;
                    const typeCfg = BUDGET_TYPE_CONFIG[line.type];
                    const hasContract = line.linkedContractIds.length > 0;

                    return (
                      <TableRow key={line.id} className="group">
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 truncate max-w-[300px]">
                                {line.label}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                {line.isRecurring && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] px-1 py-0"
                                  >
                                    Récurrent
                                  </Badge>
                                )}
                                {hasContract && (
                                  <Badge
                                    className="text-[9px] px-1 py-0 bg-blue-50 text-blue-600 cursor-pointer hover:bg-blue-100"
                                    onClick={() =>
                                      navigate(
                                        `/contrats/${line.linkedContractIds[0]}`
                                      )
                                    }
                                  >
                                    <Link2 className="h-2.5 w-2.5 mr-0.5" />
                                    Contrat lié
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge className={typeCfg.className}>
                            {typeCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-slate-600">
                          {line.category}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-800">
                          {formatCurrency(line.budgetHt)}
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell font-medium">
                          {formatCurrency(line.actualHt)}
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell">
                          <span
                            className={`flex items-center justify-end gap-1 text-sm font-medium ${
                              ecart > 0
                                ? 'text-green-600'
                                : ecart < 0
                                  ? 'text-red-600'
                                  : 'text-slate-400'
                            }`}
                          >
                            {ecart > 0 ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : ecart < 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                            {formatCurrency(Math.abs(ecart))}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${consumptionBarColor(pct)}`}
                                style={{
                                  width: `${Math.min(100, pct)}%`,
                                }}
                              />
                            </div>
                            <span
                              className={`text-xs font-medium w-10 text-right ${consumptionColor(pct)}`}
                            >
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Modifier"
                              onClick={() => openEdit(line.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Supprimer"
                              onClick={() => setLineToDelete(line.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              {filtered.length > 0 && (
                <TableFooter>
                  <TableRow className="font-bold">
                    <TableCell colSpan={3}>
                      Total ({filtered.length} ligne
                      {filtered.length > 1 ? 's' : ''})
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totals.budget)}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {formatCurrency(totals.actual)}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      <span
                        className={
                          totals.remaining >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {formatCurrency(Math.abs(totals.remaining))}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={consumptionColor(totals.pct)}>
                        {totals.pct.toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===== DIALOG CRÉATION / ÉDITION ===== */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingLine
                ? 'Modifier la ligne budgétaire'
                : 'Nouvelle ligne budgétaire'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Libellé *</Label>
              <Input
                value={formData.label}
                onChange={(e) => set('label', e.target.value)}
                placeholder="Ex: Cotisation GIE Informatique"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => set('type', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BUDGET_TYPE_CONFIG).map(
                      ([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          {cfg.label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Catégorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => set('category', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Budget HT (€) *</Label>
                <Input
                  type="number"
                  value={formData.budgetHt}
                  onChange={(e) => set('budgetHt', Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Réalisé HT (€)</Label>
                <Input
                  type="number"
                  value={formData.actualHt}
                  onChange={(e) => set('actualHt', Number(e.target.value))}
                />
              </div>
              <div>
                <Label>TVA (%)</Label>
                <Input
                  type="number"
                  value={formData.vatRate}
                  onChange={(e) => set('vatRate', Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label>Contrat lié (optionnel)</Label>
              <Select
                value={formData.linkedContractId}
                onValueChange={(v) => set('linkedContractId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucun contrat lié" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Aucun</SelectItem>
                  {contracts.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.reference} — {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.isRecurring}
                onCheckedChange={(v) => set('isRecurring', v)}
              />
              <Label>Ligne récurrente (se répète chaque année)</Label>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={2}
                placeholder="Informations complémentaires…"
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

      {/* ===== DIALOG SUPPRESSION ===== */}
      <Dialog
        open={!!lineToDelete}
        onOpenChange={() => setLineToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la ligne «{' '}
              {lineToDeleteData?.label} » ({formatCurrency(lineToDeleteData?.budgetHt || 0)}) ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLineToDelete(null)}
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
