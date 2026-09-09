import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { apiRequest } from '../services/api';
import { Camera, KeyRound, Image as ImageIcon, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileScannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      const qrScannerId = 'qr-reader-target';
      let html5QrCode: Html5Qrcode;

      const startScanner = async () => {
        try {
          html5QrCode = new Html5Qrcode(qrScannerId);
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText) => {
              try {
                await html5QrCode.stop();
              } catch (e) {}
              handleVerify('QR', decodedText);
            },
            () => {} // Suppress per-frame scan errors
          );
        } catch (err: any) {
          setError(
            'Live camera stream is blocked on HTTP mobile connections. Please use "Snap / Upload Photo" or enter the 6-digit OTP below.'
          );
          setActiveTab('manual');
        }
      };

      const timer = setTimeout(startScanner, 200);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.stop().catch(() => {}).finally(() => {
            scannerRef.current = null;
          });
        }
      };
    }
  }, [isOpen, activeTab]);

  const handleVerify = async (tokenType: 'QR' | 'OTP', tokenValue: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiRequest('/verification/verify', {
        method: 'POST',
        body: JSON.stringify({
          tokenType,
          tokenValue: tokenValue.trim(),
          centreId,
        }),
      });
      onVerified(data);
      onClose();
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Weighbridge Farmer Check-In" maxWidth="md">
      {/* Hidden element for file scanning */}
      <div id="qr-hidden-file-target" style={{ display: 'none' }} />

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
              placeholder="e.g. 123456 or KS-2026-NGP-001 or ORD-..."
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
            className="w-full font-bold"
          >
            Verify Code & Check In Farmer
          </Button>
        </div>
      )}
    </Modal>
  );
};
