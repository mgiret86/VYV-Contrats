import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContracts } from '@/contexts/ContractsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Building2,
  Percent,
  LayoutTemplate,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Agency {
  id: string;
  code: string;
  name: string;
  city: string;
}

interface DistributionTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  lines: { agencyId: string; percentage: number; agency: Agency }[];
}

interface AgencyLine {
  agencyId: string;
  percentage: number;
  agency?: Agency;
}

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
  'Autres',
];

const STATUSES = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'RENEWING', label: 'En renouvellement' },
  { value: 'DENOUNCED', label: 'Dénoncé' },
  { value: 'EXPIRED', label: 'Expiré' },
  { value: 'NEGOTIATING', label: 'En négociation' },
  { value: 'TO_TRANSFER', label: 'À transférer' },
  { value: 'TRANSFERRING', label: 'En cours de transfert' },
];

const PERIODS = [
  { value: 'MONTHLY', label: 'Mensuel' },
  { value: 'QUARTERLY', label: 'Trimestriel' },
  { value: 'ANNUAL', label: 'Annuel' },
  { value: 'ONE_TIME', label: 'Ponctuel' },
];

const SCOPES = [
  { value: 'SINGLE_AGENCY', label: 'Agence unique' },
  { value: 'MULTI_AGENCY', label: 'Multi-agences' },
  { value: 'ALL_AGENCIES', label: 'Toutes agences' },
];

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ContractFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contracts, suppliers, addContract, updateContract } = useContracts();
  const isEditing = Boolean(id);
  const existing = id ? contracts.find((c) => c.id === id) : null;

  // Agences et templates
  const [allAgencies, setAllAgencies] = useState<Agency[]>([]);
  const [templates, setTemplates] = useState<DistributionTemplate[]>([]);
  const [leasers, setLeasers] = useState<{id:string;name:string}[]>([]);
  const [articles, setArticles] = useState<{designation:string;quantity:number;agencyId:string}[]>([]);
  const [agencyLines, setAgencyLines] = useState<AgencyLine[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [agData, tplData, lsrData] = await Promise.all([
          apiFetch('/agencies'),
          apiFetch('/distribution-templates'),
          apiFetch('/leasers'),
        ]);
        setAllAgencies(agData.filter((a: any) => a.isActive));
        setTemplates(tplData);
        setLeasers(lsrData);
      } catch (err) {
        console.error('Erreur chargement agences/templates:', err);
      }
    };
    loadData();
  }, []);

  const nextRef = useMemo(() => {
    const year = new Date().getFullYear();
    const num = String(contracts.length + 1).padStart(4, '0');
    return `CTR-${year}-${num}`;
  }, [contracts.length]);

  const [form, setForm] = useState({
    title: '',
    category: 'Maintenance',
    status: 'ACTIVE',
    scope: 'ALL_AGENCIES',
    supplierId: '',
    supplierReference: '',
    startDate: '',
    endDate: '',
    autoRenewal: false,
    renewalDuration: 12,
    renewalUnit: 'mois',
    noticePeriod: 3,
    noticePeriodUnit: 'mois',
    amountHt: 0,
    vatRate: 20,
    billingPeriod: 'ANNUAL',
    tariffRevision: '',
    notes: '',
    leaserId: '',
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title || '',
        category: existing.category || 'Maintenance',
        status: existing.status || 'ACTIVE',
        scope: existing.scope || 'ALL_AGENCIES',
        supplierId: existing.supplierId || '',
        supplierReference: existing.supplierReference || '',
        startDate: existing.startDate || '',
        endDate: existing.endDate || '',
        autoRenewal: existing.autoRenewal || false,
        renewalDuration: existing.renewalDuration || 12,
        renewalUnit: existing.renewalUnit || 'mois',
        noticePeriod: existing.noticePeriod || 3,
        noticePeriodUnit: existing.noticePeriodUnit || 'mois',
        amountHt: existing.amountHt || 0,
        vatRate: existing.vatRate || 20,
        billingPeriod: existing.billingPeriod || 'ANNUAL',
        tariffRevision: existing.tariffRevision || '',
        notes: existing.notes || '',
        leaserId: existing.leaserId || '',
      });

      // Charger les articles liés au contrat
      if (existing.articles && Array.isArray(existing.articles)) {
        setArticles(existing.articles.map((a: any) => ({
          designation: a.designation || '',
          quantity: a.quantity || 1,
          agencyId: a.agencyId || '',
        })));
      }

      // Charger les agences liées au contrat existant
      const details = (existing as any).agencyDetails;
      if (details && Array.isArray(details) && details.length > 0) {
        setAgencyLines(
          details.map((d: any) => ({
            agencyId: d.agencyId,
            percentage: d.percentage || 0,
            agency: { id: d.agencyId, code: d.agencyCode, name: d.agencyName, city: d.agencyCity },
          }))
        );
      }
    }
  }, [existing]);

  // Ventilation helpers
  const totalPercentage = useMemo(() => {
    return agencyLines.reduce((sum, l) => sum + (l.percentage || 0), 0);
  }, [agencyLines]);

  const showVentilation =
    form.scope === 'MULTI_AGENCY' || form.scope === 'SINGLE_AGENCY';

  const availableAgencies = allAgencies.filter(
    (a) => !agencyLines.find((l) => l.agencyId === a.id)
  );

  const addAgencyLine = (agencyId: string) => {
    const agency = allAgencies.find((a) => a.id === agencyId);
    if (!agency || agencyLines.find((l) => l.agencyId === agencyId)) return;

    if (form.scope === 'SINGLE_AGENCY') {
      // En agence unique, remplacer
      setAgencyLines([{ agencyId, percentage: 100, agency }]);
    } else {
      setAgencyLines([...agencyLines, { agencyId, percentage: 0, agency }]);
    }
  };

  const updateAgencyPercentage = (agencyId: string, percentage: number) => {
    setAgencyLines(
      agencyLines.map((l) =>
        l.agencyId === agencyId ? { ...l, percentage } : l
      )
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

  const annualized =
    form.billingPeriod === 'MONTHLY'
      ? form.amountHt * 12
      : form.billingPeriod === 'QUARTERLY'
        ? form.amountHt * 4
        : form.amountHt;

  const ttc = form.amountHt * (1 + form.vatRate / 100);

  const noticeDeadline = useMemo(() => {
    if (!form.endDate || !form.noticePeriod) return '';
    const d = new Date(form.endDate);
    d.setMonth(d.getMonth() - form.noticePeriod);
    return d.toISOString().split('T')[0];
  }, [form.endDate, form.noticePeriod]);

  const handleSave = async () => {
    if (!form.title || !form.startDate || !form.endDate || form.amountHt <= 0) {
      alert('Veuillez remplir tous les champs obligatoires (intitulé, dates, montant HT).');
      return;
    }

    // Validation ventilation
    if (showVentilation && agencyLines.length > 0) {
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert(
          `Le total de la ventilation doit être 100% (actuellement ${totalPercentage.toFixed(2)}%).`
        );
        return;
      }
    }

    const contractData: any = {
      title: form.title,
      category: form.category,
      status: form.status,
      scope: form.scope,
      supplierId: form.supplierId,
      supplierReference: form.supplierReference,
      startDate: form.startDate,
      endDate: form.endDate,
      autoRenewal: form.autoRenewal,
      renewalDuration: form.autoRenewal ? form.renewalDuration : null,
      renewalUnit: form.autoRenewal ? form.renewalUnit : null,
      noticePeriod: form.noticePeriod,
      noticePeriodUnit: form.noticePeriodUnit,
      noticeDeadline: noticeDeadline || null,
      amountHt: form.amountHt,
      vatRate: form.vatRate,
      billingPeriod: form.billingPeriod,
      tariffRevision: form.tariffRevision || null,
      notes: form.notes || null,
      denouncedAt: null,
      budgetLineId: null,
      subCategory: null,
      allAgencies: form.scope === 'ALL_AGENCIES',
      agencies: showVentilation
        ? agencyLines.map((l) => ({
            agencyId: l.agencyId,
            percentage: l.percentage,
          }))
        : [],
      leaserId: form.leaserId || null,
      articles: articles.filter(a => a.designation.trim()),
      ownerId: '1',
    };

    if (isEditing && existing) {
      await updateContract(existing.id, contractData);
    } else {
      await addContract({
        ...contractData,
        reference: nextRef,
      });
    }
    navigate('/contrats');
  };

  const set = (key: string, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/contrats')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Modifier le contrat' : 'Nouveau contrat'}
        </h1>
        {isEditing && existing && (
          <span className="text-sm text-gray-500 font-mono">
            {existing.reference}
          </span>
        )}
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Identification */}
        <Card>
          <CardHeader>
            <CardTitle>Identification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Référence</Label>
              <Input
                value={isEditing && existing ? existing.reference : nextRef}
                disabled
                className="font-mono bg-gray-50"
              />
            </div>
            <div>
              <Label>Référence fournisseur</Label>
              <Input
                value={form.supplierReference}
                onChange={(e) => set('supplierReference', e.target.value)}
                placeholder="Référence chez le fournisseur"
              />
            </div>
            <div>
              <Label>Intitulé *</Label>
              <Input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Ex: Location copieurs multifonctions"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Catégorie *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => set('category', v)}
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
              <div>
                <Label>Statut</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => set('status', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fournisseur et périmètre */}
        <Card>
          <CardHeader>
            <CardTitle>Fournisseur et périmètre</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Fournisseur *</Label>
              <Select
                value={form.supplierId}
                onValueChange={(v) => set('supplierId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Périmètre *</Label>
              <Select
                value={form.scope}
                onValueChange={(v) => {
                  set('scope', v);
                  if (v === 'ALL_AGENCIES') {
                    setAgencyLines([]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Leaseur</Label>
              <Select
                value={form.leaserId || 'none'}
                onValueChange={(v) => set('leaserId', v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucun (pas de leasing)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun (pas de leasing)</SelectItem>
                  {leasers.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Ventilation par agence */}
        {showVentilation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Ventilation par agence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Appliquer un modèle */}
              {templates.length > 0 && (
                <div>
                  <Label className="text-xs text-slate-500">
                    Appliquer un modèle de ventilation
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
              {form.scope === 'MULTI_AGENCY' && (
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
              )}

              {/* Sélection agence */}
              {availableAgencies.length > 0 && (
                <div>
                  <Label className="text-xs text-slate-500">Ajouter une agence</Label>
                  <Select onValueChange={addAgencyLine}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une agence..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAgencies.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.code} — {a.name} ({a.city})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Tableau des lignes */}
              {agencyLines.length > 0 && (
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agence</TableHead>
                        <TableHead className="w-40">Pourcentage</TableHead>
                        <TableHead className="w-32 text-right">Montant HT</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agencyLines.map((line) => {
                        const agency =
                          line.agency ||
                          allAgencies.find((a) => a.id === line.agencyId);
                        const lineAmount = (annualized * (line.percentage || 0)) / 100;
                        return (
                          <TableRow key={line.agencyId}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">
                                  {agency?.name}
                                </p>
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
                                    updateAgencyPercentage(
                                      line.agencyId,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-24 text-right"
                                />
                                <span className="text-sm text-slate-400">%</span>
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
                                onClick={() => removeAgencyLine(line.agencyId)}
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
                      <span>{formatCurrency(annualized)}</span>
                    </div>
                  </div>
                </div>
              )}

              {agencyLines.length === 0 && (
                <div className="text-center py-6 text-slate-400 border rounded-xl border-dashed">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    Sélectionnez des agences ou appliquez un modèle
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {/* Articles / Matériels */}
        <Card>
          <CardHeader>
            <CardTitle>Articles / Matériels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">Listez les équipements couverts par ce contrat.</p>
            {articles.map((art, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  {idx === 0 && <Label className="text-xs">Désignation</Label>}
                  <Input
                    value={art.designation}
                    onChange={(e) => { const a = [...articles]; a[idx].designation = e.target.value; setArticles(a); }}
                    placeholder="Ex: PC Dell Latitude 5540"
                  />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <Label className="text-xs">Qté</Label>}
                  <Input
                    type="number"
                    value={art.quantity}
                    onChange={(e) => { const a = [...articles]; a[idx].quantity = Number(e.target.value); setArticles(a); }}
                    min={1}
                  />
                </div>
                <div className="col-span-4">
                  {idx === 0 && <Label className="text-xs">Agence</Label>}
                  <Select
                    value={art.agencyId || 'none'}
                    onValueChange={(v) => { const a = [...articles]; a[idx].agencyId = v === 'none' ? '' : v; setArticles(a); }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="— Aucune —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Aucune —</SelectItem>
                      {allAgencies.map((ag) => (
                        <SelectItem key={ag.id} value={ag.id}>{ag.name} ({ag.city})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 flex justify-center">
                  <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => setArticles(articles.filter((_,i) => i !== idx))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setArticles([...articles, { designation: '', quantity: 1, agencyId: '' }])}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un article
            </Button>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de début *</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label>Date de fin *</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set('endDate', e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.autoRenewal}
                onCheckedChange={(v) => set('autoRenewal', v)}
              />
              <Label>Tacite reconduction</Label>
              {form.autoRenewal && (
                <div className="flex items-center gap-2 ml-4">
                  <Input
                    type="number"
                    className="w-20"
                    value={form.renewalDuration}
                    onChange={(e) =>
                      set('renewalDuration', Number(e.target.value))
                    }
                  />
                  <span className="text-sm text-gray-500">mois</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Préavis de dénonciation *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={form.noticePeriod}
                    onChange={(e) =>
                      set('noticePeriod', Number(e.target.value))
                    }
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    mois
                  </span>
                </div>
              </div>
              <div>
                <Label>Date limite de dénonciation</Label>
                <Input
                  value={
                    noticeDeadline
                      ? new Date(noticeDeadline).toLocaleDateString('fr-FR')
                      : '—'
                  }
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financier */}
        <Card>
          <CardHeader>
            <CardTitle>Financier et notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Montant HT (€) *</Label>
                <Input
                  type="number"
                  value={form.amountHt}
                  onChange={(e) => set('amountHt', Number(e.target.value))}
                />
              </div>
              <div>
                <Label>TVA (%)</Label>
                <Input
                  type="number"
                  value={form.vatRate}
                  onChange={(e) => set('vatRate', Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Montant TTC</Label>
                <Input
                  value={formatCurrency(ttc)}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Périodicité *</Label>
                <Select
                  value={form.billingPeriod}
                  onValueChange={(v) => set('billingPeriod', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Montant annualisé HT</Label>
                <div className="h-10 flex items-center text-xl font-bold text-blue-600">
                  {formatCurrency(annualized)}
                </div>
              </div>
            </div>
            <div>
              <Label>Conditions de révision tarifaire</Label>
              <Input
                value={form.tariffRevision}
                onChange={(e) => set('tariffRevision', e.target.value)}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={3}
                placeholder="Informations complémentaires..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 sticky bottom-0 bg-white border-t border-gray-200 py-4">
          <Button variant="outline" onClick={() => navigate('/contrats')}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}
