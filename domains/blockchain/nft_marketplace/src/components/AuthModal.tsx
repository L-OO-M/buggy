import React, { useState } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { X, Droplets, LogOut, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Mail, Lock, User, Edit3, Check } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    user,
    wallet,
    updateUserProfile,
    loginWithGoogle,
    connectMetaMask,
    connectPhantom,
    loginWithEmail,
    signUpWithEmail,
    disconnectUser,
    claimFaucetETH
  } = useMarketplace();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user.name);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSaveName = () => {
    if (newName.trim()) {
      updateUserProfile(newName.trim());
      setIsEditingName(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle();
      setIsAuthModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMetaMaskAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await connectMetaMask();
      setIsAuthModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'MetaMask connection rejected');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhantomAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await connectPhantom();
      setIsAuthModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Phantom connection rejected');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (authMode === 'signin') {
        await loginWithEmail(email, password);
      } else {
        await signUpWithEmail(name || email.split('@')[0], email, password);
      }
      setIsAuthModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-['Space_Grotesk']">
      <div className="relative w-full max-w-md bg-[#0e1017] border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white tracking-tight">
            User Account & Virtual Testnet
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Every session has its own unique user identity and testnet address.
          </p>
        </div>

        {/* Active User Card with Unique ID */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3 font-mono">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover border border-white/10"
            />
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-32 px-2 py-0.5 bg-black/60 border border-white/20 rounded text-xs text-white"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 rounded bg-cyan-500 text-black"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white truncate">@{user.name}</span>
                  <button
                    onClick={() => {
                      setNewName(user.name);
                      setIsEditingName(true);
                    }}
                    className="text-slate-500 hover:text-cyan-400"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="text-[10px] text-cyan-400">
                UNIQUE USER ID: <span className="text-white">{user.id}</span>
              </div>
            </div>
          </div>

          {/* Wallet Address & Balance */}
          <div className="pt-2 border-t border-white/5 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-400">
              <span>TESTNET ADDRESS</span>
              <span className="text-slate-200">{wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>AVAILABLE BALANCE</span>
              <span className="text-white font-bold text-sm">{wallet.balance} ETH</span>
            </div>
          </div>
        </div>

        {/* Testnet Faucet */}
        <button
          onClick={claimFaucetETH}
          className="w-full py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Droplets className="w-4 h-4 text-cyan-400" />
          <span>CLAIM +5.00 TEST ETH (FAUCET)</span>
        </button>

        {/* Connect options: Google, MetaMask, Phantom */}
        <div className="space-y-2 pt-2 border-t border-white/5 font-mono">
          <span className="text-[11px] text-slate-500 uppercase block">Switch Wallet / Sign-In Provider</span>
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full py-2 px-3 rounded-xl bg-white text-slate-900 font-medium text-xs hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Connect with Google</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleMetaMaskAuth}
                disabled={isLoading}
                className="py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-mono text-xs transition-all flex items-center justify-center gap-2"
              >
                <span>🦊</span>
                <span>MetaMask</span>
              </button>

              <button
                type="button"
                onClick={handlePhantomAuth}
                disabled={isLoading}
                className="py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-mono text-xs transition-all flex items-center justify-center gap-2"
              >
                <span>👻</span>
                <span>Phantom</span>
              </button>
            </div>
          </div>
        </div>

        {/* Reset session */}
        <button
          onClick={disconnectUser}
          className="w-full py-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/5 font-mono text-xs transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Generate New Random Identity</span>
        </button>
      </div>
    </div>
  );
};
