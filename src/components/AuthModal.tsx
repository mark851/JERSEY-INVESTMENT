import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  User,
  Ticket,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signup' | 'signin';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signup' }) => {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState<'signup' | 'signin'>(initialMode);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [invitationCode, setInvitationCode] = useState(() => {
    try {
      return localStorage.getItem('jersey_referred_by') || '';
    } catch {
      return '';
    }
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (initialMode) {
        setMode(initialMode);
      }
      try {
        const storedRef = localStorage.getItem('jersey_referred_by');
        if (storedRef && !invitationCode) {
          setInvitationCode(storedRef);
        }
      } catch {}
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'signup') {
      const cleanUsername = username.trim().toLowerCase();
      const cleanPhone = phone.trim().replace(/\D/g, '');

      // STEP 1 VALIDATION: Username First
      if (!cleanUsername) {
        setErrorMsg('Step 1: Please enter your username first');
        return;
      }
      if (cleanUsername.length < 3) {
        setErrorMsg('Step 1: Username must be at least 3 characters long');
        return;
      }
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
        setErrorMsg('Step 1: Username can only contain letters, numbers, and underscores (3-30 characters)');
        return;
      }

      // STEP 2 VALIDATION: Phone Number Second
      if (!cleanPhone) {
        setErrorMsg('Step 2: Please enter your phone number second (MTN or Airtel Money)');
        return;
      }
      if (cleanPhone.length < 9) {
        setErrorMsg('Step 2: Please enter a valid Ugandan phone number (at least 9 digits, e.g. 077XXXXXXX)');
        return;
      }

      // STEP 3 VALIDATION: Password Third
      if (!password) {
        setErrorMsg('Step 3: Please enter your password');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Step 3: Password must be at least 6 characters long');
        return;
      }
      if (confirmPassword && password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify both password fields match.');
        return;
      }

      setLoading(true);
      try {
        const res = await signUp(cleanUsername, cleanPhone, password, invitationCode);
        if (res.success) {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
          onClose();
        } else {
          setErrorMsg(res.message);
        }
      } catch {
        setErrorMsg('An unexpected error occurred during registration. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      const loginTarget = identifier.trim() || username.trim() || phone.trim();
      if (!loginTarget) {
        setErrorMsg('Please enter your username or phone number');
        return;
      }
      if (!password) {
        setErrorMsg('Please enter your password');
        return;
      }

      setLoading(true);
      try {
        const res = await signIn(loginTarget, password);
        if (res.success) {
          onClose();
        } else {
          setErrorMsg(res.message);
        }
      } catch {
        setErrorMsg('An unexpected error occurred during sign in. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0f1c2e] rounded-3xl max-w-sm w-full my-auto overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1764c4] via-[#1d70d6] to-[#1452a0] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/file_00000000acac8243ac7fafd811eb09cc.png"
              alt="Jersey Investment"
              className="w-9 h-9 rounded-xl object-cover border border-amber-300/40 shadow-sm shrink-0"
            />
            <div>
              <h3 className="font-extrabold text-base leading-tight">JERSEY INVESTMENT</h3>
              <p className="text-[11px] text-blue-100">
                {mode === 'signup' ? 'New Account Registration' : 'Member Account Sign In'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition active:scale-90"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Sign Up vs Sign In */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-black text-center transition border-b-2 flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'border-[#1764c4] text-[#1764c4] dark:text-blue-400 bg-white dark:bg-[#0f1c2e]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Create Account</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-black text-center transition border-b-2 ${
              mode === 'signin'
                ? 'border-[#1764c4] text-[#1764c4] dark:text-blue-400 bg-white dark:bg-[#0f1c2e]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-5 space-y-3.5 max-h-[78vh] overflow-y-auto">
          {/* Welcome Bonus Notice for Sign Up */}
          {mode === 'signup' && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-2.5 flex items-center gap-2.5 shadow-xs">
              <div className="w-7 h-7 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <span className="font-black text-amber-950 dark:text-amber-300 block">UGX 3,000 Welcome Bonus</span>
                <span className="text-amber-800 dark:text-amber-400 text-[10px]">
                  Join today to receive free UGX 3,000 trial capital instantly.
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* SIGN UP FIELDS: Strict Order (1: Username, 2: Phone Number, 3: Password) */}
            {mode === 'signup' ? (
              <>
                {/* 1. FIRST: USERNAME */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#1764c4] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        1
                      </span>
                      <span>Username (First)</span>
                    </label>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      Step 1
                    </span>
                  </div>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose unique username (e.g. jersey_pro)"
                      pattern="^[a-zA-Z0-9_]{3,30}$"
                      title="Letters, numbers, and underscores only (3-30 characters)"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-[#1764c4]"
                      required
                      minLength={3}
                      maxLength={30}
                      autoFocus
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 pl-1">
                    Your unique member username used to log in
                  </p>
                </div>

                {/* 2. SECOND: PHONE NUMBER */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#1764c4] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        2
                      </span>
                      <span>Phone Number (Second)</span>
                    </label>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      MTN / Airtel
                    </span>
                  </div>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0771234567 or 25677..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-[#1764c4]"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 pl-1">
                    Used for instant Mobile Money deposits and cash payouts
                  </p>
                </div>

                {/* 3. THIRD: PASSWORD */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#1764c4] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        3
                      </span>
                      <span>Password (Third)</span>
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400">Min 6 chars</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter secure password"
                      className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-[#1764c4]"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Confirm Password
                    </label>
                    {confirmPassword && password && (
                      <span
                        className={`text-[10px] font-bold flex items-center gap-1 ${
                          password === confirmPassword ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                        }`}
                      >
                        {password === confirmPassword ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Match</span>
                          </>
                        ) : (
                          'Mismatch'
                        )}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className={`w-full pl-9 pr-10 py-2 rounded-xl border text-xs font-bold text-slate-900 dark:text-white dark:bg-slate-900/50 focus:outline-none focus:ring-2 ${
                        confirmPassword && password !== confirmPassword
                          ? 'border-rose-400 focus:ring-rose-400'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-[#1764c4]'
                      }`}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Invitation Code (Optional) */}
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                    Invitation Code <span className="text-[10px] font-normal text-slate-400">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Ticket className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value)}
                      placeholder="e.g. 5-digit referral code"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-[#1764c4]"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* SIGN IN FIELDS */
              <>
                {/* 1. Username or Phone Identifier */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Username or Phone Number
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter your username or phone number"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-[#1764c4]"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* 2. Password Field */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your account password"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-[#1764c4]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#1764c4] to-[#1e76e0] text-white font-black text-xs shadow-md shadow-blue-500/20 hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <span>Processing...</span>
              ) : mode === 'signup' ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Register & Claim UGX 3,000 Bonus</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between modes */}
          <div className="pt-2 text-center">
            {mode === 'signup' ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-[#1764c4] dark:text-blue-400 hover:underline"
                >
                  Sign In here
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                New member?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-[#1764c4] dark:text-blue-400 hover:underline"
                >
                  Register with username first
                </button>
              </p>
            )}
          </div>

          <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1 pt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 inline" /> Official Jersey Investment Security
          </p>
        </div>
      </div>
    </div>
  );
};
