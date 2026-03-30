import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContracts } from '@/contexts/ContractsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ArrowLeft, Pencil, Trash2, FileUp } from 'lucide-react';
import { useState } from 'react';

// ============================================================
// CONFIG
// ============================================================

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
];

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

const statusConfig: Record<string, { className: string; label: string }> = {
  ACTIVE: { className: 'bg-green-100 text-green-700', label: 'Actif' },
  DENOUNCED: { className: 'bg-gray-100 text-gray-700', label: 'Dénoncé' },
  EXPIRED: { className: 'bg-red-100 text-red-700', label: 'Expiré' },
  NEGOTIATING: { className: 'bg-yellow-100 text-yellow-700', label: 'En négociation' },
  RENEWING: { className: 'bg-blue-100 text-blue-700', label: 'En renouvellement' },
  TO_TRANSFER: { className: 'bg-purple-100 text-purple-700', label: 'À transférer' },
  TRANSFERRING: { className: 'bg-amber-100 text-amber-700', label: 'En cours de transfert' },
  EXPIRING: { className: 'bg-orange-100 text-orange-700', label: 'En expiration' },
};

const scopeLabels: Record<string, string> = {
  SINGLE_AGENCY: 'Agence unique',
  MULTI_AGENCY: 'Multi-agences',
  HEADQUARTERS: 'Siège',
  ALL_AGENCIES: 'Toutes agences',
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

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

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
// AGENCES (données locales pour la ventilation)
// ============================================================

const AGENCIES = [
  { code: 'SIEGE', label: 'Siège social', defaultRatio: 8.00 },
  { code: 'AG-LYO', label: 'Agence Lyon', defaultRatio: 6.00 },
  { code: 'AG-MAR', label: 'Agence Marseille', defaultRatio: 5.50 },
  { code: 'AG-TLS', label: 'Agence Toulouse', defaultRatio: 5.00 },
  { code: 'AG-BDX', label: 'Agence Bordeaux', defaultRatio: 5.00 },
  { code: 'AG-NTE', label: 'Agence Nantes', defaultRatio: 4.50 },
  { code: 'AG-STR', label: 'Agence Strasbourg', defaultRatio: 4.50 },
  { code: 'AG-LIL', label: 'Agence Lille', defaultRatio: 4.50 },
  { code: 'AG-REN', label: 'Agence Rennes', defaultRatio: 4.00 },
  { code: 'AG-MTP', label: 'Agence Montpellier', defaultRatio: 4.00 },
  { code: 'AG-NCE', label: 'Agence Nice', defaultRatio: 3.50 },
  { code: 'AG-GRE', label: 'Agence Grenoble', defaultRatio: 3.50 },
  { code: 'AG-ROU', label: 'Agence Rouen', defaultRatio: 3.50 },
  { code: 'AG-TRS', label: 'Agence Tours', defaultRatio: 3.50 },
  { code: 'AG-CLF', label: 'Agence Clermont-Ferrand', defaultRatio: 3.00 },
  { code: 'AG-DJN', label: 'Agence Dijon', defaultRatio: 3.00 },
  { code: 'AG-ORL', label: 'Agence Orléans', defaultRatio: 3.00 },
  { code: 'AG-MUL', label: 'Agence Mulhouse', defaultRatio: 2.50 },
  { code: 'AG-ANG', label: 'Agence Angers', defaultRatio: 2.50 },
  { code: 'AG-PAU', label: 'Agence Pau', defaultRatio: 2.50 },
  { code: 'AG-LRO', label: 'Agence La Rochelle', defaultRatio: 2.50 },
  { code: 'AG-BES', label: 'Agence Besançon', defaultRatio: 2.50 },
  { code: 'AG-CAN', label: 'Agence Caen', defaultRatio: 2.50 },
  { code: 'AG-LIM', label: 'Agence Limoges', defaultRatio: 2.50 },
  { code: 'AG-POI', label: 'Agence Poitiers', defaultRatio: 2.50 },
];

// ============================================================
// SOUS-COMPOSANT : ligne info
// ============================================================

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{children}</span>
    </div>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contracts, suppliers, deleteContract } = useContracts();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const contract = contracts.find((c) => c.id === id);

  // Calculs dérivés
  const annualized = contract
    ? getAnnualized(contract.amountHt, contract.billingPeriod)
    : 0;

  const ventilation = useMemo(() => {
    if (!contract) return [];

    if (contract.scope === 'ALL_AGENCIES') {
      return AGENCIES.map((a) => ({
        code: a.code,
        label: a.label,
        ratio: a.defaultRatio,
        amount: (annualized * a.defaultRatio) / 100,
      })).sort((a, b) => b.ratio - a.ratio);
    }

    if (
      contract.scope === 'MULTI_AGENCY' &&
      Array.isArray(contract.agencies)
    ) {
      const selected = AGENCIES.filter((a) =>
        (contract.agencies as string[]).includes(a.code)
      );
      const eq = 100 / selected.length;
      return selected.map((a) => ({
        code: a.code,
        label: a.label,
        ratio: Number(eq.toFixed(2)),
        amount: annualized / selected.length,
      }));
    }

    return [];
  }, [contract, annualized]);

  const chartData = useMemo(() => {
    const sorted = [...ventilation].sort((a, b) => b.amount - a.amount);
    if (sorted.length <= 10) {
      return sorted.map((v) => ({ name: v.label, value: v.amount }));
    }
    return [
      ...sorted.slice(0, 8).map((v) => ({ name: v.label, value: v.amount })),
      {
        name: 'Autres agences',
        value: sorted.slice(8).reduce((s, v) => s + v.amount, 0),
      },
    ];
  }, [ventilation]);

  // ========== CONTRAT INTROUVABLE ==========
  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-lg text-gray-500">Contrat introuvable</p>
        <Button variant="outline" onClick={() => navigate('/contrats')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux contrats
        </Button>
      </div>
    );
  }

  // ========== DONNÉES DÉRIVÉES ==========
  const supplier = suppliers.find((s) => s.id === contract.supplierId);
  const status = statusConfig[contract.status] || {
    className: 'bg-gray-100',
    label: contract.status,
  };
  const catColor =
    categoryColors[contract.category] || 'bg-gray-100 text-gray-700';
  const ttc = contract.amountHt * (1 + (contract.vatRate || 0) / 100);

  const progress = Math.min(
    100,
    Math.max(
      0,
      ((Date.now() - new Date(contract.startDate).getTime()) /
        (new Date(contract.endDate).getTime() -
          new Date(contract.startDate).getTime())) *
        100
    )
  );

  const daysLeft = contract.noticeDeadline
    ? Math.ceil(
        (new Date(contract.noticeDeadline).getTime() - Date.now()) / 86400000
      )
    : null;

  const urgency =
    daysLeft === null
      ? { c: 'bg-gray-100 text-gray-500', l: '—' }
      : daysLeft < 0
        ? { c: 'bg-red-100 text-red-700', l: '⚠️ Dépassée' }
        : daysLeft < 30
          ? { c: 'bg-red-100 text-red-700', l: 'Urgent' }
          : daysLeft < 90
            ? { c: 'bg-orange-100 text-orange-700', l: 'À planifier' }
            : daysLeft < 180
              ? { c: 'bg-yellow-100 text-yellow-700', l: 'À anticiper' }
              : { c: 'bg-green-100 text-green-700', l: 'OK' };

  const handleDelete = () => {
    deleteContract(contract.id);
    navigate('/contrats');
  };

  // Agence label pour SINGLE_AGENCY / HEADQUARTERS
  const singleAgencyLabel =
    contract.scope === 'HEADQUARTERS'
      ? 'Siège social'
      : Array.isArray(contract.agencies) && contract.agencies.length > 0
        ? AGENCIES.find((a) => a.code === contract.agencies[0])?.label ||
          contract.agencies[0]
        : '—';

  // ========== RENDU ==========
  return (
    <div>
      {/* ========== EN-TÊTE ========== */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/contrats')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux contrats
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{contract.title}</h1>
            <p className="text-sm text-gray-500 font-mono">
              {contract.reference}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/contrats/${contract.id}/modifier`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* ========== ONGLETS ========== */}
      <Tabs defaultValue="informations">
        <TabsList>
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="ventilation">
            Ventilation analytique
          </TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        {/* ===== ONGLET 1 : INFORMATIONS ===== */}
        <TabsContent value="informations">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* Colonne gauche */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Identification</CardTitle>
                </CardHeader>
                <CardContent>
                  <InfoRow label="Référence">
                    <span className="font-mono">{contract.reference}</span>
                  </InfoRow>
                  <InfoRow label="Réf. fournisseur">
                    {contract.supplierReference || '—'}
                  </InfoRow>
                  <InfoRow label="Catégorie">
                    <Badge className={catColor}>{contract.category}</Badge>
                  </InfoRow>
                  {contract.subCategory && (
                    <InfoRow label="Sous-catégorie">
                      {contract.subCategory}
                    </InfoRow>
                  )}
                  <InfoRow label="Statut">
                    <Badge className={status.className}>{status.label}</Badge>
                  </InfoRow>
                  <InfoRow label="Périmètre">
                    <Badge variant="outline">
                      {scopeLabels[contract.scope] || contract.scope}
                    </Badge>
                  </InfoRow>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Parties prenantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <InfoRow label="Fournisseur">
                    {supplier?.name || '—'}
                  </InfoRow>
                  <InfoRow label="Contact">
                    {supplier?.contactName || '—'}
                  </InfoRow>
                  <InfoRow label="Email">
                    {supplier?.contactEmail ? (
                      <a
                        href={`mailto:${supplier.contactEmail}`}
                        className="text-blue-600 underline"
                      >
                        {supplier.contactEmail}
                      </a>
                    ) : (
                      '—'
                    )}
                  </InfoRow>
                  <InfoRow label="Leaseur">
                    {(contract as any).leaser?.name || '—'}
                  </InfoRow>
                  <InfoRow label="Téléphone">
                    {supplier?.contactPhone ? (
                      <a
                        href={`tel:${supplier.contactPhone}`}
                        className="text-blue-600"
                      >
                        {supplier.contactPhone}
                      </a>
                    ) : (
                      '—'
                    )}
                  </InfoRow>
                </CardContent>
              </Card>
            </div>

              {/* Articles / Matériels */}
              {Array.isArray((contract as any).articles) && (contract as any).articles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Articles / Matériels</CardTitle>
                    <CardDescription>{(contract as any).articles.length} article(s) lié(s) à ce contrat</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Désignation</TableHead>
                          <TableHead className="text-center w-20">Qté</TableHead>
                          <TableHead>Agence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(contract as any).articles.map((art: any) => (
                          <TableRow key={art.id}>
                            <TableCell className="font-medium">{art.designation}</TableCell>
                            <TableCell className="text-center">{art.quantity}</TableCell>
                            <TableCell>
                              {art.agency ? (
                                <span>{art.agency.name} <span className="text-xs text-gray-400">({art.agency.city})</span></span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

            {/* Colonne droite */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dates et durées</CardTitle>
                </CardHeader>
                <CardContent>
                  <InfoRow label="Période">
                    {formatDate(contract.startDate)} →{' '}
                    {formatDate(contract.endDate)}
                  </InfoRow>
                  <InfoRow label="Reconduction">
                    {contract.autoRenewal
                      ? `Oui — ${contract.renewalDuration} ${contract.renewalUnit}`
                      : 'Non'}
                  </InfoRow>
                  <InfoRow label="Préavis">
                    {contract.noticePeriod} {contract.noticePeriodUnit}
                  </InfoRow>
                  <InfoRow label="Limite dénonciation">
                    <span className="flex items-center gap-2">
                      {contract.noticeDeadline
                        ? formatDate(contract.noticeDeadline)
                        : '—'}
                      <Badge className={urgency.c}>{urgency.l}</Badge>
                    </span>
                  </InfoRow>
                  {contract.denouncedAt && (
                    <InfoRow label="Dénoncé le">
                      {formatDate(contract.denouncedAt)}
                    </InfoRow>
                  )}

                  {/* Barre de progression */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{formatDate(contract.startDate)}</span>
                      <span>{Math.round(progress)}% écoulé</span>
                      <span>{formatDate(contract.endDate)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financier</CardTitle>
                </CardHeader>
                <CardContent>
                  <InfoRow label="Montant HT">
                    {formatCurrency(contract.amountHt)}
                  </InfoRow>
                  <InfoRow label="TVA">{contract.vatRate}%</InfoRow>
                  <InfoRow label="Montant TTC">
                    {formatCurrency(ttc)}
                  </InfoRow>
                  <InfoRow label="Périodicité">
                    {periodLabels[contract.billingPeriod] ||
                      contract.billingPeriod}
                  </InfoRow>
                  <div className="flex justify-between py-3 mt-2 border-t-2 border-blue-100">
                    <span className="text-sm font-semibold text-blue-600">
                      Montant annualisé HT
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(annualized)}
                    </span>
                  </div>
                  {contract.tariffRevision && (
                    <InfoRow label="Révision tarifaire">
                      {contract.tariffRevision}
                    </InfoRow>
                  )}
                  {contract.notes && (
                    <InfoRow label="Notes">{contract.notes}</InfoRow>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ===== ONGLET 2 : VENTILATION ===== */}
        <TabsContent value="ventilation">
          <div className="mt-4">
            {contract.scope === 'HEADQUARTERS' ||
            contract.scope === 'SINGLE_AGENCY' ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm">
                    Ce contrat est rattaché exclusivement à :{' '}
                    <span className="font-semibold">{singleAgencyLabel}</span> —
                    100%
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Tableau */}
                <div className="lg:col-span-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Répartition par agence</CardTitle>
                      <CardDescription>
                        {contract.scope === 'ALL_AGENCIES'
                          ? 'Ventilation au prorata sur les 25 agences'
                          : `Ventilation sur ${ventilation.length} agences`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-[500px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Agence</TableHead>
                              <TableHead className="text-right">
                                Ratio (%)
                              </TableHead>
                              <TableHead className="text-right">
                                Montant annualisé HT
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ventilation.map((v) => (
                              <TableRow key={v.code}>
                                <TableCell>
                                  <span className="font-mono text-xs text-gray-400 mr-2">
                                    {v.code}
                                  </span>
                                  {v.label}
                                </TableCell>
                                <TableCell className="text-right">
                                  {v.ratio.toFixed(2)} %
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(v.amount)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter>
                            <TableRow className="font-bold">
                              <TableCell>Total</TableCell>
                              <TableCell className="text-right">
                                100.00 %
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(annualized)}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Donut */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Répartition visuelle</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center">
                        {/* Donut SVG simple */}
                        <svg viewBox="0 0 200 200" className="w-64 h-64">
                          {(() => {
                            let cumulative = 0;
                            const total = chartData.reduce(
                              (s, d) => s + d.value,
                              0
                            );
                            return chartData.map((d, i) => {
                              const pct = d.value / total;
                              const startAngle = cumulative * 360;
                              const endAngle = (cumulative + pct) * 360;
                              cumulative += pct;

                              const startRad =
                                ((startAngle - 90) * Math.PI) / 180;
                              const endRad =
                                ((endAngle - 90) * Math.PI) / 180;
                              const largeArc = pct > 0.5 ? 1 : 0;

                              const outerR = 90;
                              const innerR = 55;
                              const cx = 100;
                              const cy = 100;

                              const x1 = cx + outerR * Math.cos(startRad);
                              const y1 = cy + outerR * Math.sin(startRad);
                              const x2 = cx + outerR * Math.cos(endRad);
                              const y2 = cy + outerR * Math.sin(endRad);
                              const x3 = cx + innerR * Math.cos(endRad);
                              const y3 = cy + innerR * Math.sin(endRad);
                              const x4 = cx + innerR * Math.cos(startRad);
                              const y4 = cy + innerR * Math.sin(startRad);

                              const path = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;

                              return (
                                <path
                                  key={d.name}
                                  d={path}
                                  fill={COLORS[i % COLORS.length]}
                                  stroke="white"
                                  strokeWidth="1.5"
                                >
                                  <title>
                                    {d.name}: {formatCurrency(d.value)} (
                                    {(pct * 100).toFixed(1)}%)
                                  </title>
                                </path>
                              );
                            });
                          })()}
                          <text
                            x="100"
                            y="96"
                            textAnchor="middle"
                            className="text-xs fill-gray-400"
                          >
                            Total
                          </text>
                          <text
                            x="100"
                            y="112"
                            textAnchor="middle"
                            className="text-sm font-bold fill-gray-800"
                          >
                            {formatCurrency(annualized)}
                          </text>
                        </svg>

                        {/* Légende */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4 text-xs">
                          {chartData.map((d, i) => (
                            <div
                              key={d.name}
                              className="flex items-center gap-1.5"
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-sm shrink-0"
                                style={{
                                  backgroundColor:
                                    COLORS[i % COLORS.length],
                                }}
                              />
                              <span className="text-gray-600 truncate">
                                {d.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===== ONGLET 3 : DOCUMENTS ===== */}
        <TabsContent value="documents">
          <Card className="mt-4">
            <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FileUp className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">Upload de documents</p>
              <p className="text-sm">
                Ce module sera disponible dans une prochaine phase.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ONGLET 4 : HISTORIQUE ===== */}
        <TabsContent value="historique">
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div className="w-0.5 flex-1 bg-gray-200" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Contrat créé</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(contract.startDate)}
                    </p>
                  </div>
                </div>
                {contract.denouncedAt && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <div className="w-0.5 flex-1 bg-gray-200" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Contrat dénoncé</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(contract.denouncedAt)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Échéance du contrat</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(contract.endDate)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========== DIALOG SUPPRESSION ========== */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le contrat «{' '}
              {contract.title} » ({contract.reference}) ? Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
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
