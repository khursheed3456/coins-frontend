'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Coins, TrendingUp, ArrowDownCircle,
  ArrowUpCircle, Users, LogOut, Shield, BarChart3, Menu, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';

const userNav = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/coins',      icon: Coins,           label: 'Markets'   },
  { href: '/portfolio',  icon: TrendingUp,       label: 'Portfolio' },
  { href: '/deposit',    icon: ArrowDownCircle,  label: 'Deposit'   },
  { href: '/withdrawal', icon: ArrowUpCircle,    label: 'Withdraw'  },
];

const adminNav = [
  { href: '/admin',              icon: BarChart3,       label: 'Overview'   },
  { href: '/admin/coins',        icon: Coins,           label: 'Coins'      },
  { href: '/admin/deposits',     icon: ArrowDownCircle, label: 'Deposits'   },
  { href: '/admin/withdrawals',  icon: ArrowUpCircle,   label: 'Withdrawals'},
  { href: '/admin/users',        icon: Users,           label: 'Users'      },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout, init, isLoading } = useAuthStore();
  const [open, setOpen] = useState(false);

  useEffect(() => { init(); }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logout();
    toast.success('Logged out');
    router.push('/auth/login');
  };

  if (isLoading || !user) return null;

  const isAdmin = user.role === 'admin';
  const nav = isAdmin ? adminNav : userNav;

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
        <Link href={isAdmin ? '/admin' : '/dashboard'} onClick={() => setOpen(false)}>
          <h1 className="font-display text-lg font-bold">
            <span className="text-cyan">COIN</span>
            <span className="text-text-primary">X</span>
            <span className="text-cyan">444</span>
          </h1>
          {isAdmin && (
            <div className="flex items-center gap-1 mt-0.5">
              <Shield size={11} className="text-cyan" />
              <span className="text-cyan text-xs font-mono">ADMIN</span>
            </div>
          )}
        </Link>
        {/* Close button mobile */}
        <button onClick={() => setOpen(false)} className="lg:hidden text-text-muted hover:text-text-primary p-1">
          <X size={20} />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150 text-sm touch-manipulation
                ${active
                  ? 'bg-cyan/10 text-cyan border border-cyan/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-2 py-3 border-t border-bg-border">
        <div className="px-3 py-2 mb-1">
          <p className="text-text-secondary text-xs truncate">{user.email}</p>
          {!isAdmin && (
            <p className="text-cyan font-mono text-sm font-medium mt-0.5">
              PKR {parseFloat(user.balance || 0).toLocaleString('en', { minimumFractionDigits: 0 })}
            </p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-text-secondary hover:text-red-loss hover:bg-red-loss/5 transition-all duration-150 touch-manipulation"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-bg-card border-b border-bg-border flex items-center justify-between px-4 h-14">
        <Link href={isAdmin ? '/admin' : '/dashboard'}>
          <span className="font-display font-bold text-base">
            <span className="text-cyan">COIN</span>
            <span className="text-text-primary">X</span>
            <span className="text-cyan">444</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {!isAdmin && (
            <span className="text-cyan font-mono text-sm font-semibold">
              PKR {parseFloat(user.balance || 0).toLocaleString()}
            </span>
          )}
          <button onClick={() => setOpen(true)} className="text-text-secondary hover:text-cyan p-1.5 touch-manipulation">
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-64 z-50 bg-bg-card border-r border-bg-border flex flex-col transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <NavContent />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 bg-bg-card border-r border-bg-border flex-col z-40">
        <NavContent />
      </aside>
    </>
  );
}
