'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Mail, Lock, User, Key, Check, AlertCircle } from 'lucide-react';
import { updateEnvSecrets } from '@/app/actions/env';

export default function LoginPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Auto-redirect if already logged in
  useEffect(() => {
    const existing = localStorage.getItem('atelier_user');
    if (existing) {
      router.replace('/analyze');
    }
  }, [router]);

  // API Config State
  const [apiClientId, setApiClientId] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isUpdatingEnv, setIsUpdatingEnv] = useState(false);
  const [envUpdateMessage, setEnvUpdateMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleUpdateEnv = async () => {
    if (!apiClientId || !apiSecret) {
      setEnvUpdateMessage({ type: 'error', text: 'Please fill out both API fields.' });
      return;
    }
    setIsUpdatingEnv(true);
    setEnvUpdateMessage(null);
    try {
      const res = await updateEnvSecrets(apiClientId, apiSecret);
      if (res.success) {
        setEnvUpdateMessage({ type: 'success', text: 'Environment secrets successfully updated!' });
        setApiClientId('');
        setApiSecret('');
      } else {
        setEnvUpdateMessage({ type: 'error', text: res.error || 'Failed to update env.' });
      }
    } catch (err: any) {
      setEnvUpdateMessage({ type: 'error', text: err.message });
    } finally {
      setIsUpdatingEnv(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cred = (isLogin ? email : name) || 'Beauty Connoisseur';
    localStorage.setItem('atelier_user', cred);
    document.cookie = `atelier_user=${encodeURIComponent(cred)}; path=/; max-age=2592000`;
    setStep(2);
  };

  const handleSkip = () => {
    router.push('/analyze');
  };

  return (
    <main className="min-h-screen bg-[#F6F4F0] flex selection:bg-[#D9CDB8] selection:text-[#2C2C2C]">
      
      {/* Left side: Aesthetic image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-[#EBE7DF]">
        <div className="absolute inset-0 bg-black/5 z-10" />
        <img 
          src="/images/skincare-collage-1.jpg" 
          alt="Luminous beauty and skincare portrait"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-8 left-8 z-20">
          <Link href="/" className="flex items-center gap-2 text-white/90 hover:text-white drop-shadow-md transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        
        {/* Mobile back button */}
        <div className="absolute top-8 left-8 lg:hidden">
          <Link href="/" className="flex items-center gap-2 text-stone-500 hover:text-[#2C2C2C] transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>

        <div className="max-w-md w-full space-y-8">
          {step === 1 ? (
            <>
              <div className="text-center">
                <Link href="/" className="text-2xl font-serif tracking-widest text-[#2C2C2C] inline-block mb-12">
                  ATELIER
                </Link>
                <h2 className="text-3xl font-serif text-[#2C2C2C]">
                  {isLogin ? 'Welcome back' : 'Create an account'}
                </h2>
                <p className="mt-3 text-sm text-stone-500">
                  {isLogin 
                    ? 'Enter your details to access your personalized routines.' 
                    : 'Join us to get your AI-powered styling and skincare analysis.'}
                </p>
              </div>

              <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
                {!isLogin && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-stone-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-stone-300 rounded-xl bg-transparent placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#694A33] focus:border-[#694A33] sm:text-sm transition-all"
                        placeholder="Jane Doe"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-stone-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-stone-300 rounded-xl bg-transparent placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#694A33] focus:border-[#694A33] sm:text-sm transition-all"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider">
                      Password
                    </label>
                    {isLogin && (
                      <a href="#" className="text-xs font-medium text-[#694A33] hover:underline">
                        Forgot password?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-stone-400" />
                    </div>
                    <input
                      type="password"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-stone-300 rounded-xl bg-transparent placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#694A33] focus:border-[#694A33] sm:text-sm transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-[#694A33] hover:bg-[#523926] text-white py-3.5 rounded-xl transition-all font-medium text-sm shadow-lg shadow-[#694A33]/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#694A33] focus:ring-offset-[#F6F4F0]"
                  >
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-stone-600">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className="font-semibold text-[#2C2C2C] hover:underline transition-all"
                  >
                    {isLogin ? 'Sign up' : 'Log in'}
                  </button>
                </p>
              </div>
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <Link href="/" className="text-2xl font-serif tracking-widest text-[#2C2C2C] inline-block mb-12">
                  ATELIER
                </Link>
                <h2 className="text-2xl font-serif text-[#2C2C2C]">
                  Configure AI Services
                </h2>
                <p className="mt-3 text-sm text-stone-500">
                  Enter your YouCam API credentials to power the backend analysis. You can also skip this if you've already configured them.
                </p>
              </div>

              <div className="mt-10 space-y-5">
                <div>
                  <label className="block text-[10px] font-semibold text-stone-600 uppercase tracking-wider mb-2">
                    YouCam Client ID (API Key)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-4 w-4 text-stone-400" />
                    </div>
                    <input
                      type="text"
                      value={apiClientId}
                      onChange={(e) => setApiClientId(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-stone-300 rounded-xl bg-transparent placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#694A33] focus:border-[#694A33] sm:text-sm transition-all"
                      placeholder="Paste your Client ID here"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-semibold text-stone-600 uppercase tracking-wider mb-2">
                    YouCam Client Secret
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-stone-400" />
                    </div>
                    <input
                      type="password"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-stone-300 rounded-xl bg-transparent placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#694A33] focus:border-[#694A33] sm:text-sm transition-all"
                      placeholder="Paste your Client Secret here"
                    />
                  </div>
                </div>

                {envUpdateMessage && (
                  <div className={`flex items-start gap-2 p-3 rounded-xl text-xs mt-2 ${
                    envUpdateMessage.type === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {envUpdateMessage.type === 'success' ? (
                      <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    )}
                    <span>{envUpdateMessage.text}</span>
                  </div>
                )}

                <div className="pt-6 space-y-3">
                  <button
                    type="button"
                    onClick={async () => {
                      await handleUpdateEnv();
                      if (apiClientId && apiSecret) {
                        router.push('/analyze');
                      }
                    }}
                    disabled={isUpdatingEnv || !apiClientId || !apiSecret}
                    className="w-full flex items-center justify-center gap-2 bg-[#694A33] hover:bg-[#523926] text-white py-3.5 rounded-xl transition-all font-medium text-sm shadow-lg shadow-[#694A33]/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#694A33] focus:ring-offset-[#F6F4F0] disabled:opacity-50"
                  >
                    {isUpdatingEnv ? 'Saving...' : 'Save & Continue to Dashboard'}
                    {!isUpdatingEnv && <ArrowRight className="w-4 h-4" />}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="w-full flex items-center justify-center gap-2 bg-transparent text-stone-500 hover:text-[#2C2C2C] py-3 rounded-xl transition-all font-medium text-sm focus:outline-none"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
