import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  TrendingUp,
  Building2,
  MapPin,
  Users,
  Settings,
  ChevronDown,
  LayoutTemplate,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  children?: { to: string; label: string }[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/contrats', icon: FileText, label: 'Contrats' },
  { to: '/calendrier', icon: CalendarDays, label: 'Calendrier' },
  {
    to: '/budget',
    icon: TrendingUp,
    label: 'Budget',
    children: [
      { to: '/budget/synthese', label: 'Synthèse' },
      { to: '/budget/agences', label: 'Par agences' },
      { to: '/budget/lignes', label: 'Lignes budgétaires' },
    ],
  },
  { to: '/fournisseurs', icon: Building2, label: 'Fournisseurs' },
  { to: '/agences', icon: MapPin, label: 'Agences' },
  { to: '/modeles-ventilation', icon: LayoutTemplate, label: 'Modèles ventilation' },
  { to: '/utilisateurs', icon: Users, label: 'Utilisateurs' },
  { to: '/parametres', icon: Settings, label: 'Paramètres' },
];

function NavGroup({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors text-white/80 hover:bg-white/10 hover:text-white"
      >
        <item.icon className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="ml-7 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
          {item.children!.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#2d5a8e] text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside
      className="flex flex-col h-screen shrink-0"
      style={{ width: '260px', backgroundColor: '#1e3a5f' }}
    >
      {/* Header */}
      <div
        className="px-5 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}
      >
        <p className="font-semibold text-base text-white leading-tight">DSI Contract Manager</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Harmonie Ambulance
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) =>
          item.children ? (
            <NavGroup key={item.to} item={item} />
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/contrats'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#2d5a8e] text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>
    </aside>
  );
}
