import React, { useState } from 'react';
import { Mail, Lock, X, Cpu, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, isFirebaseEnabled } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!email || !password || (!isLogin && !displayName)) {
      setError("Please populate all telemetry fields.");
      setLoading(false);
      return;
    }

    try {
      if (isFirebaseEnabled && auth) {
        if (isLogin) {
          await signInWithEmailAndPassword(auth, email, password);
          setSuccess("Neural link established. Access authorized.");
        } else {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, { displayName });
          setSuccess("Planetary profile registered. Neural link active.");
        }
      } else {
        // Simulated local auth mode if firebase is offline
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSuccess(`[SIMULATED AUTH] Welcome, ${isLogin ? email.split('@')[0] : displayName}. Interface unlocked.`);
        
        // Mock a localStorage session for user state persistence offline
        const mockUser = {
          email,
          displayName: isLogin ? email.split('@')[0] : displayName,
          uid: "mock-uid-12345"
        };
        localStorage.setItem('climatevision_mock_user', JSON.stringify(mockUser));
        // Force context reload by triggering local event
        window.dispatchEvent(new Event('storage'));
      }

      setTimeout(() => {
        onClose();
        setEmail('');
        setPassword('');
        setDisplayName('');
        setSuccess(null);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Operation failed.";
      if (msg.includes("auth/invalid-credential") || msg.includes("auth/wrong-password")) {
        setError("Telemetry mismatch. Access denied.");
      } else if (msg.includes("auth/email-already-in-use")) {
        setError("Email registration vector already allocated.");
      } else if (msg.includes("auth/weak-password")) {
        setError("Cryptographic password complexity insufficient (min 6 chars).");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-[calc(100vw-2rem)] sm:w-full max-w-md mx-auto overflow-hidden glass-panel rounded-2xl border border-cyan-500/30 bg-slate-950/90 shadow-[0_0_50px_rgba(6,182,212,0.2)] p-4 sm:p-6 select-none z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white cursor-pointer hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Futuristic Top Scanner Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

            {/* Header */}
            <div className="flex flex-col items-center text-center mt-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                <Cpu className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
                {isFirebaseEnabled ? "Planetary Neural Link" : "Local Scanner Simulation"}
              </span>
              <h2 className="text-xl font-display font-medium text-white mt-1">
                {isLogin ? "ESTABLISH CONNECT" : "ALLOCATE TERMINAL PROFILE"}
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Profile Name (Registration only) */}
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5"
                  >
                    <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">Operator Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Commander Shepard"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-slate-900/60 border border-white/10 text-white placeholder-gray-600 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-400/80 font-mono transition-colors"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">Respiration Vector (Email)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="operator@climatevision.net"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 text-white placeholder-gray-600 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-400/80 font-mono transition-colors"
                  />
                </div>
              </div>

              {/* Cryptographic Key (Password) */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-bold">Cryptographic Key (Password)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 text-white placeholder-gray-600 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-400/80 font-mono transition-colors"
                  />
                </div>
              </div>

              {/* Feedbacks */}
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-start gap-2.5 font-mono animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-start gap-2.5 font-mono">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mt-1.5 flex-shrink-0" />
                  <div>{success}</div>
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500/80 to-indigo-600/80 hover:from-cyan-500 hover:to-indigo-600 border border-cyan-400/20 text-xs font-mono font-medium tracking-widest text-white shadow-[0_0_15px_rgba(6,182,212,0.15)] disabled:opacity-50 transition-all cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                    DECRYPTING PROTOCOLS...
                  </>
                ) : isLogin ? (
                  "ESTABLISH UPLINK"
                ) : (
                  "REGISTER PROTOCOLS"
                )}
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-5 text-center text-xs font-mono text-gray-500">
              {isLogin ? "No active operator profile? " : "Operator profile already active? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer transition-colors"
              >
                {isLogin ? "Register Core Node" : "Uplink Session"}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
