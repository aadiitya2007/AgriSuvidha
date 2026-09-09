import React from 'react';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import { TrendingUp, ShieldCheck, Scale, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface MarketPriceComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MarketPriceComparisonModal: React.FC<MarketPriceComparisonModalProps> = ({
  isOpen,
  onClose,
}) => {
  const comparisonData = [
    {
      commodity: 'Wheat (गेहूं / गहू)',
      variety: 'Sharbati / Lokwan',
      mspGovt: 2275,
      privateTraderAvg: 1980,
      unit: 'Quintal',
      savingsPer100Qtl: 29500,
      trend: '+14.9% higher with Govt MSP',
    },
    {
      commodity: 'Soybean (सोयाबीन)',
      variety: 'Yellow Standard',
      mspGovt: 4892,
      privateTraderAvg: 4350,
      unit: 'Quintal',
      savingsPer100Qtl: 54200,
      trend: '+12.5% higher with Govt MSP',
    },
    {
      commodity: 'Paddy / Rice (धान / भात)',
      variety: 'Common Grade A',
      mspGovt: 2320,
      privateTraderAvg: 2050,
      unit: 'Quintal',
      savingsPer100Qtl: 27000,
      trend: '+13.2% higher with Govt MSP',
    },
    {
      commodity: 'Cotton (कपास / कापूस)',
      variety: 'Medium Staple',
      mspGovt: 7121,
      privateTraderAvg: 6450,
      unit: 'Quintal',
      savingsPer100Qtl: 67100,
      trend: '+10.4% higher with Govt MSP',
    },
    {
      commodity: 'Pigeon Pea / Tur (अरहर / तूर)',
      variety: 'Desi Whole',
      mspGovt: 7550,
      privateTraderAvg: 6900,
      unit: 'Quintal',
      savingsPer100Qtl: 65000,
      trend: '+9.4% higher with Govt MSP',
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Competitive Pricing: Govt MSP vs Private Traders" maxWidth="lg">
      <div className="space-y-4 text-xs text-slate-700">
        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
            <Scale className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              Transparent Market Price Comparison & Guarantee
            </h4>
            <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
              AgriSuvidha continuously tracks real-time private trader offers across local APMCs so you can verify that government procurement offers the best net returns with zero commission cuts.
            </p>
          </div>
        </div>

        {/* Pricing Cards / Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-3">Commodity</th>
                <th className="p-3 text-emerald-700">Govt MSP Rate (₹/Qtl)</th>
                <th className="p-3 text-slate-500">Private Trader (₹/Qtl)</th>
                <th className="p-3">Farmer Surplus (per 100 Qtl)</th>
                <th className="p-3 text-right">Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonData.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3">
                    <span className="font-bold text-slate-900 block">{item.commodity}</span>
                    <span className="text-[10px] text-slate-400">{item.variety}</span>
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-700 text-sm">
                    ₹{item.mspGovt.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 font-mono text-slate-500 line-through">
                    ₹{item.privateTraderAvg.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 font-mono font-black text-slate-800">
                    +₹{item.savingsPer100Qtl.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right">
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                      {item.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-500 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Why Choose AgriSuvidha Government Procurement?
          </div>
          <p>
            • <strong>Zero Middleman Deduction:</strong> Unlike private traders who levy 3%–6% unofficial 'Katta/Dami' commission, Govt MSP pays 100% of certified net weight.
          </p>
          <p>
            • <strong>Direct DBT Bank Credit:</strong> No delayed promissory notes. MSP payments disbursed directly into your Aadhaar-linked bank account within 24 to 48 hours.
          </p>
        </div>
      </div>
    </Modal>
  );
};
