import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContracts } from '@/contexts/ContractsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';

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
  { value: 'HEADQUARTERS', label: 'Siège' },
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
      });
    }
  }, [existing]);

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

    const contractData = {
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
      distributionMode: form.scope === 'ALL_AGENCIES' ? 'PRORATA' : null,
      agencies: form.scope === 'ALL_AGENCIES' ? 'ALL' : form.scope === 'HEADQUARTERS' ? ['SIEGE'] : [],
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
                onValueChange={(v) => set('scope', v)}
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
          </CardContent>
        </Card>

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
