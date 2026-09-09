import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { ProcurementRecord } from '../types';
import { Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface DigitalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ProcurementRecord | null;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Digital Procurement Receipt" maxWidth="lg">
      <div className="space-y-6">
        {/* Printable Area */}
        <div
          id="printable-receipt"
          className="border-2 border-slate-300 rounded-xl p-6 bg-white space-y-6 text-slate-800"
        >
          {/* Header */}
          <div className="text-center pb-4 border-b border-slate-200">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Government Certified Digital Procurement Receipt
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {record.centre?.name || 'Mandi Procurement Hub'}
            </h2>
            <p className="text-xs text-slate-500">{record.centre?.address || 'APMC Yard'}</p>
            <div className="flex justify-between items-center text-xs mt-4 pt-2 border-t border-slate-100 font-mono">
              <span>Receipt No: <strong>{record.receiptNumber}</strong></span>
              <span>Date: {new Date(record.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Farmer & Centre Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">Farmer Information</span>
              <p className="font-bold text-slate-800 text-sm">{record.farmer?.farmerProfile?.fullName || 'Farmer'}</p>
              <p className="text-slate-600">Mobile: {record.farmer?.phone}</p>
              <p className="text-slate-600">Village: {record.farmer?.farmerProfile?.village || 'N/A'}, {record.farmer?.farmerProfile?.district}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">Procurement Yard</span>
              <p className="font-bold text-slate-800 text-sm">{record.centre?.name || 'APMC Yard'}</p>
              <p className="text-slate-600">Code: {record.centre?.code || 'APMC-01'}</p>
              <p className="text-slate-600">Grading Officer: APMC Quality Inspector</p>
            </div>
          </div>

          {/* Weights & Quality Grading Table */}
          <div>
            <span className="text-slate-400 uppercase text-[10px] font-bold block mb-2">Inspection & Grading Specs</span>
            <table className="w-full text-xs text-left border-collapse border border-slate-200">
              <thead className="bg-slate-100 font-semibold text-slate-700">
                <tr>
                  <th className="p-2 border border-slate-200">Commodity</th>
                  <th className="p-2 border border-slate-200">Submitted Wt</th>
                  <th className="p-2 border border-slate-200">Moisture %</th>
                  <th className="p-2 border border-slate-200">Foreign %</th>
                  <th className="p-2 border border-slate-200">Assigned Grade</th>
                  <th className="p-2 border border-slate-200">Accepted Wt</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-slate-200 font-medium">{record.commodity.name}</td>
                  <td className="p-2 border border-slate-200">{record.submittedWeight} {record.unit}</td>
                  <td className="p-2 border border-slate-200">{record.moistureContent}%</td>
                  <td className="p-2 border border-slate-200">{record.foreignMatterPercent}%</td>
                  <td className="p-2 border border-slate-200 font-bold text-emerald-700">{record.qualityGrade}</td>
                  <td className="p-2 border border-slate-200 font-bold">{record.acceptedWeight} {record.unit}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Calculation */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>MSP Rate (per {record.unit}):</span>
              <span className="font-mono">₹{record.ratePerUnit.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Gross Payable ({record.acceptedWeight} {record.unit} × ₹{record.ratePerUnit}):</span>
              <span className="font-mono">₹{record.grossPayable.toLocaleString('en-IN')}</span>
            </div>
            {record.deductions > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Deductions ({record.deductionReason || 'Moisture/Dockage'}):</span>
                <span className="font-mono">-₹{record.deductions.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-slate-900 pt-2 border-t border-emerald-200">
              <span>Net Amount Payable:</span>
              <span className="text-emerald-800 font-mono text-lg">₹{record.netPayable.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment & QR Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-xs space-y-1">
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Payment Status: <span className="uppercase text-emerald-700">{record.payment?.status || record.status}</span>
              </span>
              {record.payment?.transactionReference && (
                <p className="text-slate-500 font-mono text-[11px]">
                  Bank Ref/UTR: {record.payment.transactionReference}
                </p>
              )}
              <p className="text-[10px] text-slate-400">
                Direct Benefit Transfer to registered bank account.
              </p>
            </div>
            <div className="text-center">
              <QRCodeSVG value={`https://krishisetu.gov.in/verify/receipt/${record.receiptNumber}`} size={64} />
              <span className="text-[9px] text-slate-400 block mt-1">Scan to Verify</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print / Save Receipt
          </Button>
        </div>
      </div>
    </Modal>
  );
};
