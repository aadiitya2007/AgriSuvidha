import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from './ui/Modal';
import { ShieldCheck, Copy, Check } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingReference: string;
  qrPayload: string;
  otpCode?: string;
  centreName: string;
  commodityName: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  bookingReference,
  qrPayload,
  otpCode,
  centreName,
  commodityName,
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyOtp = () => {
    if (otpCode) {
      navigator.clipboard.writeText(otpCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Procurement Entry Pass" maxWidth="sm">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          HMAC-SHA256 Cryptographically Signed
        </div>

        <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-inner inline-block">
          <QRCodeSVG value={qrPayload} size={200} level="M" />
        </div>

        <div>
          <h4 className="text-base font-bold text-slate-900">{commodityName}</h4>
          <p className="text-xs text-slate-500">{centreName}</p>
          <p className="text-xs font-mono font-bold text-emerald-700 mt-1">{bookingReference}</p>
        </div>

        {/* Backup 6-Digit OTP */}
        {otpCode && (
          <div className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">
              Backup Entry OTP (If Camera Fails)
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-black tracking-widest text-slate-800 font-mono">
                {otpCode}
              </span>
              <button
                onClick={copyOtp}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                title="Copy OTP"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Show this QR code or 6-digit OTP to the weighbridge operator upon arrival at the APMC gate for rapid automatic token check-in.
        </p>
      </div>
    </Modal>
  );
};
