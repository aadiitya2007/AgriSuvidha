import React from 'react';
import { Sprout, Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-lg">
              <img
                src="/logo.png"
                alt="AgriSuvidha Logo"
                className="w-9 h-9 object-contain rounded-lg"
              />
              <span>Agri<span className="text-amber-500">Suvidha</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              AgriSuvidha (एग्री-सुविधा) — Growth. Prosperity. Innovation. Empowering farmers with transparent digital procurement, AI queue prediction, weather forecasting, computerized grading, and instant DBT payments.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              Smart India Hackathon 2026 (SIH26032) • Team Innov8ors
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Farmer Services</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/book-slot" className="hover:text-white transition-colors">Book Procurement Slot</Link></li>
              <li><Link to="/centres" className="hover:text-white transition-colors">Find Procurement Centre</Link></li>
              <li><Link to="/queue" className="hover:text-white transition-colors">Track Live Queue Token</Link></li>
              <li><Link to="/procurements" className="hover:text-white transition-colors">Download Digital Receipts</Link></li>
              <li><Link to="/store" className="hover:text-white transition-colors">Certified Seeds & Fertilizer</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Centre Operations</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/admin" className="hover:text-white transition-colors">Weighbridge Operator Desk</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Quality Inspection & Grading</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">DBT Payment Disbursals</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Centre Outage Declarations</Link></li>
              <li><a href="/api/docs" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">OpenAPI Documentation</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2.5">
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Kisan Support Helpline</h4>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>Toll Free: 1800-180-1551 (Kisan Call Centre)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Mail className="w-4 h-4 text-emerald-500" />
              <span>support@krishisetu.gov.in</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>Department of Agriculture & Farmers Welfare</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© 2026 AgriSuvidha (एग्री-सुविधा) Platform. Team Innov8ors • SIH26032.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-red-500 inline" /> for the Indian Agricultural Community
          </p>
        </div>
      </div>
    </footer>
  );
};
