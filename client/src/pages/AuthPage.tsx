import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Sprout, Phone, ShieldCheck, KeyRound, Lock, User, UserPlus } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { loginWithOtp, requestOtp, loginStaff, registerFarmer, quickDemoLogin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register' | 'staff'>('login');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('+91 98230 11001');
  const [otp, setOtp] = useState('');
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Staff Login fields
  const [email, setEmail] = useState('operator.nagpur@agrisuvidha.gov.in');
  const [password, setPassword] = useState('Operator@12345');

  // Register fields
  const [registerData, setRegisterData] = useState({
    fullName: '',
    phone: '',
    email: '',
    village: '',
    district: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440008',
    farmSizeAcres: 5.0,
    preferredLanguage: 'hi',
    farmerRegistrationNumber: '',
    bankAccountNumber: '',
    bankIfsc: 'SBIN0001234',
    consentCommunications: true,
  });

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await requestOtp(phone);
      if (res.demoOtp) {
        setDemoOtpHint(res.demoOtp);
        setOtp(res.demoOtp); // Auto-fill for convenience
      }
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch OTP. Please check the mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithOtp(phone, otp);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginStaff(email, password);
      if (email.toLowerCase().includes('operator')) {
        navigate('/admin/queue');
      } else if (email.toLowerCase().includes('manager')) {
        navigate('/admin/procurement');
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid staff email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerFarmer(registerData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSwitch = async (roleKey: string) => {
    setError(null);
    setLoading(true);
    try {
      await quickDemoLogin(roleKey);
      if (roleKey.startsWith('operator')) {
        navigate('/admin/queue');
      } else if (roleKey.startsWith('manager')) {
        navigate('/admin/procurement');
      } else if (roleKey === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <img
            src="/logo.png"
            alt="AgriSuvidha Logo"
            className="w-16 h-16 object-contain rounded-2xl mx-auto shadow-md mb-2"
          />
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {mode === 'staff' ? 'AgriSuvidha Staff Portal' : mode === 'register' ? 'New Farmer Registration' : 'AgriSuvidha Kisan Login'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {mode === 'staff'
              ? 'Secure access for APMC Weighbridge Operators, Quality Inspectors, and Managers'
              : 'Enter your registered phone number for instant OTP verification'}
          </p>
        </div>

        {/* 1-Click Fast Sandbox Preset Pills */}
        <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl">
          <span className="text-[11px] font-bold text-emerald-900 block mb-2 uppercase tracking-wide flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Hackathon Reviewer 1-Click Demo Login:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
            <button
              onClick={() => handleDemoSwitch('farmer1')}
              className="bg-white hover:bg-emerald-100 text-emerald-900 font-semibold p-2 rounded-lg border border-emerald-300 text-left shadow-2xs transition-colors"
            >
              🌾 <strong>Farmer 1</strong>
              <span className="block text-[10px] text-slate-500 font-normal">Active in Queue</span>
            </button>
            <button
              onClick={() => handleDemoSwitch('farmer2')}
              className="bg-white hover:bg-emerald-100 text-emerald-900 font-semibold p-2 rounded-lg border border-emerald-300 text-left shadow-2xs transition-colors"
            >
              🌾 <strong>Farmer 2</strong>
              <span className="block text-[10px] text-slate-500 font-normal">Waiting in Queue</span>
            </button>
            <button
              onClick={() => handleDemoSwitch('operator')}
              className="bg-white hover:bg-sky-100 text-sky-900 font-semibold p-2 rounded-lg border border-sky-300 text-left shadow-2xs transition-colors"
            >
              🔍 <strong>Operator</strong>
              <span className="block text-[10px] text-slate-500 font-normal">Nagpur APMC</span>
            </button>
            <button
              onClick={() => handleDemoSwitch('manager')}
              className="bg-white hover:bg-amber-100 text-amber-900 font-semibold p-2 rounded-lg border border-amber-300 text-left shadow-2xs transition-colors"
            >
              💼 <strong>Manager</strong>
              <span className="block text-[10px] text-slate-500 font-normal">Approvals & Payments</span>
            </button>
            <button
              onClick={() => handleDemoSwitch('admin')}
              className="bg-white hover:bg-purple-100 text-purple-900 font-semibold p-2 rounded-lg border border-purple-300 text-left shadow-2xs transition-colors col-span-2 sm:col-span-1"
            >
              ⚙️ <strong>Administrator</strong>
              <span className="block text-[10px] text-slate-500 font-normal">Global System</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => { setMode('login'); setStep('phone'); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Farmer Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            New Farmer
          </button>
          <button
            type="button"
            onClick={() => setMode('staff')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'staff' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Staff Portal
          </button>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <Card className="p-6 shadow-md border-slate-200">
          {/* 1. Farmer Login */}
          {mode === 'login' && (
            <div>
              {step === 'phone' ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <Input
                    label="Mobile Number (दस अंकों का मोबाइल नंबर)"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98230 11001"
                    required
                  />
                  <p className="text-xs text-slate-500">
                    A 6-digit OTP will be generated and shown on screen for instant testing.
                  </p>
                  <Button type="submit" isLoading={loading} className="w-full">
                    Send OTP (ओटीपी भेजें)
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {demoOtpHint && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-medium">
                      Simulated SMS dispatched! Your test OTP is: <strong className="font-mono text-base">{demoOtpHint}</strong>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Enter 6-Digit OTP sent to {phone}
                    </label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="e.g. 123456"
                      className="text-center font-mono text-xl tracking-widest font-bold"
                      required
                    />
                  </div>
                  <Button type="submit" isLoading={loading} className="w-full">
                    Verify & Login (सत्यापित करें)
                  </Button>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="w-full text-xs text-slate-500 hover:underline text-center"
                  >
                    Change phone number
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 2. New Farmer Registration */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <Input
                label="Full Name (पूरा नाम)"
                value={registerData.fullName}
                onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                placeholder="e.g. Ramesh Patil"
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Phone (मोबाइल)"
                  type="tel"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  placeholder="+91 98230 99999"
                  required
                />
                <Input
                  label="Email (Optional)"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  placeholder="farmer@example.com"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Input
                  label="Village (गांव)"
                  value={registerData.village}
                  onChange={(e) => setRegisterData({ ...registerData, village: e.target.value })}
                  placeholder="Saoner"
                  required
                />
                <Input
                  label="District (जिला)"
                  value={registerData.district}
                  onChange={(e) => setRegisterData({ ...registerData, district: e.target.value })}
                  placeholder="Nagpur"
                  required
                />
                <Input
                  label="Pincode"
                  maxLength={6}
                  value={registerData.pincode}
                  onChange={(e) => setRegisterData({ ...registerData, pincode: e.target.value })}
                  placeholder="440008"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Farm Size (Acres)"
                  type="number"
                  step="0.5"
                  value={registerData.farmSizeAcres}
                  onChange={(e) => setRegisterData({ ...registerData, farmSizeAcres: parseFloat(e.target.value) })}
                  required
                />
                <Select
                  label="Preferred Language"
                  value={registerData.preferredLanguage}
                  onChange={(e) => setRegisterData({ ...registerData, preferredLanguage: e.target.value })}
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </Select>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <p className="font-semibold text-slate-700 text-xs">Bank Details for Direct Benefit Transfer (DBT)</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Bank Account Number"
                    placeholder="XXXX-XXXX-4589"
                    value={registerData.bankAccountNumber}
                    onChange={(e) => setRegisterData({ ...registerData, bankAccountNumber: e.target.value })}
                  />
                  <Input
                    label="IFSC Code"
                    placeholder="SBIN0001234"
                    value={registerData.bankIfsc}
                    onChange={(e) => setRegisterData({ ...registerData, bankIfsc: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={registerData.consentCommunications}
                  onChange={(e) => setRegisterData({ ...registerData, consentCommunications: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="consent" className="text-slate-600 text-[11px] leading-tight">
                  I consent to receiving procurement SMS notifications, live queue updates, and DBT status alerts.
                </label>
              </div>
              <Button type="submit" isLoading={loading} className="w-full">
                Register & Create Farmer Profile
              </Button>
            </form>
          )}

          {/* 3. Staff Login */}
          {mode === 'staff' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                  Quick Regional Staff Login (1-Click):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    {
                      name: 'Nagpur Central Hub',
                      opEmail: 'operator.nagpur@agrisuvidha.gov.in',
                      mgrEmail: 'manager.nagpur@agrisuvidha.gov.in',
                      opKey: 'operator-nagpur',
                      mgrKey: 'manager-nagpur',
                    },
                    {
                      name: 'Nashik Onion Yard',
                      opEmail: 'operator.nashik@agrisuvidha.gov.in',
                      mgrEmail: 'manager.nashik@agrisuvidha.gov.in',
                      opKey: 'operator-nashik',
                      mgrKey: 'manager-nashik',
                    },
                    {
                      name: 'Amravati Cotton APMC',
                      opEmail: 'operator.amravati@agrisuvidha.gov.in',
                      mgrEmail: 'manager.amravati@agrisuvidha.gov.in',
                      opKey: 'operator-amravati',
                      mgrKey: 'manager-amravati',
                    },
                    {
                      name: 'Pune Kisan Centre',
                      opEmail: 'operator.pune@agrisuvidha.gov.in',
                      mgrEmail: 'manager.pune@agrisuvidha.gov.in',
                      opKey: 'operator-pune',
                      mgrKey: 'manager-pune',
                    },
                  ].map((c) => (
                    <div key={c.name} className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                      <div className="font-semibold text-slate-800 text-[11px] truncate">{c.name}</div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEmail(c.opEmail);
                            setPassword('Operator@12345');
                            handleDemoSwitch(c.opKey);
                          }}
                          className="flex-1 py-1 px-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded font-medium text-[10px] border border-sky-200 transition-colors text-center cursor-pointer active:scale-95"
                        >
                          🔍 Operator
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmail(c.mgrEmail);
                            setPassword('Manager@12345');
                            handleDemoSwitch(c.mgrKey);
                          }}
                          className="flex-1 py-1 px-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-medium text-[10px] border border-amber-200 transition-colors text-center cursor-pointer active:scale-95"
                        >
                          💼 Manager
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleStaffLogin} className="space-y-4">
                <Input
                  label="Staff Official Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator.nagpur@agrisuvidha.gov.in"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <Button type="submit" isLoading={loading} className="w-full bg-slate-900 hover:bg-slate-800">
                  Sign In to Staff Desk
                </Button>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
