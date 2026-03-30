import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, LogOut, Search, FileText, Building2, MapPin, X, CreditCard, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

interface SearchResults {
  contracts: { id: string; reference: string; title: string; category: string; status: string; supplier?: { name: string }; leaser?: { name: string } }[];
  suppliers: { id: string; name: string; contactName?: string; category?: string }[];
  agencies: { id: string; code: string; name: string; city: string }[];
  leasers: { id: string; name: string }[];
  budgetLines: { id: string; label: string; category: string; year: number }[];
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Actif',
  DENOUNCED: 'Dénoncé',
  EXPIRED: 'Expiré',
  RENEWING: 'Renouvellement',
  EXPIRING: 'Expiration',
  TO_TRANSFER: 'À transférer',
  TRANSFERRING: 'En transfert'
};

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<SearchResults>(`/search?q=${encodeURIComponent(q.trim())}`);
      setResults(data);
      const hasResults = data.contracts.length > 0 || data.suppliers.length > 0 || data.agencies.length > 0 || data.leasers.length > 0 || data.budgetLines.length > 0;
      setIsOpen(hasResults || q.trim().length >= 2);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNavigate = (path: string) => {
    setQuery('');
    setIsOpen(false);
    setResults(null);
    navigate(path);
  };

  const totalResults = results
    ? results.contracts.length + results.suppliers.length + results.agencies.length + results.leasers.length + results.budgetLines.length
    : 0;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
      {/* Search */}
      <div className="relative w-96" ref={containerRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results && totalResults > 0) setIsOpen(true); }}
          placeholder="Rechercher partout…"
          className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults(null); setIsOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Dropdown résultats */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[70vh] overflow-y-auto z-50">
            {loading && (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">Recherche en cours…</div>
            )}

            {!loading && totalResults === 0 && query.trim().length >= 2 && (
              <div className="px-4 py-6 text-sm text-slate-400 text-center">
                Aucun résultat pour « {query} »
              </div>
            )}

            {/* Contrats */}
            {results && results.contracts.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase bg-slate-50 border-b">
                  Contrats ({results.contracts.length})
                </div>
                {results.contracts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleNavigate(`/contrats/${c.id}`)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left border-b border-slate-100 last:border-0"
                  >
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800 truncate">{c.title}</div>
                      <div className="text-xs text-slate-400 flex gap-2">
                        <span className="font-mono">{c.reference}</span>
                        <span>·</span>
                        <span>{c.category}</span>
                        {c.supplier && <><span>·</span><span>{c.supplier.name}</span></>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      c.status === 'DENOUNCED' ? 'bg-red-100 text-red-700' :
                      c.status === 'EXPIRED' ? 'bg-gray-100 text-gray-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {statusLabels[c.status] || c.status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Fournisseurs */}
            {results && results.suppliers.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase bg-slate-50 border-b">
                  Fournisseurs ({results.suppliers.length})
                </div>
                {results.suppliers.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleNavigate(`/fournisseurs`)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left border-b border-slate-100 last:border-0"
                  >
                    <Building2 className="w-4 h-4 text-purple-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800">{s.name}</div>
                      <div className="text-xs text-slate-400">
                        {s.contactName && <span>{s.contactName}</span>}
                        {s.category && <><span> · </span><span>{s.category}</span></>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Agences */}
            {results && results.agencies.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase bg-slate-50 border-b">
                  Agences ({results.agencies.length})
                </div>
                {results.agencies.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleNavigate(`/agences`)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left border-b border-slate-100 last:border-0"
                  >
                    <MapPin className="w-4 h-4 text-green-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800">{a.name}</div>
                      <div className="text-xs text-slate-400">
                        <span className="font-mono">{a.code}</span>
                        <span> · </span>
                        <span>{a.city}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Leaseurs */}
            {results && results.leasers.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase bg-slate-50 border-b">
                  Leaseurs ({results.leasers.length})
                </div>
                {results.leasers.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleNavigate(`/leaseurs`)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left border-b border-slate-100 last:border-0"
                  >
                    <CreditCard className="w-4 h-4 text-orange-500 shrink-0" />
                    <div className="text-sm font-medium text-slate-800">{l.name}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Budget */}
            {results && results.budgetLines.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase bg-slate-50 border-b">
                  Budget ({results.budgetLines.length})
                </div>
                {results.budgetLines.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleNavigate(`/budget`)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left border-b border-slate-100 last:border-0"
                  >
                    <Wallet className="w-4 h-4 text-teal-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800">{b.label}</div>
                      <div className="text-xs text-slate-400">{b.category} · {b.year}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button className="relative w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.fullName.split(' ').map((n) => n[0]).join('')}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-none">{user?.fullName}</p>
            <p className="text-xs text-slate-400 mt-0.5">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-9 h-9 rounded-xl hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-slate-400 transition-colors"
          title="Se déconnecter"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
