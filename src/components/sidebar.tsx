'use client';

import { useAuth } from '@/lib/auth-context';

type View = 'dashboard' | 'connections' | 'alerts' | 'saved-queries' | 'settings';

interface SidebarProps {
  activeView: View;
  onViewChange: (v: View) => void;
}

const navItems: { id: View; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { id: 'saved-queries', label: 'Saved Queries', icon: 'M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M8 4l4 4 4-4M12 8v8' },
  { id: 'connections', label: 'Connections', icon: 'M6 8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z' },
  { id: 'alerts', label: 'Alerts', icon: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' },
  { id: 'settings', label: 'Settings', icon: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { user } = useAuth();
  const displayName = user?.displayName ?? '';
  const email = user?.email ?? 'user@datarola.com';
  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : (email[0] ?? 'U').toUpperCase();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-white/5 bg-[#091118] py-5">
      {/* Logo */}
      <div className="px-5 mb-4 flex items-center gap-2.5">
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="7" fill="url(#side-logo)" />
          <path d="M8 10h4l3 6 3-6h4" stroke="#0a0e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="side-logo" x1="0" y1="0" x2="28" y2="28">
              <stop stopColor="#338dfc" /><stop offset="1" stopColor="#59b1ff" />
            </linearGradient>
          </defs>
        </svg>
        <span className="font-bold text-white">DataRola</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${activeView === item.id ? 'bg-brand-600/15 text-brand-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            {item.label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="mx-3 mt-auto rounded-xl border border-white/5 bg-white/[0.02] p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-medium text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white">{displayName || email.split('@')[0]}</p>
            <p className="truncate text-[11px] text-slate-500">Free plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
