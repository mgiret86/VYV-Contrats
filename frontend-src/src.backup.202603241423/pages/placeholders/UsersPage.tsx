import { useState, useMemo } from 'react';
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
  Mail,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  notifyDeadlines: boolean;
  notifyDaysBefore: number;
}

const ROLES: { value: AppUser['role']; label: string; description: string; icon: typeof Shield }[] = [
  {
    value: 'ADMIN',
    label: 'Administrateur',
    description: 'Accès complet : CRUD contrats, fournisseurs, agences, utilisateurs, paramètres',
    icon: ShieldCheck,
  },
  {
    value: 'MANAGER',
    label: 'Gestionnaire',
    description: 'CRUD contrats et fournisseurs. Lecture agences. Pas d\'accès utilisateurs ni paramètres',
    icon: Shield,
  },
  {
    value: 'VIEWER',
    label: 'Consultation',
    description: 'Lecture seule sur l\'ensemble des données',
    icon: User,
  },
];

const roleConfig: Record<string, { className: string; label: string }> = {
  ADMIN: { className: 'bg-purple-100 text-purple-700', label: 'Administrateur' },
  MANAGER: { className: 'bg-blue-100 text-blue-700', label: 'Gestionnaire' },
  VIEWER: { className: 'bg-gray-100 text-gray-600', label: 'Consultation' },
};

// ============================================================
// DONNÉES DE DÉMONSTRATION
// ============================================================

const INITIAL_USERS: AppUser[] = [
  {
    id: 'u1',
    firstName: 'Mickael',
    lastName: 'Giret',
    email: 'mickael.giret@vyv-ambulance.fr',
    role: 'ADMIN',
    isActive: true,
    lastLogin: '2026-03-23T08:30:00',
    createdAt: '2024-01-01',
    notifyDeadlines: true,
    notifyDaysBefore: 90,
  },
  {
    id: 'u2',
    firstName: 'Sophie',
    lastName: 'Marchand',
    email: 'sophie.marchand@vyv-ambulance.fr',
    role: 'MANAGER',
    isActive: true,
    lastLogin: '2026-03-22T14:15:00',
    createdAt: '2024-03-15',
    notifyDeadlines: true,
    notifyDaysBefore: 60,
  },
  {
    id: 'u3',
    firstName: 'Thomas',
    lastName: 'Lefèvre',
    email: 'thomas.lefevre@vyv-ambulance.fr',
    role: 'MANAGER',
    isActive: true,
    lastLogin: '2026-03-20T09:45:00',
    createdAt: '2024-06-01',
    notifyDeadlines: true,
    notifyDaysBefore: 30,
  },
  {
    id: 'u4',
    firstName: 'Claire',
    lastName: 'Dumont',
    email: 'claire.dumont@vyv-ambulance.fr',
    role: 'VIEWER',
    isActive: true,
    lastLogin: '2026-03-18T11:00:00',
    createdAt: '2025-01-10',
    notifyDeadlines: false,
    notifyDaysBefore: 30,
  },
  {
    id: 'u5',
    firstName: 'Nicolas',
    lastName: 'Berger',
    email: 'nicolas.berger@vyv-ambulance.fr',
    role: 'VIEWER',
    isActive: false,
    lastLogin: '2025-11-05T16:30:00',
    createdAt: '2024-09-01',
    notifyDeadlines: false,
    notifyDaysBefore: 30,
  },
];

// ============================================================
// HELPERS
// ============================================================

function formatDateTime(d: string | null): string {
  if (!d) return 'Jamais';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ============================================================
// COMPOSANT
// ============================================================

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'VIEWER' as AppUser['role'],
    password: '',
    notifyDeadlines: true,
    notifyDaysBefore: 30,
  });

  // ===== Filtrage =====
  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        `${u.firstName} ${u.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchActive = showInactive || u.isActive;
      return matchSearch && matchActive;
    });
  }, [users, search, showInactive]);

  // ===== Stats =====
  const activeCount = users.filter((u) => u.isActive).length;
  const adminCount = users.filter(
    (u) => u.role === 'ADMIN' && u.isActive
  ).length;

  // ===== CRUD =====
  const openCreate = () => {
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'VIEWER',
      password: '',
      notifyDeadlines: true,
      notifyDaysBefore: 30,
    });
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const u = users.find((usr) => usr.id === id);
    if (!u) return;
    setEditingUser(id);
    setFormData({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      password: '',
      notifyDeadlines: u.notifyDeadlines,
      notifyDaysBefore: u.notifyDaysBefore,
    });
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName || !formData.email) return;
    if (!editingUser && !formData.password) return;

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser
            ? {
                ...u,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                role: formData.role,
                notifyDeadlines: formData.notifyDeadlines,
                notifyDaysBefore: formData.notifyDaysBefore,
              }
            : u
        )
      );
    } else {
      const newUser: AppUser = {
        id: `u${Date.now()}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        isActive: true,
        lastLogin: null,
        createdAt: new Date().toISOString().split('T')[0],
        notifyDeadlines: formData.notifyDeadlines,
        notifyDaysBefore: formData.notifyDaysBefore,
      };
      setUsers((prev) => [...prev, newUser]);
    }

    setIsDialogOpen(false);
    setEditingUser(null);
  };

  const handleDelete = () => {
    if (userToDelete) {
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete));
      setUserToDelete(null);
    }
  };

  const toggleActive = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u))
    );
  };

  const userToDeleteData = userToDelete
    ? users.find((u) => u.id === userToDelete)
    : null;

  const set = (key: string, value: string | boolean | number) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  // ========== RENDU ==========
  return (
    <div className="space-y-6">
      {/* ===== EN-TÊTE ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Utilisateurs</h1>
          <p className="text-slate-500 text-sm mt-1">
            {activeCount} utilisateur{activeCount > 1 ? 's' : ''} actif
            {activeCount > 1 ? 's' : ''} · {adminCount} administrateur
            {adminCount > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* ===== RÔLES ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ROLES.map((role) => {
          const Icon = role.icon;
          const count = users.filter(
            (u) => u.role === role.value && u.isActive
          ).length;
          return (
            <Card key={role.value}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      role.value === 'ADMIN'
                        ? 'bg-purple-50'
                        : role.value === 'MANAGER'
                          ? 'bg-blue-50'
                          : 'bg-gray-50'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        role.value === 'ADMIN'
                          ? 'text-purple-600'
                          : role.value === 'MANAGER'
                            ? 'text-blue-600'
                            : 'text-gray-500'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        {role.label}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ===== FILTRES ===== */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher par nom ou email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <button
          onClick={() => setShowInactive(!showInactive)}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
            showInactive
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          {showInactive ? 'Tous affichés' : 'Afficher les inactifs'}
        </button>
      </div>

      {/* ===== TABLEAU ===== */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Notifications
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Dernière connexion
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Créé le
                  </TableHead>
                  <TableHead>Statut</TableHead>
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
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((user) => {
                    const rc = roleConfig[user.role];
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                                user.role === 'ADMIN'
                                  ? 'bg-purple-100 text-purple-700'
                                  : user.role === 'MANAGER'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {user.firstName[0]}
                              {user.lastName[0]}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-slate-400 md:hidden">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <a
                            href={`mailto:${user.email}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {user.email}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge className={rc.className}>{rc.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {user.notifyDeadlines ? (
                            <span className="text-xs text-green-600">
                              ✓ {user.notifyDaysBefore}j avant
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Désactivées
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                          {formatDateTime(user.lastLogin)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }
                          >
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Modifier"
                              onClick={() => openEdit(user.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title={
                                user.isActive ? 'Désactiver' : 'Activer'
                              }
                              onClick={() => toggleActive(user.id)}
                            >
                              <span
                                className={`text-xs ${
                                  user.isActive
                                    ? 'text-red-500'
                                    : 'text-green-500'
                                }`}
                              >
                                ●
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Supprimer"
                              onClick={() => setUserToDelete(user.id)}
                              disabled={user.id === 'u1'}
                            >
                              <Trash2
                                className={`h-4 w-4 ${
                                  user.id === 'u1'
                                    ? 'text-slate-200'
                                    : 'text-red-400 hover:text-red-600'
                                }`}
                              />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===== DIALOG CRÉATION / ÉDITION ===== */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prénom *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  placeholder="Prénom"
                />
              </div>
              <div>
                <Label>Nom *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  placeholder="Nom"
                />
              </div>
            </div>
            <div>
              <Label>Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="prenom.nom@vyv-ambulance.fr"
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label>
                Mot de passe {editingUser ? '(laisser vide = inchangé)' : '*'}
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label>Rôle *</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => set('role', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-[10px] ${roleConfig[r.value].className}`}
                        >
                          {r.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg p-4 space-y-3 bg-slate-50">
              <p className="text-sm font-semibold text-slate-700">
                Notifications par email
              </p>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-slate-600">
                  Alertes de dénonciation
                </Label>
                <Switch
                  checked={formData.notifyDeadlines}
                  onCheckedChange={(v) => set('notifyDeadlines', v)}
                />
              </div>
              {formData.notifyDeadlines && (
                <div>
                  <Label className="text-xs text-slate-500">
                    Notifier X jours avant la deadline
                  </Label>
                  <Select
                    value={String(formData.notifyDaysBefore)}
                    onValueChange={(v) => set('notifyDaysBefore', Number(v))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 jours</SelectItem>
                      <SelectItem value="30">30 jours</SelectItem>
                      <SelectItem value="60">60 jours</SelectItem>
                      <SelectItem value="90">90 jours</SelectItem>
                      <SelectItem value="120">120 jours</SelectItem>
                      <SelectItem value="180">180 jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur «{' '}
              {userToDeleteData?.firstName} {userToDeleteData?.lastName} » (
              {userToDeleteData?.email}) ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserToDelete(null)}
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
