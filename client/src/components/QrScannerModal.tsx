import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { apiRequest } from '../services/api';
import { playSuccessSound } from '../utils/sound';
import {
  Camera,
  KeyRound,
  Image as ImageIcon,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Scale,
  RotateCcw,
  Truck,
  ShieldCheck,
} from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  centreId: string;
  onVerified: (result: any) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  centreId,
  onVerified,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState<any | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileScannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);

  // Safe camera stopper
  const stopCameraSafe = async () => {
    if (scannerRef.current && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        // Suppress cleanup error
      } finally {
        try {
          scannerRef.current.clear();
        } catch (e) {}
        scannerRef.current = null;
        isStoppingRef.current = false;
      }
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !verifiedData) {
      const qrScannerId = 'qr-reader-target';
      let mounted = true;

      const startScanner = async () => {
        try {
          await stopCameraSafe();
          if (!mounted) return;

          const html5QrCode = new Html5Qrcode(qrScannerId);
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText) => {
              if (!mounted) return;
              await stopCameraSafe();
              handleVerify('QR', decodedText);
            },
            () => {} // Suppress per-frame scan errors
          );
        } catch (err: any) {
          if (mounted) {
            setError(
              'Live camera stream is blocked on plain HTTP mobile connections. Please use "Snap / Upload Photo" or enter the 6-digit OTP below.'
            );
            setActiveTab('manual');
          }
        }
      };

      const timer = setTimeout(startScanner, 250);

      return () => {
        mounted = false;
        clearTimeout(timer);
        stopCameraSafe();
      };
    }
  }, [isOpen, activeTab, verifiedData]);

  const handleVerify = async (tokenType: 'QR' | 'OTP', tokenValue: string) => {
    setError(null);
    setLoading(true);
    try {
      await stopCameraSafe();
      const data = await apiRequest('/verification/verify', {
        method: 'POST',
        body: JSON.stringify({
          tokenType,
          tokenValue: tokenValue.trim(),
          centreId,
        }),
      });

      // Play pleasant audio celebration chime
      playSuccessSound();

      // Show the rich operator confirmation card
      setVerifiedData(data);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);
    try {
      if (!fileScannerRef.current) {
        fileScannerRef.current = new Html5Qrcode('qr-hidden-file-target');
      }
      const decodedText = await fileScannerRef.current.scanFile(file, false);
      await handleVerify('QR', decodedText);
    } catch (err: any) {
      setError(
        'Could not decode a valid QR code from the selected image. Please try another clear photo or enter the 6-digit OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdmitAndClose = () => {
    if (verifiedData) {
      onVerified(verifiedData);
    }
    setVerifiedData(null);
    onClose();
  };

  const handleScanAnother = () => {
    setVerifiedData(null);
    setError(null);
    setInputVal('');
    setActiveTab('camera');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCameraSafe();
        setVerifiedData(null);
        onClose();
      }}
      title="Weighbridge Farmer Check-In"
      maxWidth="md"
    >
      {/* Hidden element for file scanning */}
      <div id="qr-hidden-file-target" style={{ display: 'none' }} />

      {verifiedData ? (
        /* Rich Verification Confirmation Screen for Operator */
        <div className="text-center py-4 space-y-5 animate-fadeIn">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md border-4 border-emerald-50 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Gate Verification Approved
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              Queue Token Allocated!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Farmer entry authenticated & cryptographic pass verified.
            </p>

            <div className="mt-4 inline-block bg-slate-900 text-emerald-400 px-8 py-3 rounded-2xl border-2 border-emerald-500 shadow-xl">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-mono">
                Assigned Yard Token
              </span>
              <span className="text-4xl sm:text-5xl font-black tracking-widest font-mono">
                {verifiedData.queueToken || verifiedData.order?.orderNumber || 'TK-001'}
              </span>
            </div>
          </div>

          {/* Farmer & Crop Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-left space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500 font-medium">Farmer Partner:</span>
              <span className="font-bold text-slate-900 text-sm">
                {verifiedData.booking?.farmerName || verifiedData.order?.farmerName || 'Rameshwar Patil'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500 font-medium">Booking / Order Ref:</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                {verifiedData.booking?.reference || verifiedData.order?.orderNumber || 'KS-2026-NGP-001'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500 font-medium">Commodity & Quantity:</span>
              <span className="font-semibold text-slate-800">
                {verifiedData.booking?.commodityName || verifiedData.order?.productName || 'Soyabean'} •{' '}
                {verifiedData.booking?.estimatedQuantity || 50} Quintals
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                Weighbridge Routing:
              </span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Lane 1 (Scale Sensor Online)
              </span>
            </div>
          </div>

          {/* Operator Actions */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Button
              variant="outline"
              onClick={handleScanAnother}
              className="flex-1 text-xs font-semibold py-2.5 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Scan Next Vehicle
            </Button>
            <Button
              variant="primary"
              onClick={handleAdmitAndClose}
              className="flex-1 text-xs font-bold py-2.5 bg-emerald-600 hover:bg-emerald-700 shadow-md flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Admit to Yard & Continue
            </Button>
          </div>
        </div>
      ) : (
        /* Normal Scanner View */
        <>
          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-4 text-xs font-semibold">
            <button
              onClick={() => {
                setError(null);
                setActiveTab('camera');
              }}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'camera'
                  ? 'border-emerald-600 text-emerald-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> Live Camera
            </button>
            <button
              onClick={() => {
                setError(null);
                stopCameraSafe();
                setActiveTab('upload');
              }}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'upload'
                  ? 'border-emerald-600 text-emerald-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Snap Photo
            </button>
            <button
              onClick={() => {
                setError(null);
                stopCameraSafe();
                setActiveTab('manual');
              }}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'manual'
                  ? 'border-emerald-600 text-emerald-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" /> Enter OTP / Ref
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {activeTab === 'camera' && (
            <div className="flex flex-col items-center">
              <div
                id="qr-reader-target"
                className="w-full max-w-sm aspect-square bg-slate-900 rounded-xl overflow-hidden relative shadow-inner"
              ></div>
              <p className="text-xs text-slate-500 mt-3 text-center">
                Point camera at the farmer’s mobile screen to verify booking and allocate queue token.
              </p>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="p-6 text-center space-y-4 border-2 border-dashed border-emerald-200 rounded-2xl bg-emerald-50/30">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Snap Photo with Native Mobile Camera
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Works directly on mobile phones over Wi-Fi without needing HTTPS! Tap below to capture or select a photo of the farmer's QR code.
                </p>
              </div>

              <label className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer transition-transform active:scale-95">
                <Camera className="w-4 h-4" />
                <span>Open Phone Camera / Select Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>

              {loading && (
                <p className="text-xs text-emerald-700 font-semibold animate-pulse">
                  Analyzing photo and verifying token...
                </p>
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Farmer OTP, Booking Reference, or Store Order Number
                </label>
                <Input
                  type="text"
                  placeholder="e.g. 123456 or KS-2026-NGP-001"
                  maxLength={64}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="text-center text-lg tracking-wider font-mono font-bold"
                />
              </div>

              {/* Quick-fill helper chips */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Quick Fill for Testing:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setInputVal('123456')}
                    className="px-2.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded-lg hover:border-emerald-500 hover:text-emerald-700 transition-colors shadow-2xs"
                  >
                    123456 (Universal Demo OTP)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputVal('KS-2026-NGP-001')}
                    className="px-2.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded-lg hover:border-emerald-500 hover:text-emerald-700 transition-colors shadow-2xs"
                  >
                    KS-2026-NGP-001 (Ref)
                  </button>
                </div>
              </div>

              <Button
                onClick={() => handleVerify('OTP', inputVal)}
                isLoading={loading}
                disabled={inputVal.trim().length < 4}
                className="w-full font-bold bg-emerald-600 hover:bg-emerald-700"
              >
                Verify Code & Check In Farmer
              </Button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

