import {
  X,
  Building2,
  Calendar,
  Euro,
  RefreshCw,
  Bell,
  FileText,
  Globe,
  Tag,
  User,
  Hash,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Trash2,
} from 'lucide-react';
import { Contract } from '@/types/contract';
import {
  SCOPE_CONFIG,
  BILLING_PERIOD_LABELS,
  formatAmount,
  formatDate,
  getDaysUntil,
  getUrgencyLevel,
} from '@/lib/contractUtils';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';

interface ContractDetailPanelProps {
  contract: Contract;
  onClose: () => void;
  onEdit: (contract: Contract) => void;
  onDelete: (contract: Contract) => void;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="text-sm text-slate-800 font-medium">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function ContractDetailPanel({ contract, onClose, onEdit, onDelete }: ContractDetailPanelProps) {
  const urgency = getUrgencyLevel(contract);
  const amountTtc = contract.amountHt * (1 + contract.vatRate / 100);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-white sticky top-0 z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatusBadge status={contract.status} />
              <CategoryBadge category={contract.category} />
              {urgency === 'critical' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  Délai critique
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">{contract.title}</h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">{contract.reference}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Urgency banner */}
        {urgency === 'critical' && contract.noticeDeadline && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              Délai de préavis expire dans{' '}
              <strong>{getDaysUntil(contract.noticeDeadline)} jours</strong> — Action requise
            </p>
          </div>
        )}
        {urgency === 'warning' && contract.noticeDeadline && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 font-medium">
              Préavis dans <strong>{getDaysUntil(contract.noticeDeadline)} jours</strong> — À surveiller
            </p>
          </div>
        )}

        {/* Denounced banner */}
        {contract.status === 'DENOUNCED' && contract.denouncedAt && (
          <div className="bg-orange-50 border-b border-orange-200 px-6 py-3 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
            <p className="text-sm text-orange-700 font-medium">
              Dénoncé le <strong>{formatDate(contract.denouncedAt)}</strong>
            </p>
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* Financials highlight */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-400 font-medium mb-1">Montant HT / an</p>
              <p className="text-xl font-bold text-slate-900">{formatAmount(contract.amountHt)}</p>
              <p className="text-xs text-slate-400 mt-0.5">TVA {contract.vatRate}%</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-400 font-medium mb-1">Montant TTC / an</p>
              <p className="text-xl font-bold text-slate-900">{formatAmount(amountTtc)}</p>
              <p className="text-xs text-slate-400 mt-0.5">{BILLING_PERIOD_LABELS[contract.billingPeriod]}</p>
            </div>
          </div>

          {/* Identification */}
          <Section title="Identification">
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="Référence interne">
                <span className="font-mono text-blue-700">{contract.reference}</span>
              </DetailRow>
              {contract.supplierReference && (
                <DetailRow label="Réf. fournisseur">
                  <span className="font-mono">{contract.supplierReference}</span>
                </DetailRow>
              )}
              <DetailRow label="Fournisseur">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {contract.supplier.name}
                </span>
              </DetailRow>
              <DetailRow label="Responsable">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {contract.owner.fullName}
                </span>
              </DetailRow>
              <DetailRow label="Catégorie">
                <CategoryBadge category={contract.category} />
              </DetailRow>
              {contract.subCategory && (
                <DetailRow label="Sous-catégorie">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    {contract.subCategory}
                  </span>
                </DetailRow>
              )}
              <DetailRow label="Périmètre">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  {SCOPE_CONFIG[contract.scope].label}
                </span>
              </DetailRow>
            </div>
          </Section>

          {/* Dates */}
          <Section title="Durée & Renouvellement">
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="Date de début">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDate(contract.startDate)}
                </span>
              </DetailRow>
              <DetailRow label="Date de fin">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDate(contract.endDate)}
                </span>
              </DetailRow>
              <DetailRow label="Reconduction auto.">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  contract.autoRenewal
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  <RefreshCw className="w-3 h-3" />
                  {contract.autoRenewal
                    ? `Oui — ${contract.renewalDuration} ${contract.renewalUnit}`
                    : 'Non'}
                </span>
              </DetailRow>
              <DetailRow label="Préavis">
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-slate-400" />
                  {contract.noticePeriod} {contract.noticePeriodUnit}
                </span>
              </DetailRow>
              {contract.noticeDeadline && (
                <DetailRow label="Date limite préavis">
                  <span className={`flex items-center gap-1.5 ${
                    urgency === 'critical' ? 'text-red-600 font-bold' :
                    urgency === 'warning' ? 'text-amber-600 font-semibold' : ''
                  }`}>
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(contract.noticeDeadline)}
                    {urgency && urgency !== 'normal' && (
                      <span className="text-xs">
                        ({getDaysUntil(contract.noticeDeadline)}j)
                      </span>
                    )}
                  </span>
                </DetailRow>
              )}
            </div>
          </Section>

          {/* Financial */}
          <Section title="Conditions financières">
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="Montant HT">
                <span className="flex items-center gap-1.5">
                  <Euro className="w-3.5 h-3.5 text-slate-400" />
                  {formatAmount(contract.amountHt)}
                </span>
              </DetailRow>
              <DetailRow label="Taux TVA">
                {contract.vatRate}%
              </DetailRow>
              <DetailRow label="Montant TTC">
                <span className="font-bold text-slate-900">{formatAmount(amountTtc)}</span>
              </DetailRow>
              <DetailRow label="Facturation">
                {BILLING_PERIOD_LABELS[contract.billingPeriod]}
              </DetailRow>
              {contract.distributionMode && (
                <DetailRow label="Mode de répartition">
                  {contract.distributionMode === 'PRORATA' ? 'Au prorata' : 'Montant fixe'}
                </DetailRow>
              )}
              {contract.tariffRevision && (
                <div className="col-span-2">
                  <DetailRow label="Révision tarifaire">
                    <span className="text-slate-600 font-normal">{contract.tariffRevision}</span>
                  </DetailRow>
                </div>
              )}
            </div>
          </Section>

          {/* Agencies */}
          <Section title="Périmètre agences">
            {contract.agencies === 'ALL' ? (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Globe className="w-4 h-4 text-blue-500" />
                <span>Toutes les agences (25)</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(contract.agencies as string[]).map((ag) => (
                  <span
                    key={ag}
                    className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md font-mono font-medium"
                  >
                    {ag}
                  </span>
                ))}
              </div>
            )}
          </Section>

          {/* Notes */}
          {contract.notes && (
            <Section title="Notes">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{contract.notes}</p>
              </div>
            </Section>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
          <button
            onClick={() => onDelete(contract)}
            className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={() => onEdit(contract)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
