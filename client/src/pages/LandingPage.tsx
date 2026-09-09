import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Sprout,
  CalendarCheck,
  QrCode,
  Scale,
  CreditCard,
  AlertTriangle,
  MapPin,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  const mspCommodities = [
    { name: 'Wheat (Sharbati)', code: 'WHT-01', msp: '₹2,275', change: '+₹150/qtl' },
    { name: 'Soybean (Yellow)', code: 'SOY-02', msp: '₹4,892', change: '+₹292/qtl' },
    { name: 'Cotton (Medium)', code: 'COT-03', msp: '₹7,121', change: '+₹501/qtl' },
    { name: 'Paddy (Common)', code: 'PDY-04', msp: '₹2,300', change: '+₹117/qtl' },
    { name: 'Maize (Kharif)', code: 'MAZ-05', msp: '₹2,225', change: '+₹135/qtl' },
    { name: 'Onion (Rabi)', code: 'ONN-06', msp: '₹1,850', change: 'Govt Baseline' },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* MSP Live Ticker */}
      <div className="bg-emerald-900 text-emerald-100 text-xs py-2.5 px-4 overflow-hidden border-b border-emerald-800 shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-shrink-0 font-bold uppercase tracking-wider text-emerald-300">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">{t.landing.mspTickerTitle}:</span>
            <span className="sm:hidden">MSP 2026:</span>
          </div>
          <div className="flex gap-6 overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap">
            {mspCommodities.map((item) => (
              <div key={item.code} className="inline-flex items-center gap-1.5 font-medium">
                <span className="text-white font-semibold">{item.name}:</span>
                <span className="font-mono text-amber-300 font-bold">{item.msp}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1 rounded">
                  {item.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 rounded-3xl p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden">
          {/* Decorative pattern */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:block opacity-95 pointer-events-none">
            <img
              src="/logo.png"
              alt="AgriSuvidha Official Logo"
              className="w-72 h-72 object-contain drop-shadow-2xl"
            />
          </div>

          <div className="max-w-2xl space-y-6 relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-950 uppercase tracking-wide shadow-sm">
                <ShieldCheck className="w-4 h-4" />
                SIH26032 • Team Innov8ors
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-emerald-100 border border-white/20">
                GROWTH. PROSPERITY. INNOVATION.
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight sm:leading-tight">
              {t.landing.heroTitle}
            </h1>

            <p className="text-base sm:text-lg text-emerald-100 leading-relaxed font-normal">
              {t.landing.heroSubtitle}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link to={isAuthenticated ? '/book-slot' : '/auth'}>
                <Button size="lg" className="bg-amber-400 text-amber-950 hover:bg-amber-300 font-bold shadow-lg">
                  {t.landing.bookSlotCta} <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/centres">
                <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-xs font-semibold">
                  {t.landing.findCentresCta}
                </Button>
              </Link>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-emerald-600/60 text-xs">
              <div>
                <p className="text-amber-300 font-black text-xl sm:text-2xl font-mono">14,200+</p>
                <p className="text-emerald-200">{t.landing.statFarmers}</p>
              </div>
              <div>
                <p className="text-amber-300 font-black text-xl sm:text-2xl font-mono">45,000+ T</p>
                <p className="text-emerald-200">{t.landing.statVolume}</p>
              </div>
              <div>
                <p className="text-amber-300 font-black text-xl sm:text-2xl font-mono">₹98.5 Cr</p>
                <p className="text-emerald-200">{t.landing.statPayments}</p>
              </div>
              <div>
                <p className="text-amber-300 font-black text-xl sm:text-2xl font-mono">100%</p>
                <p className="text-emerald-200">{t.landing.statCentres}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <Badge variant="harvest" className="uppercase font-bold">End-to-End Transparency</Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t.landing.featuresTitle}
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Engineered specifically to solve real mandi operational bottlenecks, prevent middleman exploitation, and guarantee fair compensation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <Card className="hover:border-emerald-500 hover:shadow-md transition-all">
            <div className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">{t.landing.feature1Title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t.landing.feature1Desc}</p>
            </div>
          </Card>

          {/* Feature 2 */}
          <Card className="hover:border-emerald-500 hover:shadow-md transition-all">
            <div className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">{t.landing.feature2Title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t.landing.feature2Desc}</p>
            </div>
          </Card>

          {/* Feature 3 */}
          <Card className="hover:border-emerald-500 hover:shadow-md transition-all">
            <div className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">{t.landing.feature3Title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t.landing.feature3Desc}</p>
            </div>
          </Card>

          {/* Feature 4 */}
          <Card className="hover:border-emerald-500 hover:shadow-md transition-all">
            <div className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">{t.landing.feature4Title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t.landing.feature4Desc}</p>
            </div>
          </Card>

          {/* Feature 5 */}
          <Card className="hover:border-emerald-500 hover:shadow-md transition-all">
            <div className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">{t.landing.feature5Title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t.landing.feature5Desc}</p>
            </div>
          </Card>

          {/* Feature 6 */}
          <Card className="hover:border-emerald-500 hover:shadow-md transition-all">
            <div className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">{t.landing.feature6Title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t.landing.feature6Desc}</p>
            </div>
          </Card>
        </div>
      </section>

      {/* 4-Step Process Section */}
      <section className="bg-emerald-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              4 Simple Steps to Sell Your Harvest
            </h2>
            <p className="text-sm text-emerald-200 mt-2">
              From your farm to bank account credit in under 48 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-emerald-800/60 p-6 rounded-2xl border border-emerald-700/60 space-y-3 relative">
              <span className="text-3xl font-black text-amber-400 font-mono">01</span>
              <h4 className="font-bold text-base">Book Slot Online</h4>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Choose your nearest APMC centre, select commodity, and pick an open morning or afternoon slot.
              </p>
            </div>

            <div className="bg-emerald-800/60 p-6 rounded-2xl border border-emerald-700/60 space-y-3 relative">
              <span className="text-3xl font-black text-amber-400 font-mono">02</span>
              <h4 className="font-bold text-base">Instant Gate Check-In</h4>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Arrive with your tractor and show your signed QR code or 6-digit OTP for instant weighbridge queue token.
              </p>
            </div>

            <div className="bg-emerald-800/60 p-6 rounded-2xl border border-emerald-700/60 space-y-3 relative">
              <span className="text-3xl font-black text-amber-400 font-mono">03</span>
              <h4 className="font-bold text-base">Digital Weighing & Grading</h4>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Automated electronic weighing scales, instant moisture %, and fair Grade A classification.
              </p>
            </div>

            <div className="bg-emerald-800/60 p-6 rounded-2xl border border-emerald-700/60 space-y-3 relative">
              <span className="text-3xl font-black text-amber-400 font-mono">04</span>
              <h4 className="font-bold text-base">Direct Benefit Payment</h4>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Receive instant digital receipt with UTR reference number and full MSP payment directly to your bank account.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
