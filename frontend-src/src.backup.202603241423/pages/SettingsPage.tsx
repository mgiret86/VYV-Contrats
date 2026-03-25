import { Settings, User, Bell, Shield, Palette, Database, ChevronRight } from 'lucide-react';

const sections = [
  {
    id: 'profile',
    icon: User,
    title: 'Profil utilisateur',
    description: 'Gérez vos informations personnelles et vos préférences',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Configurez les alertes et rappels d\'échéances',
    color: 'text-violet-600 bg-violet-50',
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Sécurité',
    description: 'Mot de passe, authentification et accès',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    id: 'appearance',
    icon: Palette,
    title: 'Apparence',
    description: 'Thème, langue et préférences d\'affichage',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    id: 'data',
    icon: Database,
    title: 'Données & exports',
    description: 'Sauvegarde, import et export des données',
    color: 'text-red-600 bg-red-50',
  },
];

const notifSettings = [
  { label: 'Alertes d\'expiration (30 jours)', enabled: true },
  { label: 'Alertes d\'expiration (7 jours)', enabled: true },
  { label: 'Nouveaux contrats ajoutés', enabled: false },
  { label: 'Rapports mensuels disponibles', enabled: true },
  { label: 'Modifications de contrats', enabled: false },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-slate-500 text-sm mt-1">Configuration de l'application</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
            AD
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Admin DSI</h2>
            <p className="text-sm text-slate-500">admin@harmonie-ambulance.fr</p>
            <span className="inline-block mt-1 text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              Administrateur
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Nom complet', value: 'Admin DSI', placeholder: 'Votre nom' },
            { label: 'Email', value: 'admin@harmonie-ambulance.fr', placeholder: 'votre@email.fr' },
            { label: 'Poste', value: 'Responsable DSI', placeholder: 'Votre poste' },
            { label: 'Téléphone', value: '+33 1 23 45 67 89', placeholder: '+33...' },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                {field.label}
              </label>
              <input
                type="text"
                defaultValue={field.value}
                placeholder={field.placeholder}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            Enregistrer les modifications
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <Bell className="w-4 h-4 text-violet-600" />
          <h2 className="font-semibold text-slate-900">Notifications</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {notifSettings.map((notif, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between">
              <p className="text-sm text-slate-700">{notif.label}</p>
              <button
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  notif.enabled ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    notif.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Other sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.slice(2).map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${section.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors text-sm">
                  {section.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{section.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
