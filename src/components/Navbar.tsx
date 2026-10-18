import React from 'react';
import {
  ShieldCheck,
  FileCheck2,
  Building2,
  User,
  LogOut,
  Compass,
  FileText,
  SearchCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronDown,
  Menu,
  X,
  FlaskConical,
} from 'lucide-react';
import { UserProfile } from '../types/index.js';

interface NavbarProps {
  user: UserProfile | null;
  onOpenAuth: (initialMode?: 'LOGIN' | 'REGISTER') => void;
  onLogout: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenTestSuite: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuth,
  onLogout,
  currentView,
  onNavigate,
  onOpenTestSuite,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <div
            onClick={() => onNavigate('HOME')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 p-0.5 shadow-md shadow-emerald-950/40 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
                {/* Geometric parcel lines */}
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(16,185,129,0.3)_50%,transparent_75%)] bg-[length:12px_12px]" />
                <div className="relative flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white font-['Space_Grotesk']">
                  Terra<span className="text-emerald-400">Trace</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Kenya
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
                Screen &bull; Verify &bull; Trace
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => onNavigate('HOME')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'HOME'
                  ? 'text-emerald-400 bg-slate-800/80 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onNavigate('VERIFY_WIZARD')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentView === 'VERIFY_WIZARD'
                  ? 'text-emerald-400 bg-slate-800/80 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              Screen Document
            </button>
            {user && (
              <button
                onClick={() => onNavigate('DASHBOARD')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'DASHBOARD'
                    ? 'text-emerald-400 bg-slate-800/80 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Dashboard
              </button>
            )}
            <button
              onClick={() => onNavigate('ARDHISASA')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentView === 'ARDHISASA'
                  ? 'text-emerald-400 bg-slate-800/80 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Compass className="w-4 h-4 text-amber-400" />
              Ardhisasa Guide
            </button>
            <button
              onClick={onOpenTestSuite}
              title="Run Automated Acceptance Tests"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-emerald-300 hover:bg-slate-800/50 flex items-center gap-1 transition-colors border border-slate-700/60"
            >
              <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
              <span>Acceptance Tests</span>
            </button>
          </nav>

          {/* User Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                    {user.accountType === 'COMPANY' ? (
                      <Building2 className="w-3.5 h-3.5" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-100 max-w-[120px] truncate leading-tight">
                      {user.displayName}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      {user.accountType === 'COMPANY' ? 'Organization' : 'Individual'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </button>

                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-xs font-semibold text-slate-200 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        onNavigate('DASHBOARD');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      My Verification Reports
                    </button>
                    <button
                      onClick={() => {
                        onLogout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('LOGIN')}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-200 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('REGISTER')}
                  className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950/40 transition-all hover:scale-[1.02]"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-6 space-y-2">
          <button
            onClick={() => {
              onNavigate('HOME');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 font-medium"
          >
            Overview
          </button>
          <button
            onClick={() => {
              onNavigate('VERIFY_WIZARD');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-emerald-400 hover:bg-slate-800 font-medium flex items-center gap-2"
          >
            <FileCheck2 className="w-4 h-4" />
            Screen Document
          </button>
          {user && (
            <button
              onClick={() => {
                onNavigate('DASHBOARD');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 font-medium"
            >
              User Dashboard
            </button>
          )}
          <button
            onClick={() => {
              onNavigate('ARDHISASA');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-amber-400 hover:bg-slate-800 font-medium flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            Ardhisasa Portal Guidance
          </button>
          <button
            onClick={() => {
              onOpenTestSuite();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 font-medium flex items-center gap-2"
          >
            <FlaskConical className="w-4 h-4 text-emerald-400" />
            Run Acceptance Tests
          </button>

          <div className="pt-3 border-t border-slate-800">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-1 text-xs text-slate-400">
                  Signed in as <span className="text-slate-200 font-medium">{user.displayName}</span>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-slate-800 font-medium flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onOpenAuth('LOGIN');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center text-sm font-medium text-slate-200 bg-slate-800 rounded-lg hover:bg-slate-700"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('REGISTER');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
