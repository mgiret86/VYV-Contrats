import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Search } from 'lucide-react';

interface Agency {
  id: string;
  code: string;
  label: string;
  region: string;
  manager: string;
  nbItPosts: number;
  defaultRatio: number;
  isActive: boolean;
}

const initialAgencies: Agency[] = [
  { id: 'a1', code: 'SIEGE', label: 'Siège social', region: 'Île-de-France', manager: 'Direction Générale', nbItPosts: 45, defaultRatio: 8.00, isActive: true },
  { id: 'a2', code: 'AG-LYO', label: 'Agence Lyon', region: 'Auvergne-Rhône-Alpes', manager: 'Resp. Lyon', nbItPosts: 32, defaultRatio: 6.00, isActive: true },
  { id: 'a3', code: 'AG-MAR', label: 'Agence Marseille', region: 'Provence-Alpes-Côte d\'Azur', manager: 'Resp. Marseille', nbItPosts: 28, defaultRatio: 5.50, isActive: true },
  { id: 'a4', code: 'AG-TLS', label: 'Agence Toulouse', region: 'Occitanie', manager: 'Resp. Toulouse', nbItPosts: 25, defaultRatio: 5.00, isActive: true },
  { id: 'a5', code: 'AG-BDX', label: 'Agence Bordeaux', region: 'Nouvelle-Aquitaine', manager: 'Resp. Bordeaux', nbItPosts: 25, defaultRatio: 5.00, isActive: true },
  { id: 'a6', code: 'AG-NTE', label: 'Agence Nantes', region: 'Pays de la Loire', manager: 'Resp. Nantes', nbItPosts: 22, defaultRatio: 4.50, isActive: true },
  { id: 'a7', code: 'AG-STR', label: 'Agence Strasbourg', region: 'Grand Est', manager: 'Resp. Strasbourg', nbItPosts: 22, defaultRatio: 4.50, isActive: true },
  { id: 'a8', code: 'AG-LIL', label: 'Agence Lille', region: 'Hauts-de-France', manager: 'Resp. Lille', nbItPosts: 22, defaultRatio: 4.50, isActive: true },
  { id: 'a9', code: 'AG-REN', label: 'Agence Rennes', region: 'Bretagne', manager: 'Resp. Rennes', nbItPosts: 20, defaultRatio: 4.00, isActive: true },
  { id: 'a10', code: 'AG-MTP', label: 'Agence Montpellier', region: 'Occitanie', manager: 'Resp. Montpellier', nbItPosts: 20, defaultRatio: 4.00, isActive: true },
  { id: 'a11', code: 'AG-NCE', label: 'Agence Nice', region: 'Provence-Alpes-Côte d\'Azur', manager: 'Resp. Nice', nbItPosts: 18, defaultRatio: 3.50, isActive: true },
  { id: 'a12', code: 'AG-GRE', label: 'Agence Grenoble', region: 'Auvergne-Rhône-Alpes', manager: 'Resp. Grenoble', nbItPosts: 18, defaultRatio: 3.50, isActive: true },
  { id: 'a13', code: 'AG-ROU', label: 'Agence Rouen', region: 'Normandie', manager: 'Resp. Rouen', nbItPosts: 18, defaultRatio: 3.50, isActive: true },
  { id: 'a14', code: 'AG-TRS', label: 'Agence Tours', region: 'Centre-Val de Loire', manager: 'Resp. Tours', nbItPosts: 18, defaultRatio: 3.50, isActive: true },
  { id: 'a15', code: 'AG-CLF', label: 'Agence Clermont-Ferrand', region: 'Auvergne-Rhône-Alpes', manager: 'Resp. Clermont', nbItPosts: 15, defaultRatio: 3.00, isActive: true },
  { id: 'a16', code: 'AG-DJN', label: 'Agence Dijon', region: 'Bourgogne-Franche-Comté', manager: 'Resp. Dijon', nbItPosts: 15, defaultRatio: 3.00, isActive: true },
  { id: 'a17', code: 'AG-ORL', label: 'Agence Orléans', region: 'Centre-Val de Loire', manager: 'Resp. Orléans', nbItPosts: 15, defaultRatio: 3.00, isActive: true },
  { id: 'a18', code: 'AG-MUL', label: 'Agence Mulhouse', region: 'Grand Est', manager: 'Resp. Mulhouse', nbItPosts: 12, defaultRatio: 2.50, isActive: true },
  { id: 'a19', code: 'AG-ANG', label: 'Agence Angers', region: 'Pays de la Loire', manager: 'Resp. Angers', nbItPosts: 12, defaultRatio: 2.50, isActive: true },
  { id: 'a20', code: 'AG-PAU', label: 'Agence Pau', region: 'Nouvelle-Aquitaine', manager: 'Resp. Pau', nbItPosts: 12, defaultRatio: 2.50, isActive: true },
  { id: 'a21', code: 'AG-LRO', label: 'Agence La Rochelle', region: 'Nouvelle-Aquitaine', manager: 'Resp. La Rochelle', nbItPosts: 12, defaultRatio: 2.50, isActive: true },
  { id: 'a22', code: 'AG-BES', label: 'Agence Besançon', region: 'Bourgogne-Franche-Comté', manager: 'Resp. Besançon', nbItPosts: 12, defaultRatio: 2.50, isActive: true },
  { id: 'a23', code: 'AG-CAN', label: 'Agence Caen', region: 'Normandie', manager: 'Resp. Caen', nbItPosts: 12, defaultRatio: 2.50, isActive: true },
  { id: 'a24', code: 'AG-LIM', label: 'Agence Limoges', region: 'Nouvelle-Aquitaine', manager: 'Resp. Limoges', nbItPosts: 12, defaultRatio: 2.50, isActive: true },
  { id: 'a25', code: 'AG-POI', label: 'Agence Poitiers', region: 'Nouvelle-Aquitaine', manager: 'Resp. Poitiers', nbItPosts: 12, defaultRatio: 2.50, isActive: true },
];

const REGIONS = [
  'Île-de-France',
  'Auvergne-Rhône-Alpes',
  'Provence-Alpes-Côte d\'Azur',
  'Occitanie',
  'Nouvelle-Aquitaine',
  'Pays de la Loire',
  'Grand Est',
  'Hauts-de-France',
  'Bretagne',
  'Normandie',
  'Centre-Val de Loire',
  'Bourgogne-Franche-Comté',
];

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>(initialAgencies);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    label: '',
    region: '',
    manager: '',
    nbItPosts: 0,
    defaultRatio: 0,
  });

  const filtered = useMemo(
    () =>
      agencies.filter(
        (a) =>
          a.code.toLowerCase().includes(search.toLowerCase()) ||
          a.label.toLowerCase().includes(search.toLowerCase())
      ),
    [agencies, search]
  );

  const totalRatio = useMemo(
    () => agencies.reduce((sum, a) => sum + a.defaultRatio, 0),
    [agencies]
  );

  const totalPosts = useMemo(
    () => agencies.reduce((sum, a) => sum + a.nbItPosts, 0),
    [agencies]
  );

  const handleSave = () => {
    if (!formData.code || !formData.label) return;

    if (editingAgency) {
      setAgencies((prev) =>
        prev.map((a) =>
          a.id === editingAgency.id
            ? {
                ...a,
                code: formData.code,
                label: formData.label,
                region: formData.region,
                manager: formData.manager,
                nbItPosts: Number(formData.nbItPosts),
                defaultRatio: Number(formData.defaultRatio),
              }
            : a
        )
      );
    } else {
      const newAgency: Agency = {
        id: String(Date.now()),
        code: formData.code,
        label: formData.label,
        region: formData.region,
        manager: formData.manager,
        nbItPosts: Number(formData.nbItPosts),
        defaultRatio: Number(formData.defaultRatio),
        isActive: true,
      };
      setAgencies((prev) => [...prev, newAgency]);
    }

    setIsDialogOpen(false);
    setEditingAgency(null);
  };

  const openCreate = () => {
    setEditingAgency(null);
    setFormData({
      code: '',
      label: '',
      region: '',
      manager: '',
      nbItPosts: 0,
      defaultRatio: 0,
    });
    setIsDialogOpen(true);
  };

  const openEdit = (agency: Agency) => {
    setEditingAgency(agency);
    setFormData({
      code: agency.code,
      label: agency.label,
      region: agency.region,
      manager: agency.manager,
      nbItPosts: agency.nbItPosts,
      defaultRatio: agency.defaultRatio,
    });
    setIsDialogOpen(true);
  };

  const toggleActive = (id: string) => {
    setAgencies((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Référentiel des agences</h1>
          <Badge variant="secondary">{agencies.length}</Badge>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle agence
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par code ou libellé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Région</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead className="text-right">Postes IT</TableHead>
                <TableHead className="text-right">Ratio (%)</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((agency) => (
                <TableRow key={agency.id}>
                  <TableCell className="font-mono text-sm">
                    {agency.code}
                  </TableCell>
                  <TableCell className="font-medium">{agency.label}</TableCell>
                  <TableCell>{agency.region}</TableCell>
                  <TableCell>{agency.manager}</TableCell>
                  <TableCell className="text-right">
                    {agency.nbItPosts}
                  </TableCell>
                  <TableCell className="text-right">
                    {agency.defaultRatio.toFixed(2)} %
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        agency.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }
                    >
                      {agency.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(agency)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(agency.id)}
                      title={
                        agency.isActive ? 'Désactiver' : 'Activer'
                      }
                    >
                      {agency.isActive ? (
                        <span className="text-red-500 text-xs">●</span>
                      ) : (
                        <span className="text-green-500 text-xs">●</span>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="font-bold">
                <TableCell colSpan={4}>Total</TableCell>
                <TableCell className="text-right">{totalPosts}</TableCell>
                <TableCell className="text-right">
                  {totalRatio.toFixed(2)} %
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAgency ? "Modifier l'agence" : 'Nouvelle agence'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
                disabled={!!editingAgency}
                placeholder="Ex: AG-PAR"
              />
            </div>
            <div>
              <Label>Libellé *</Label>
              <Input
                value={formData.label}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, label: e.target.value }))
                }
                placeholder="Ex: Agence Paris"
              />
            </div>
            <div>
              <Label>Région</Label>
              <Select
                value={formData.region}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, region: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une région" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsable</Label>
              <Input
                value={formData.manager}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, manager: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Nombre de postes IT</Label>
              <Input
                type="number"
                value={formData.nbItPosts}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    nbItPosts: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>Clé de répartition (%) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.defaultRatio}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    defaultRatio: Number(e.target.value),
                  }))
                }
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
    </div>
  );
}
