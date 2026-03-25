import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Contract, ContractStatus, ContractScope, BillingPeriod } from '@/types/contract';
import { CATEGORIES, generateId } from '@/lib/contractUtils';

interface ContractFormModalProps {
  contract?: Contract | null;
  onSave: (contract: Contract) => void;
  onClose: () => void;
}

const EMPTY_FORM: Partial<Contract> = {
  title: '',
  reference: '',
  supplierReference: '',
  category: 'Licences-Logiciels',
  subCategory: '',
  status: 'ACTIVE',
  scope: 'ALL_AGENCIES',
  supplier: { id: '', name: '' },
  owner: { id: '1', fullName: 'Mickael Giret' },
  startDate: '',
  endDate: '',
  autoRenewal: false,
  renewalDuration: 12,
  renewalUnit: 'mois',
  noticePeriod: 3,
  noticePeriodUnit: 'mois',
  noticeDeadline: '',
  amountHt: 0,
  vatRate: 20,
  billingPeriod: 'ANNUAL',
  distributionMode: null,
  notes: '',
  agencies: 'ALL',
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder:text-slate-400';
const selectCls = `${inputCls} cursor-pointer`;

export function ContractFormModal({ contract, onSave, onClose }: ContractFormModalProps) {
  const isEdit = !!contract;
  const [form, setForm] = useState<Partial<Contract>>(contract ?? EMPTY_FORM);

  useEffect(() => {
    setForm(contract ?? EMPTY_FORM);
  }, [contract]);

  const set = <K extends keyof Contract>(key: K, value: Contract[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString().slice(0, 10);
    const saved: Contract = {
      ...EMPTY_FORM,
      ...form,
      id: form.id ?? generateId(),
      reference: form.reference || `CTR-${new Date().getFullYear()}-${generateId().slice(0, 4).toUpperCase()}`,
      supplier: form.supplier ?? { id: generateId(), name: '' },
    } as Contract;
    onSave(saved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEdit ? 'Modifier le contrat' : 'Nouveau contrat'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? form.reference : 'Remplissez les informations du contrat'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Section: Identification */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              Identification
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Intitulé du contrat" required>
                  <input
                    className={inputCls}
                    value={form.title ?? ''}
                    onChange={(e) => set('title', e.target.value)}
                    placeholder="Ex: Licences Microsoft 365 E3"
                    required
                  />
                </Field>
              </div>
              <Field label="Référence interne">
                <input
                  className={inputCls}
                  value={form.reference ?? ''}
                  onChange={(e) => set('reference', e.target.value)}
                  placeholder="CTR-2024-XXXX"
                />
              </Field>
              <Field label="Réf. fournisseur">
                <input
                  className={inputCls}
                  value={form.supplierReference ?? ''}
                  onChange={(e) => set('supplierReference', e.target.value)}
                  placeholder="Optionnel"
                />
              </Field>
              <Field label="Fournisseur" required>
                <input
                  className={inputCls}
                  value={form.supplier?.name ?? ''}
                  onChange={(e) => set('supplier', { id: form.supplier?.id ?? generateId(), name: e.target.value })}
                  placeholder="Ex: Microsoft France"
                  required
                />
              </Field>
              <Field label="Statut" required>
                <select
                  className={selectCls}
                  value={form.status ?? 'ACTIVE'}
                  onChange={(e) => set('status', e.target.value as ContractStatus)}
                >
                  <option value="ACTIVE">Actif</option>
                  <option value="NEGOTIATING">En négociation</option>
                  <option value="DENOUNCED">Dénoncé</option>
                  <option value="EXPIRED">Expiré</option>
                </select>
              </Field>
              <Field label="Catégorie" required>
                <select
                  className={selectCls}
                  value={form.category ?? 'Licences-Logiciels'}
                  onChange={(e) => set('category', e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Sous-catégorie">
                <input
                  className={inputCls}
                  value={form.subCategory ?? ''}
                  onChange={(e) => set('subCategory', e.target.value)}
                  placeholder="Optionnel"
                />
              </Field>
              <Field label="Périmètre" required>
                <select
                  className={selectCls}
                  value={form.scope ?? 'ALL_AGENCIES'}
                  onChange={(e) => set('scope', e.target.value as ContractScope)}
                >
                  <option value="ALL_AGENCIES">Toutes agences</option>
                  <option value="HEADQUARTERS">Siège</option>
                  <option value="MULTI_AGENCY">Multi-agences</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Section: Dates */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              Durée & Renouvellement
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date de début" required>
                <input
                  type="date"
                  className={inputCls}
                  value={form.startDate ?? ''}
                  onChange={(e) => set('startDate', e.target.value)}
                  required
                />
              </Field>
              <Field label="Date de fin" required>
                <input
                  type="date"
                  className={inputCls}
                  value={form.endDate ?? ''}
                  onChange={(e) => set('endDate', e.target.value)}
                  required
                />
              </Field>
              <Field label="Préavis (mois)" required>
                <input
                  type="number"
                  className={inputCls}
                  value={form.noticePeriod ?? 3}
                  onChange={(e) => set('noticePeriod', Number(e.target.value))}
                  min={0}
                  required
                />
              </Field>
              <Field label="Date limite préavis">
                <input
                  type="date"
                  className={inputCls}
                  value={form.noticeDeadline ?? ''}
                  onChange={(e) => set('noticeDeadline', e.target.value)}
                />
              </Field>
              <div className="col-span-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.autoRenewal ?? false}
                      onChange={(e) => set('autoRenewal', e.target.checked)}
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors ${form.autoRenewal ? 'bg-blue-600' : 'bg-slate-200'}`} />
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.autoRenewal ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Reconduction automatique</span>
                  {form.autoRenewal && (
                    <span className="text-xs text-slate-400">
                      ({form.renewalDuration} {form.renewalUnit})
                    </span>
                  )}
                </label>
              </div>
              {form.autoRenewal && (
                <Field label="Durée de reconduction (mois)">
                  <input
                    type="number"
                    className={inputCls}
                    value={form.renewalDuration ?? 12}
                    onChange={(e) => set('renewalDuration', Number(e.target.value))}
                    min={1}
                  />
                </Field>
              )}
            </div>
          </div>

          {/* Section: Financial */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              Conditions financières
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Montant HT (€)" required>
                <input
                  type="number"
                  className={inputCls}
                  value={form.amountHt ?? 0}
                  onChange={(e) => set('amountHt', Number(e.target.value))}
                  min={0}
                  step={100}
                  required
                />
              </Field>
              <Field label="Taux TVA (%)" required>
                <input
                  type="number"
                  className={inputCls}
                  value={form.vatRate ?? 20}
                  onChange={(e) => set('vatRate', Number(e.target.value))}
                  min={0}
                  max={100}
                  required
                />
              </Field>
              <Field label="Périodicité de facturation" required>
                <select
                  className={selectCls}
                  value={form.billingPeriod ?? 'ANNUAL'}
                  onChange={(e) => set('billingPeriod', e.target.value as BillingPeriod)}
                >
                  <option value="MONTHLY">Mensuelle</option>
                  <option value="QUARTERLY">Trimestrielle</option>
                  <option value="ANNUAL">Annuelle</option>
                </select>
              </Field>
              <Field label="Mode de répartition">
                <select
                  className={selectCls}
                  value={form.distributionMode ?? ''}
                  onChange={(e) => set('distributionMode', (e.target.value || null) as any)}
                >
                  <option value="">Aucun</option>
                  <option value="PRORATA">Au prorata</option>
                  <option value="FIXED">Montant fixe</option>
                </select>
              </Field>
              <div className="col-span-2">
                <Field label="Révision tarifaire">
                  <input
                    className={inputCls}
                    value={form.tariffRevision ?? ''}
                    onChange={(e) => set('tariffRevision', e.target.value)}
                    placeholder="Ex: Indexation annuelle INSEE"
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              Notes
            </h3>
            <textarea
              className={`${inputCls} resize-none`}
              rows={4}
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Informations complémentaires, contexte, points d'attention..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="contract-form"
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            {contract ? 'Enregistrer' : 'Créer le contrat'}
          </button>
        </div>
      </div>
    </div>
  );
}
