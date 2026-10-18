import React, { useState } from 'react';
import {
  X,
  User,
  Building2,
  Lock,
  Mail,
  Phone,
  Globe,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { AccountType, UserProfile } from '../types/index.js';
import { api, authStorage } from '../services/api.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialMode?: 'LOGIN' | 'REGISTER';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'REGISTER',
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(initialMode);
  const [accountType, setAccountType] = useState<AccountType>('INDIVIDUAL');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('+254 ');
  const [country, setCountry] = useState('Kenya');
  const [idNumber, setIdNumber] = useState('');

  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'REGISTER') {
        if (!acceptedTerms) {
          throw new Error('Please accept the Terms of Service and Privacy Notice to continue.');
        }

        const res = await api.register({
          email,
          password,
          displayName,
          accountType,
          phone,
          country,
          companyName: accountType === 'COMPANY' ? companyName : undefined,
          registrationNumber: accountType === 'COMPANY' ? registrationNumber : undefined,
          idNumber: idNumber || undefined,
        });

        authStorage.setToken(res.token);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.login({ email, password });
        authStorage.setToken(res.token);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            TerraTrace Kenya
          </div>
          <h3 className="text-2xl font-bold font-['Space_Grotesk'] text-white">
            {mode === 'REGISTER' ? 'Create Your Account' : 'Welcome Back'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'REGISTER'
              ? 'Select your account type to begin screening land documents.'
              : 'Sign in to access your saved verification runs and documents.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Mode Toggle for Login / Register */}
        <div className="flex rounded-xl bg-slate-950 p-1 mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'REGISTER'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'LOGIN'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {mode === 'REGISTER' && (
          /* Account Selection Cards */
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div
              onClick={() => setAccountType('INDIVIDUAL')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                accountType === 'INDIVIDUAL'
                  ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <User
                  className={`w-4 h-4 ${
                    accountType === 'INDIVIDUAL' ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold text-white">Individual</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                For landowners, property buyers, and diaspora investors.
              </p>
            </div>

            <div
              onClick={() => setAccountType('COMPANY')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                accountType === 'COMPANY'
                  ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Building2
                  className={`w-4 h-4 ${
                    accountType === 'COMPANY' ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold text-white">Organization</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                For law firms, SACCOs, banks, survey firms & developers.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Legal Name {accountType === 'COMPANY' && '(Authorized Representative)'}
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Wanjiku Mwangi"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {mode === 'REGISTER' && accountType === 'COMPANY' && (
            <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                Company Details (Self-Declared)
              </span>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Registered Company / SACCO Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Rift Valley Holdings Ltd"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Business Registration / CPR Number (Optional)
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="e.g., CPR/2021/10492"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {mode === 'REGISTER' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Phone (Kenya +254)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 700 000 000"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {mode === 'REGISTER' && (
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-950"
                />
                <span className="text-[11px] text-slate-400 leading-tight">
                  I accept the TerraTrace Terms of Service and acknowledge that TerraTrace is an independent document screening platform that does not replace official Ardhisasa land searches.
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{mode === 'REGISTER' ? 'Complete Registration' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            {mode === 'REGISTER' ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('LOGIN');
                    setError(null);
                  }}
                  className="text-emerald-400 font-medium hover:underline"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account yet?{' '}
                <button
                  onClick={() => {
                    setMode('REGISTER');
                    setError(null);
                  }}
                  className="text-emerald-400 font-medium hover:underline"
                >
                  Create an Account
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
