import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Settings,
  Building2,
  Bell,
  Mail,
  Shield,
  Database,
  Palette,
  Globe,
  Clock,
  Save,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download,
  Trash2,
  Server,
  FileText,
  Calendar,
  RefreshCw,
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface NotificationRule {
  id: string;
  label: string;
  daysBefore: number;
  enabled: boolean;
  recipients: string;
}

// ============================================================
// COMPOSANT
// ============================================================

export default function ParametresPage() {
  // ===== État général =====
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'general' | 'notifications' | 'security' | 'data' | 'display'
  >('general');

  // ===== Général =====
  const [companyName, setCompanyName] = useState('Vyv Ambulance');
  const [siret, setSiret] = useState('123 456 789 00012');
  const [address, setAddress] = useState(
    '15 rue de la Santé, 75013 Paris'
  );
  const [phone, setPhone] = useState('01 23 45 67 89');
  const [email, setEmail] = useState('dsi@vyv-ambulance.fr');
  const [website, setWebsite] = useState('www.vyv-ambulance.fr');
  const [fiscalYearStart, setFiscalYearStart] = useState('01');
  const [currency, setCurrency] = useState('EUR');
  const [timezone, setTimezone] = useState('Europe/Paris');

  // ===== Notifications =====
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
    useState(true);
  const [smtpServer, setSmtpServer] = useState('smtp.vyv-ambulance.fr');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('notifications@vyv-ambulance.fr');
  const [smtpTls, setSmtpTls] = useState(true);
  const [senderName, setSenderName] = useState('DSI Contract Manager');
  const [senderEmail, setSenderEmail] = useState(
    'notifications@vyv-ambulance.fr'
  );
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState('WEEKLY');
  const [digestDay, setDigestDay] = useState('MONDAY');

  const [notificationRules, setNotificationRules] = useState<
    NotificationRule[]
  >([
    {
      id: 'r1',
      label: 'Alerte de dénonciation — Urgente',
      daysBefore: 30,
      enabled: true,
      recipients: 'mickael.giret@vyv-ambulance.fr',
    },
    {
      id: 'r2',
      label: 'Alerte de dénonciation — Planification',
      daysBefore: 90,
      enabled: true,
      recipients: 'mickael.giret@vyv-ambulance.fr, sophie.marchand@vyv-ambulance.fr',
    },
    {
      id: 'r3',
      label: 'Alerte de dénonciation — Anticipation',
      daysBefore: 180,
      enabled: true,
      recipients: 'mickael.giret@vyv-ambulance.fr',
    },
    {
      id: 'r4',
      label: 'Rappel fin de contrat',
      daysBefore: 15,
      enabled: true,
      recipients: 'mickael.giret@vyv-ambulance.fr',
    },
    {
      id: 'r5',
      label: 'Alerte dépassement budgétaire',
      daysBefore: 0,
      enabled: false,
      recipients: 'mickael.giret@vyv-ambulance.fr',
    },
  ]);

  // ===== Sécurité =====
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');
  const [passwordMinLength, setPasswordMinLength] = useState('12');
  const [passwordRequireUpper, setPasswordRequireUpper] = useState(true);
  const [passwordRequireNumber, setPasswordRequireNumber] = useState(true);
  const [passwordRequireSpecial, setPasswordRequireSpecial] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [auditLogEnabled, setAuditLogEnabled] = useState(true);

  // ===== Affichage =====
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [itemsPerPage, setItemsPerPage] = useState('25');
  const [defaultView, setDefaultView] = useState('dashboard');
  const [showWelcome, setShowWelcome] = useState(true);

  // ===== Données =====
  const [confirmPurge, setConfirmPurge] = useState(false);

  // ===== Handlers =====
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleRule = (id: string) => {
    setNotificationRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const updateRuleDays = (id: string, days: number) => {
    setNotificationRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, daysBefore: days } : r))
    );
  };

  const TABS = [
    { id: 'general' as const, label: 'Général', icon: Building2 },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Sécurité', icon: Shield },
    { id: 'display' as const, label: 'Affichage', icon: Palette },
    { id: 'data' as const, label: 'Données', icon: Database },
  ];

  // ========== RENDU ==========
  return (
    <div className="space-y-6">
      {/* ===== EN-TÊTE ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
          <p className="text-slate-500 text-sm mt-1">
            Configuration de l'application DSI Contract Manager
          </p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          {saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Enregistré !
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Enregistrer
            </>
          )}
        </Button>
      </div>

      {/* ===== TABS ===== */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ===== ONGLET GÉNÉRAL ===== */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Informations de l'entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Raison sociale</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>SIRET</Label>
                  <Input
                    value={siret}
                    onChange={(e) => setSiret(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Adresse</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Email DSI</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Site web</Label>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Localisation & Formats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Début de l'exercice fiscal</Label>
                  <Select
                    value={fiscalYearStart}
                    onValueChange={setFiscalYearStart}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="01">Janvier</SelectItem>
                      <SelectItem value="04">Avril</SelectItem>
                      <SelectItem value="07">Juillet</SelectItem>
                      <SelectItem value="10">Octobre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Devise</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CHF">CHF (CHF)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fuseau horaire</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Paris">
                        Europe/Paris (UTC+1)
                      </SelectItem>
                      <SelectItem value="Europe/London">
                        Europe/London (UTC)
                      </SelectItem>
                      <SelectItem value="Europe/Brussels">
                        Europe/Brussels (UTC+1)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== ONGLET NOTIFICATIONS ===== */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Configuration SMTP
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-slate-600">
                    Notifications email
                  </Label>
                  <Switch
                    checked={emailNotificationsEnabled}
                    onCheckedChange={setEmailNotificationsEnabled}
                  />
                </div>
              </div>
            </CardHeader>
            {emailNotificationsEnabled && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Serveur SMTP</Label>
                    <div className="relative">
                      <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={smtpServer}
                        onChange={(e) => setSmtpServer(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Port</Label>
                    <Input
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Utilisateur SMTP</Label>
                    <Input
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end gap-4 pb-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={smtpTls}
                        onCheckedChange={setSmtpTls}
                      />
                      <Label className="text-sm">TLS/STARTTLS</Label>
                    </div>
                  </div>
                  <div>
                    <Label>Nom de l'expéditeur</Label>
                    <Input
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Email de l'expéditeur</Label>
                    <Input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    Envoyer un email de test
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Règles d'alerte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notificationRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-xl border transition-all ${
                      rule.enabled
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-50 border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800">
                            {rule.label}
                          </p>
                          {rule.daysBefore > 0 && (
                            <Badge variant="outline" className="text-[10px]">
                              J-{rule.daysBefore}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Destinataires : {rule.recipients}
                        </p>
                        {rule.enabled && rule.daysBefore > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <Label className="text-xs text-slate-500">
                              Jours avant :
                            </Label>
                            <Input
                              type="number"
                              value={rule.daysBefore}
                              onChange={(e) =>
                                updateRuleDays(
                                  rule.id,
                                  Number(e.target.value)
                                )
                              }
                              className="w-20 h-7 text-xs"
                            />
                          </div>
                        )}
                      </div>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Digest récapitulatif
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Récapitulatif périodique
                  </p>
                  <p className="text-xs text-slate-400">
                    Email récapitulatif des échéances à venir
                  </p>
                </div>
                <Switch
                  checked={digestEnabled}
                  onCheckedChange={setDigestEnabled}
                />
              </div>
              {digestEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fréquence</Label>
                    <Select
                      value={digestFrequency}
                      onValueChange={setDigestFrequency}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Quotidien</SelectItem>
                        <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                        <SelectItem value="MONTHLY">Mensuel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {digestFrequency === 'WEEKLY' && (
                    <div>
                      <Label>Jour d'envoi</Label>
                      <Select
                        value={digestDay}
                        onValueChange={setDigestDay}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONDAY">Lundi</SelectItem>
                          <SelectItem value="TUESDAY">Mardi</SelectItem>
                          <SelectItem value="WEDNESDAY">Mercredi</SelectItem>
                          <SelectItem value="THURSDAY">Jeudi</SelectItem>
                          <SelectItem value="FRIDAY">Vendredi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== ONGLET SÉCURITÉ ===== */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Politique de sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Timeout session (min)</Label>
                  <Input
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Déconnexion automatique après inactivité
                  </p>
                </div>
                <div>
                  <Label>Tentatives de connexion max</Label>
                  <Input
                    type="number"
                    value={maxLoginAttempts}
                    onChange={(e) => setMaxLoginAttempts(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Blocage temporaire après X échecs
                  </p>
                </div>
                <div>
                  <Label>Longueur min. mot de passe</Label>
                  <Input
                    type="number"
                    value={passwordMinLength}
                    onChange={(e) => setPasswordMinLength(e.target.value)}
                  />
                </div>
              </div>

              <div className="border rounded-xl p-4 bg-slate-50 space-y-3">
                <p className="text-sm font-semibold text-slate-700">
                  Exigences mot de passe
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={passwordRequireUpper}
                      onCheckedChange={setPasswordRequireUpper}
                    />
                    <Label className="text-sm">Majuscule requise</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={passwordRequireNumber}
                      onCheckedChange={setPasswordRequireNumber}
                    />
                    <Label className="text-sm">Chiffre requis</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={passwordRequireSpecial}
                      onCheckedChange={setPasswordRequireSpecial}
                    />
                    <Label className="text-sm">Caractère spécial</Label>
                  </div>
                </div>
              </div>

              <div className="border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Authentification à deux facteurs (2FA)
                    </p>
                    <p className="text-xs text-slate-400">
                      TOTP via application (Google Authenticator, Authy…)
                    </p>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={setTwoFactorEnabled}
                  />
                </div>
              </div>

              <div>
                <Label>Whitelist IP (optionnel)</Label>
                <Textarea
                  value={ipWhitelist}
                  onChange={(e) => setIpWhitelist(e.target.value)}
                  placeholder="Une IP par ligne. Ex: 192.168.1.0/24"
                  rows={3}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Laisser vide pour autoriser toutes les IP
                </p>
              </div>

              <div className="flex items-center justify-between border rounded-xl p-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Journal d'audit
                  </p>
                  <p className="text-xs text-slate-400">
                    Enregistre toutes les actions (CRUD, connexions, exports)
                  </p>
                </div>
                <Switch
                  checked={auditLogEnabled}
                  onCheckedChange={setAuditLogEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== ONGLET AFFICHAGE ===== */}
      {activeTab === 'display' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5 text-blue-600" />
                Préférences d'affichage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Format de date</Label>
                  <Select
                    value={dateFormat}
                    onValueChange={setDateFormat}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">
                        DD/MM/YYYY (23/03/2026)
                      </SelectItem>
                      <SelectItem value="YYYY-MM-DD">
                        YYYY-MM-DD (2026-03-23)
                      </SelectItem>
                      <SelectItem value="DD.MM.YYYY">
                        DD.MM.YYYY (23.03.2026)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Éléments par page</Label>
                  <Select
                    value={itemsPerPage}
                    onValueChange={setItemsPerPage}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Page d'accueil par défaut</Label>
                  <Select
                    value={defaultView}
                    onValueChange={setDefaultView}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="contracts">Contrats</SelectItem>
                      <SelectItem value="calendar">Calendrier</SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between border rounded-xl p-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Message de bienvenue
                  </p>
                  <p className="text-xs text-slate-400">
                    Afficher un message de bienvenue sur le dashboard
                  </p>
                </div>
                <Switch
                  checked={showWelcome}
                  onCheckedChange={setShowWelcome}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== ONGLET DONNÉES ===== */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Import / Export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-semibold text-slate-800">
                      Export des données
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    Exporter l'intégralité des contrats, fournisseurs, lignes
                    budgétaires et agences.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      Export CSV
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      Export JSON
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      Export Excel
                    </Button>
                  </div>
                </div>

                <div className="border rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-600" />
                    <p className="text-sm font-semibold text-slate-800">
                      Import des données
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    Importer des contrats depuis un fichier CSV ou Excel.
                    Le format attendu est disponible via le modèle.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-3.5 w-3.5" />
                      Télécharger le modèle
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Upload className="h-3.5 w-3.5" />
                      Importer
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                Sauvegarde
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border rounded-xl p-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Sauvegarde automatique
                  </p>
                  <p className="text-xs text-slate-400">
                    Dernière sauvegarde : 23/03/2026 à 02:00
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-700">Active</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-3.5 w-3.5" />
                  Télécharger la dernière sauvegarde
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Lancer une sauvegarde manuelle
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Zone dangereuse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border border-red-100 rounded-xl p-4 bg-red-50/50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Purger les données de démonstration
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Supprime tous les contrats, fournisseurs, lignes
                      budgétaires et agences de démonstration. Cette action
                      est irréversible.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2 shrink-0"
                    onClick={() => setConfirmPurge(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Purger
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== Informations système ===== */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Settings className="h-3 w-3" />
              DSI Contract Manager v1.0.0
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Dernière mise à jour : 23/03/2026
            </span>
            <span className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              Base locale (démonstration)
            </span>
            <span className="flex items-center gap-1">
              <Server className="h-3 w-3" />
              Frontend React + Vite
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ===== DIALOG PURGE ===== */}
      <Dialog open={confirmPurge} onOpenChange={setConfirmPurge}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Confirmer la purge
            </DialogTitle>
            <DialogDescription>
              Cette action supprimera définitivement toutes les données de
              démonstration (contrats, fournisseurs, lignes budgétaires,
              agences). L'application sera vide après cette opération.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmPurge(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmPurge(false)}
            >
              Oui, tout supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
