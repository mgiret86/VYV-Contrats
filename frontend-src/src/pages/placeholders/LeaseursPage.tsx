import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Landmark,
  Mail,
  Phone,
  FileText,
  ChevronRight,
} from 'lucide-react';

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

interface Leaser {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  category: string | null;
  rating: number;
  contracts?: { id: string; reference: string; title: string; status: string; amountHt?: number; billingPeriod?: string }[];
}

export default function LeaseursPage() {
  const navigate = useNavigate();

  const [leasers, setLeasers] = useState<Leaser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLeaser, setEditingLeaser] = useState<string | null>(null);
  const [leaserToDelete, setLeaserToDelete] = useState<string | null>(null);
  const [detailLeaserId, setDetailLeaserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    category: '',
  });

  const fetchLeasers = useCallback(async () => {
    try {
      const data = await apiFetch<Leaser[]>('/leasers');
      setLeasers(data);
    } catch (err) {
      console.error('Erreur chargement leasers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeasers();
  }, [fetchLeasers]);

  const enrichedLeasers = useMemo(() => {
    return leasers.map((l) => {
      const leaserContracts = l.contracts || [];
      const activeContracts = leaserContracts.filter((c) => c.status === 'ACTIVE');
      const totalAnnualized = leaserContracts.reduce(
        (sum, c) => sum + getAnnualized(c.amountHt || 0, c.billingPeriod || 'ANNUAL'),
        0
      );
      return { ...l, contractCount: leaserContracts.length, activeContractCount: activeContracts.length, totalAnnualized };
    });
  }, [leasers]);

  const filtered = useMemo(() => {
    return enrichedLeasers.filter((l) => {
      const q = search.toLowerCase();
      return l.name.toLowerCase().includes(q) || (l.contactName || '').toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q);
    });
  }, [enrichedLeasers, search]);

  const totalEngagement = enrichedLeasers.reduce((sum, l) => sum + l.totalAnnualized, 0);

  const openCreate = () => {
    setEditingLeaser(null);
    setFormData({ name: '', contactName: '', email: '', phone: '', category: '' });
    setIsDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const l = leasers.find((le) => le.id === id);
    if (!l) return;
    setEditingLeaser(id);
    setFormData({ name: l.name, contactName: l.contactName || '', email: l.email || '', phone: l.phone || '', category: l.category || '' });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    const body = { name: formData.name, contactName: formData.contactName || null, email: formData.email || null, phone: formData.phone || null, category: formData.category || null };
    try {
      if (editingLeaser) {
        await apiFetch(`/leasers/${editingLeaser}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiFetch('/leasers', { method: 'POST', body: JSON.stringify(body) });
      }
      setIsDialogOpen(false);
      setEditingLeaser(null);
      fetchLeasers();
    } catch (err) {
      console.error('Erreur sauvegarde leaser:', err);
    }
  };

  const handleDelete = async () => {
    if (!leaserToDelete) return;
    try {
      await apiFetch(`/leasers/${leaserToDelete}`, { method: 'DELETE' });
      setLeaserToDelete(null);
      fetchLeasers();
    } catch (err) {
      console.error('Erreur suppression leaser:', err);
    }
  };

  const leaserToDeleteData = leaserToDelete ? enrichedLeasers.find((l) => l.id === leaserToDelete) : null;
  const detailLeaser = detailLeaserId ? enrichedLeasers.find((l) => l.id === detailLeaserId) : null;
  const detailContracts = detailLeaser?.contracts || [];
  const set = (key: string, value: string) => setFormData((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Chargement…</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leaseurs</h1>
          <p className="text-slate-500 text-sm mt-1">
            {leasers.length} leaseur{leasers.length > 1 ? 's' : ''} · {formatCurrency(totalEngagement)} d'engagement annuel
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau leaseur
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Rechercher par nom, contact, email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leaseur</TableHead>
                  <TableHead className="hidden lg:table-cell">Contact</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Téléphone</TableHead>
                  <TableHead className="hidden lg:table-cell">Catégorie</TableHead>
                  <TableHead className="text-center">Contrats</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Engagement /an</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-400">Aucun leaseur trouvé</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((leaser) => (
                    <TableRow key={leaser.id} className="cursor-pointer hover:bg-slate-50/70 group" onClick={() => setDetailLeaserId(leaser.id)}>
                      <TableCell>
                        <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{leaser.name}</p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-600">{leaser.contactName || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {leaser.email ? (
                          <a href={`mailto:${leaser.email}`} className="text-sm text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>{leaser.email}</a>
                        ) : <span className="text-sm text-slate-400">—</span>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-600">{leaser.phone || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-slate-600">{leaser.category || '—'}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Badge variant="secondary" className="text-xs">{leaser.contractCount}</Badge>
                          {leaser.activeContractCount > 0 && (
                            <Badge className="bg-green-100 text-green-700 text-xs">{leaser.activeContractCount} actif{leaser.activeContractCount > 1 ? 's' : ''}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        <span className="text-sm font-semibold text-blue-600">{formatCurrency(leaser.totalAnnualized)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Modifier" onClick={(e) => { e.stopPropagation(); openEdit(leaser.id); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Supprimer" onClick={(e) => { e.stopPropagation(); setLeaserToDelete(leaser.id); }}>
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

      {/* DIALOG DETAIL */}
      <Dialog open={!!detailLeaserId} onOpenChange={() => setDetailLeaserId(null)}>
        <DialogContent className="max-w-2xl">
          {detailLeaser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Landmark className="h-5 w-5 text-blue-600" />
                  {detailLeaser.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    {detailLeaser.contactName && (
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-slate-500 text-xs">Contact</p>
                          <p className="font-medium">{detailLeaser.contactName}</p>
                          {detailLeaser.email && <a href={`mailto:${detailLeaser.email}`} className="text-blue-600 hover:underline text-xs">{detailLeaser.email}</a>}
                        </div>
                      </div>
                    )}
                    {detailLeaser.phone && (
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-slate-500 text-xs">Téléphone</p>
                          <p className="font-medium">{detailLeaser.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {detailLeaser.category && (
                      <div>
                        <p className="text-slate-500 text-xs">Catégorie</p>
                        <p className="font-medium">{detailLeaser.category}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{detailLeaser.contractCount}</p>
                    <p className="text-xs text-blue-500">Contrat{detailLeaser.contractCount > 1 ? 's' : ''}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{detailLeaser.activeContractCount}</p>
                    <p className="text-xs text-green-500">Actif{detailLeaser.activeContractCount > 1 ? 's' : ''}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-purple-600">{formatCurrency(detailLeaser.totalAnnualized)}</p>
                    <p className="text-xs text-purple-500">Engagement /an</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Contrats associés</p>
                  {detailContracts.length === 0 ? (
                    <p className="text-sm text-slate-400">Aucun contrat associé</p>
                  ) : (
                    <div className="space-y-1">
                      {detailContracts.map((c: any) => (
                        <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => { setDetailLeaserId(null); navigate(`/contrats/${c.id}`); }}>
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{c.title}</p>
                            <p className="text-xs text-slate-400 font-mono">{c.reference}</p>
                          </div>
                          <Badge className={`text-[10px] ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : c.status === 'EXPIRED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                            {c.status === 'ACTIVE' ? 'Actif' : c.status === 'EXPIRED' ? 'Expiré' : c.status === 'DENOUNCED' ? 'Dénoncé' : c.status}
                          </Badge>
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

      {/* DIALOG CREATION / EDITION */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLeaser ? 'Modifier le leaseur' : 'Nouveau leaseur'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nom *</Label><Input value={formData.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Grenke, BNP Lease..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Contact principal</Label><Input value={formData.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder="Prénom Nom" /></div>
              <div><Label>Téléphone</Label><Input value={formData.phone} onChange={(e) => set('phone', e.target.value)} placeholder="01 23 45 67 89" /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => set('email', e.target.value)} placeholder="contact@leaseur.fr" /></div>
            <div><Label>Catégorie</Label><Input value={formData.category} onChange={(e) => set('category', e.target.value)} placeholder="Ex: Leasing informatique, Crédit-bail..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG SUPPRESSION */}
      <Dialog open={!!leaserToDelete} onOpenChange={() => setLeaserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le leaseur « {leaserToDeleteData?.name} » ?
              {leaserToDeleteData && leaserToDeleteData.contractCount > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  ⚠️ Ce leaseur est lié à {leaserToDeleteData.contractCount} contrat{leaserToDeleteData.contractCount > 1 ? 's' : ''}.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaserToDelete(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
