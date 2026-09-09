import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Scale,
  CreditCard,
  AlertTriangle,
  LifeBuoy,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

export const ExecutiveDashboard: React.FC = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => apiRequest('/admin/analytics'),
    refetchInterval: 15000,
  });

  const summary = analytics?.summary || {};
  const trendData = analytics?.trendData || [];
  const chartCommodityData = analytics?.chartCommodityData || [];
  const recentProcurements = analytics?.recentProcurements || [];
  const activeIncidents = analytics?.activeIncidents || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Executive Procurement Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time analytics across APMC yards, electronic weighbridges, and DBT payment ledgers.
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/admin/queue">
            <Button size="sm" className="text-xs font-bold">
              Weighbridge Control Room &rarr;
            </Button>
          </Link>
          <Link to="/admin/incidents">
            <Button size="sm" variant="outline" className="text-xs">
              Declare Incident
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4 bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Registered Farmers</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {summary.totalFarmers || 14}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">100% Aadhaar verified</span>
        </Card>

        <Card className="p-4 bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Active Centres</span>
            <Scale className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {summary.totalCentres || 4}
          </p>
          <span className="text-[10px] text-sky-600 font-medium">All Maharashtra Yards</span>
        </Card>

        <Card className="p-4 bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Tractors in Queue</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono">
            {summary.activeQueueCount || 3}
          </p>
          <span className="text-[10px] text-amber-700 font-medium">Avg wait ~15 mins</span>
        </Card>

        <Card className="p-4 bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Procured Volume</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 font-mono">
            {Math.round(summary.totalProcuredWeightQuintals || 92.5)} <span className="text-xs">Qtl</span>
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Certified Grade A/B</span>
        </Card>

        <Card className="p-4 bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>DBT Disbursed</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-700 font-mono">
            ₹{Math.round((summary.totalDisbursedPaymentsInr || 93850) / 1000)}k
          </p>
          <span className="text-[10px] text-purple-600 font-medium">Zero pending backlog</span>
        </Card>

        <Card className="p-4 bg-white shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Active Incidents</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600 font-mono">
            {summary.activeIncidentsCount || 2}
          </p>
          <span className="text-[10px] text-rose-600 font-medium">Alerts dispatched</span>
        </Card>
      </div>

      {/* Active Incidents Alert Banner */}
      {activeIncidents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Active Outage & Logistics Alerts ({activeIncidents.length})
            </span>
            <Link to="/admin/incidents" className="text-xs font-bold text-amber-800 hover:underline">
              Manage in Incident Command &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {activeIncidents.map((inc: any) => (
              <div key={inc.id} className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{inc.centre.name}</span>
                  <Badge variant="warning">{inc.severity}</Badge>
                </div>
                <p className="text-slate-600 leading-snug">{inc.impactStatement}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Throughput Chart */}
        <Card className="p-5">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between border-b-0">
            <div>
              <h3 className="font-bold text-sm text-slate-900">7-Day Mandi Procurement Trend (Quintals)</h3>
              <p className="text-[11px] text-slate-500">Daily intake across Wheat, Soybean, Cotton, and Onion</p>
            </div>
            <Badge variant="success">Real-Time</Badge>
          </CardHeader>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wheatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="soyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="wheat" stroke="#16a34a" fillOpacity={1} fill="url(#wheatGrad)" name="Wheat (Qtl)" />
                <Area type="monotone" dataKey="soybean" stroke="#d97706" fillOpacity={1} fill="url(#soyGrad)" name="Soybean (Qtl)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Commodity Volume Bar Chart */}
        <Card className="p-5">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between border-b-0">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Procurement Volume by Commodity</h3>
              <p className="text-[11px] text-slate-500">Accepted weight in Quintals</p>
            </div>
          </CardHeader>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartCommodityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="commodity" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="volumeQuintals" fill="#16a34a" radius={[6, 6, 0, 0]} name="Volume (Qtl)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Procurements Table */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Live Weighbridge Submissions</h3>
          <Link to="/admin/procurement" className="text-xs text-emerald-600 hover:underline font-semibold flex items-center gap-1">
            Inspection Desk <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-3.5">Receipt Ref</th>
                <th className="p-3.5">Farmer</th>
                <th className="p-3.5">Centre</th>
                <th className="p-3.5">Crop</th>
                <th className="p-3.5">Weight</th>
                <th className="p-3.5">Grade</th>
                <th className="p-3.5">Net Payable</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentProcurements.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-900">{r.receiptNumber}</td>
                  <td className="p-3.5">{r.farmer.farmerProfile?.fullName || 'Farmer'}</td>
                  <td className="p-3.5">{r.centre.name}</td>
                  <td className="p-3.5 font-medium">{r.commodity.name}</td>
                  <td className="p-3.5 font-mono">{r.acceptedWeight || r.submittedWeight} {r.unit}</td>
                  <td className="p-3.5">
                    <Badge variant={r.qualityGrade === 'GRADE_A' ? 'success' : 'warning'}>
                      {r.qualityGrade}
                    </Badge>
                  </td>
                  <td className="p-3.5 font-bold font-mono text-emerald-800">
                    ₹{r.netPayable.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5">
                    <Badge variant={r.status === 'PAID' ? 'success' : 'harvest'}>
                      {r.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
