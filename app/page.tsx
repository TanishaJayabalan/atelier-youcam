import React from 'react';
import Link from 'next/link';
import { ArrowRight, ScanFace, Sparkles, Palette, Droplets, Search, Heart, User } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F6F4F0] text-[#2C2C2C] font-sans selection:bg-[#D9CDB8] selection:text-[#2C2C2C]">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 px-6 py-6 flex items-center justify-between">
        <div className="text-2xl font-serif tracking-widest text-[#2C2C2C]">ATELIER</div>
        <Link 
          href="/login" 
          className="text-xs font-bold text-[#2C2C2C] uppercase tracking-wider hover:text-[#694A33] transition-colors"
        >
          Log in
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full h-[90vh] min-h-[600px] flex items-center px-6 lg:px-20 overflow-hidden">
        {/* Background Image/Shape */}
        <div className="absolute top-0 right-0 w-full md:w-[65%] h-full">
          <div className="absolute inset-0 bg-gradient-to-r from-[#F6F4F0] via-[#F6F4F0]/80 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=2070&auto=format&fit=crop" 
            alt="Hero Beauty Portrait"
            className="w-full h-full object-cover object-center"
          />
        </div>
        
        <div className="relative z-20 max-w-xl mt-12">
          <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-stone-500 mb-6">
            AI Beauty, Personalized for you
          </p>
          <h1 className="text-5xl md:text-7xl font-serif text-[#2C2C2C] leading-[1.1] mb-6">
            Understand.<br />Enhance.<br />Be you.
          </h1>
          <p className="text-base text-stone-600 mb-10 max-w-sm">
            AI-powered analysis for hair, makeup, clothes and skin. Personalized for every you.
          </p>
          <Link 
            href="/login" 
            className="inline-flex items-center gap-3 bg-[#694A33] hover:bg-[#523926] text-white px-8 py-4 rounded-xl transition-all font-medium text-sm shadow-xl shadow-[#694A33]/20"
          >
            Start Your Analysis
            <ArrowRight className="w-4 h-4" />
          </Link>


        </div>
      </section>

      {/* Feature Highlights Bar */}
      <section className="px-6 lg:px-20 -mt-10 relative z-30 pb-20">
        <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-start gap-4">
            <ScanFace className="w-6 h-6 text-[#694A33] shrink-0 mt-1" />
            <div>
              <h4 className="text-xs font-bold text-[#2C2C2C] mb-1">AI Analysis</h4>
              <p className="text-[11px] text-stone-500 leading-relaxed">Science-backed insights for hair, makeup & skin.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Sparkles className="w-6 h-6 text-[#694A33] shrink-0 mt-1" />
            <div>
              <h4 className="text-xs font-bold text-[#2C2C2C] mb-1">Virtual Try-On</h4>
              <p className="text-[11px] text-stone-500 leading-relaxed">Try hairstyles, makeup and clothes instantly.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Palette className="w-6 h-6 text-[#694A33] shrink-0 mt-1" />
            <div>
              <h4 className="text-xs font-bold text-[#2C2C2C] mb-1">Personalized Matches</h4>
              <p className="text-[11px] text-stone-500 leading-relaxed">Find what suits your unique features.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Droplets className="w-6 h-6 text-[#694A33] shrink-0 mt-1" />
            <div>
              <h4 className="text-xs font-bold text-[#2C2C2C] mb-1">Custom Routines</h4>
              <p className="text-[11px] text-stone-500 leading-relaxed">Tailored hair & skincare routines for you.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
