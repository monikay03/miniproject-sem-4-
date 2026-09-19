import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, ShieldCheck, Heart, ArrowRight, Store, ShoppingBag } from 'lucide-react';

export default function AuthGate() {
  const { login } = useAuth();
  const [role, setRole] = useState('buyer'); // 'buyer' | 'sister'

  return (
    <div className="min-h-screen bg-[#faf7f5] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 border border-warm-200">
        
        {/* Left Info Panel */}
        <div className="bg-gradient-to-tr from-pink-900 via-[#831843] to-pink-850 text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Background overlay decorations */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-pink-600/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="z-10">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white text-pink-900 flex items-center justify-center shadow-lg font-serif text-2xl font-bold italic">
                u
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-tight">udaan</span>
                <span className="text-[10px] tracking-widest uppercase font-semibold text-pink-300 -mt-1">
                  Empowering Women
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold font-serif leading-tight mt-6">
              Empowering Rural Artisans & Skilled Sisters
            </h1>
            <p className="text-pink-100 text-sm mt-4 leading-relaxed font-light">
              Connecting local service providers and craft weavers directly to customers with zero platform commissions.
            </p>
          </div>

          <div className="space-y-4 z-10 pt-8 border-t border-white/10 mt-8">
            <div className="flex items-center gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-pink-300 shrink-0" />
              <span>100% Direct Bank Transfer to Rural Women</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Heart className="w-5 h-5 text-pink-300 shrink-0" />
              <span>3,500+ Active Self-Help Groups Supported</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Sparkles className="w-5 h-5 text-pink-300 shrink-0" />
              <span>Skill Validation & Pricing Transparency</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold font-serif text-gray-900">
              Welcome to Udaan
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Select your role and sign in securely with Google
            </p>
          </div>

          <div className="space-y-6">
            {/* Role Selection (2-Column Clean Layout) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Select Account Role</label>
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`py-3.5 px-4 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-2 ${
                    role === 'buyer'
                      ? 'bg-pink-50 border-brand-pink text-brand-pink ring-2 ring-pink-500/20 shadow-sm'
                      : 'bg-white border-warm-300 text-gray-600 hover:bg-warm-50'
                  }`}
                >
                  <span className="text-2xl">🛍️</span>
                  <div className="text-center">
                    <span className="block font-bold text-sm">Buyer / Client</span>
                    <span className="text-[10px] text-gray-400 font-normal">Browse & Book</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('sister')}
                  className={`py-3.5 px-4 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-2 ${
                    role === 'sister'
                      ? 'bg-pink-50 border-brand-pink text-brand-pink ring-2 ring-pink-500/20 shadow-sm'
                      : 'bg-white border-warm-300 text-gray-600 hover:bg-warm-50'
                  }`}
                >
                  <span className="text-2xl">👩‍🔧</span>
                  <div className="text-center">
                    <span className="block font-bold text-sm">Skilled Sister</span>
                    <span className="text-[10px] text-gray-400 font-normal">Seller & Services</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={() => window.location.href = `/auth/google?role=${role}`}
              className="w-full bg-white border border-warm-300 hover:border-pink-300 hover:bg-pink-50 text-gray-700 font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-3 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98 1 12 1 7.35 1 3.37 3.68 1.48 7.58l3.78 2.93C6.18 7.37 8.87 5.04 12 5.04z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.88c2.17-2 3.42-4.94 3.42-8.61z"/>
                <path fill="#FBBC05" d="M5.26 10.51c-.24-.73-.38-1.5-.38-2.3 0-.8.14-1.57.38-2.3L1.48 3.51C.53 5.41 0 7.54 0 9.8s.53 4.39 1.48 6.29l3.78-2.93a7.87 7.87 0 010-4.65z"/>
                <path fill="#34A853" d="M12 18.96c-3.13 0-5.82-2.33-6.74-5.47l-3.78 2.93C3.37 20.32 7.35 23 12 23c3.24 0 6.06-1.07 8.08-2.91l-3.71-2.88c-1.1.74-2.5 1.18-4.37 1.18z"/>
              </svg>
              <span>Continue with Google as {role === 'buyer' ? 'Buyer' : 'Skilled Sister'}</span>
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

