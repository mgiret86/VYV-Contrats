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
  Shield,
  ShieldCheck,
  User,
  Users,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
  isActive: boolean;
  alertsEnabled: boolean;
  alertDaysBefore: number;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN: { label: 'Administrateur', color: 'bg-red-100 text-red-700' },
  MANAGER: { label: 'Gestionnaire', color: 'bg-blue-100 text-blue-700' },
  VIEWER: { label: 'Lecteur', color: 'bg-slate-100 text-slate-600' },
};

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'VIEWER' as 'ADMIN' | 'MANAGER' | 'VIEWER',
  isActive: true,
  alertsEnabled: true,
  alertDaysBefore: 30,
};

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/users');
      setUsers(data);
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return users;
    const s = search.toLowerCase();
    return users.filter(
      (u) =>
        u.firstName.toLowerCase().includes(s) ||
        u.lastName.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s)
    );
  }, [users, search]);

  const stats = useMemo(() => {
    const active = users.filter((u) => u.isActive).length;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    const managers = users.filter((u) => u.role === 'MANAGER').length;
    return { total: users.length, active, admins, managers };
  }, [users]);

  const handleAdd = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setShowPassword(false);
    setError('');
    setDialogOpen(true);
  };

  const handleEdit = (user: AppUser) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive,
      alertsEnabled: user.alertsEnabled,
      alertDaysBefore: user.alertDaysBefore,
    });
    setShowPassword(false);
    setError('');
    setDialogOpen(true);
  };

  const handleDeleteClick = (user: AppUser) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.email) {
      setError('Prénom, nom et email sont obligatoires.');
      return;
    }
    if (!editingUser && !form.password) {
      setError('Le mot de passe est obligatoire pour un nouvel utilisateur.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload: any = { ...form };
      if (editingUser && !payload.password) {
        delete payload.password;
      }

      if (editingUser) {
        await apiFetch(`/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/users', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setDialogOpen(false);
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await apiFetch(`/users/${deletingUser.id}`, { method: 'DELETE' });
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la suppression.');
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return 'Jamais';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Utilisateurs</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestion des comptes et des droits d'accès
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500">Utilisateurs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
                <p className="text-xs text-slate-500">Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.admins}</p>
                <p className="text-xs text-slate-500">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.managers}</p>
                <p className="text-xs text-slate-500">Gestionnaires</p>
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
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
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
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-center">Alertes</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge className={ROLE_LABELS[user.role]?.color}>
                        {ROLE_LABELS[user.role]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          user.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }
                      >
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.alertsEnabled ? (
                        <Badge variant="outline" className="text-xs">
                          J-{user.alertDaysBefore}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">Désactivées</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(user.lastLoginAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteClick(user)}
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
              {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Modifiez les informations. Laissez le mot de passe vide pour ne pas le changer.'
                : 'Créez un nouveau compte utilisateur.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prénom *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label>Nom *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>
                Mot de passe {editingUser ? '(laisser vide pour ne pas changer)' : '*'}
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Rôle</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                  <SelectItem value="MANAGER">Gestionnaire</SelectItem>
                  <SelectItem value="VIEWER">Lecteur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between border rounded-xl p-3">
              <Label>Compte actif</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
            </div>
            <div className="border rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Alertes email</Label>
                <Switch
                  checked={form.alertsEnabled}
                  onCheckedChange={(v) => setForm({ ...form, alertsEnabled: v })}
                />
              </div>
              {form.alertsEnabled && (
                <div>
                  <Label className="text-xs text-slate-500">Jours avant échéance</Label>
                  <Input
                    type="number"
                    value={form.alertDaysBefore}
                    onChange={(e) =>
                      setForm({ ...form, alertDaysBefore: parseInt(e.target.value) || 30 })
                    }
                    className="w-24 mt-1"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement...' : editingUser ? 'Modifier' : 'Créer'}
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
            Êtes-vous sûr de vouloir supprimer le compte de{' '}
            <strong>
              {deletingUser?.firstName} {deletingUser?.lastName}
            </strong>{' '}
            ({deletingUser?.email}) ? Cette action est irréversible.
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
